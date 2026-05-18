package com.cts.project.Vehicle_Logging.service.impl;

import com.cts.project.Vehicle_Logging.client.ParkingSlotClient;
import com.cts.project.Vehicle_Logging.client.ReservationClient;
import com.cts.project.Vehicle_Logging.client.UserClient;
import com.cts.project.Vehicle_Logging.dto.*;
import com.cts.project.Vehicle_Logging.entity.VehicleLog;
import com.cts.project.Vehicle_Logging.enums.LogStatus;
import com.cts.project.Vehicle_Logging.exception.ActiveSessionAlreadyExistsException;
import com.cts.project.Vehicle_Logging.exception.ServiceUnavailableException;
import com.cts.project.Vehicle_Logging.exception.SlotNotAvailableException;
import com.cts.project.Vehicle_Logging.exception.VehicleLogNotFoundException;
import com.cts.project.Vehicle_Logging.repository.VehicleLogRepository;
import com.cts.project.Vehicle_Logging.service.VehicleLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class VehicleLogServiceImpl implements VehicleLogService {

    private final VehicleLogRepository vehicleLogRepository;
    private final ParkingSlotClient parkingSlotClient;
    private final UserClient userClient;
    private final ReservationClient reservationClient;

    // ── ENTRY

    @Override
    public VehicleLogResponse logEntry(EntryRequest request, String authHeader) {
        log.info("Entry request | vehicle={} slotId={} userId={}",
                request.getVehicleNumber(), request.getSlotId(), request.getUserId());

        // 1. Check for duplicate active session
        Optional<VehicleLog> existing = vehicleLogRepository
                .findByVehicleNumberAndStatus(request.getVehicleNumber(), LogStatus.ACTIVE);
        if (existing.isPresent()) {
            log.warn("Duplicate active session | vehicle={}", request.getVehicleNumber());
            throw new ActiveSessionAlreadyExistsException(request.getVehicleNumber());
        }

        // 2. Validate user via Feign
        log.debug("Validating user id={}", request.getUserId());
        UserResponse user = userClient.getUserById(request.getUserId(), authHeader);
        if (user.getId() == -1L) {
            log.error("User-service unavailable | vehicle={}", request.getVehicleNumber());
            throw new ServiceUnavailableException(
                    "User service is currently unavailable. Please try again later.");
        }
        log.debug("User validated | name={}", user.getName());

        // 3. Check reservation-service for an active reservation for this vehicle

        //    TWO PATHS:
        //    PATH A — RESERVED VEHICLE
        //    PATH B — WALK-IN VEHICLE

        Long resolvedSlotId       = null;
        Long matchedReservationId = null;
        boolean isReservedVehicle = false;

        try {
            List<ReservationResponse> activeReservations =
                    reservationClient.getActiveReservations();

            Optional<ReservationResponse> matched =
                    findMatchingReservation(activeReservations, request.getVehicleNumber());

            if (matched.isPresent()) {
                // ── PATH A: RESERVED VEHICLE ──────────────────────────────
                ReservationResponse reservation = matched.get();
                matchedReservationId = reservation.getId();
                isReservedVehicle    = true;

                // Always use the slot from the reservation — ignore request body slotId
                resolvedSlotId = reservation.getSlotId();

                log.info("Reserved vehicle | reservationId={} slotId={} vehicle={}",
                        matchedReservationId, resolvedSlotId, request.getVehicleNumber());

            } else {
                // ── PATH B: WALK-IN VEHICLE ───────────────────────────────
                log.info("Walk-in vehicle | vehicle={}", request.getVehicleNumber());

                // slotId is mandatory for walk-in — must be in request body
                if (request.getSlotId() == null) {
                    log.warn("SlotId missing for walk-in | vehicle={}",
                            request.getVehicleNumber());
                    throw new IllegalArgumentException(
                            "slotId is required for walk-in entries. "
                                    + "Please provide slotId in the request body.");
                }
                resolvedSlotId = request.getSlotId();
            }

        } catch (IllegalArgumentException e) {
            // Re-throw validation errors — do not swallow them
            throw e;
        } catch (Exception e) {
            // Reservation-service is down — treat as walk-in
            log.warn("Reservation-service unavailable. Treating as walk-in | vehicle={}",
                    request.getVehicleNumber());

            if (request.getSlotId() == null) {
                throw new ServiceUnavailableException(
                        "Reservation service is unavailable. "
                                + "Please provide slotId to proceed as walk-in.");
            }
            resolvedSlotId = request.getSlotId();
        }

        // 4. Validate slot via Feign
        log.debug("Validating slot id={}", resolvedSlotId);
        SlotResponseDTO slot = parkingSlotClient.getSlotById(resolvedSlotId, authHeader);
        if ("UNKNOWN".equals(slot.getType())) {
            log.error("Slot-service unavailable | vehicle={}", request.getVehicleNumber());
            throw new ServiceUnavailableException(
                    "Slot service is currently unavailable. Please try again later.");
        }

        // 5. Slot availability check — different logic for each path
        if (isReservedVehicle) {

            // ── RESERVED VEHICLE SLOT CHECK ───────────────────────────────
            boolean physicallyOccupied = vehicleLogRepository
                    .existsBySlotIdAndStatus(resolvedSlotId, LogStatus.ACTIVE);

            if (physicallyOccupied) {
                log.warn("Reserved slot physically occupied | slotId={} reservationId={}",
                        resolvedSlotId, matchedReservationId);
                throw new SlotNotAvailableException(resolvedSlotId,
                        "Your reserved slot " + resolvedSlotId
                                + " is currently physically occupied by another vehicle.");
            }

            log.debug("Reserved slot is physically free | slotId={}", resolvedSlotId);

        } else {

            // ── WALK-IN VEHICLE SLOT CHECK ────────────────────────────────

            int slotStatus = slot.getOccupiedStatus();

            if (slotStatus == 1 || slotStatus == 0) {
                log.warn("Walk-in denied | slot occupied or reserved | slotId={} status={}",
                        resolvedSlotId, slotStatus);
                throw new SlotNotAvailableException(resolvedSlotId,
                        "Slot " + resolvedSlotId
                                + " is not available. It is either occupied or reserved. "
                                + "Please choose a different slot.");
            }

            log.debug("Walk-in slot is free | slotId={} status={}", resolvedSlotId, slotStatus);
        }

        // 6.//actual entry booking happens here
        // Mark slot as OCCUPIED (status = 1) via Feign — same for both paths
        SlotResponseDTO updated = parkingSlotClient.updateSlotStatus(
                resolvedSlotId, 1, authHeader);
        if ("UNKNOWN".equals(updated.getType())) {
            log.error("Slot-service unavailable during update | vehicle={}",
                    request.getVehicleNumber());
            throw new ServiceUnavailableException(
                    "Slot service is currently unavailable. Please try again later.");
        }
        log.info("Slot {} marked as occupied | type={}",
                resolvedSlotId, isReservedVehicle ? "RESERVED" : "WALK-IN");

        // 7. Persist vehicle log
        VehicleLog vehicleLog = VehicleLog.builder()
                .vehicleNumber(request.getVehicleNumber())
                .slotId(resolvedSlotId)
                .userId(request.getUserId())
                .reservationId(matchedReservationId)
                .entryTime(LocalDateTime.now())
                .status(LogStatus.ACTIVE)
                .build();

        VehicleLog saved = vehicleLogRepository.save(vehicleLog);
        log.info("Vehicle log created | logId={} slotId={} reservationId={} type={}",
                saved.getId(),
                saved.getSlotId(),
                saved.getReservationId(),
                saved.getReservationId() != null ? "RESERVED" : "WALK-IN");

        return toResponse(saved);
    }

    // ── EXIT ───────────────────────────────────────────────────────────────

    @Override
    public VehicleLogResponse logExit(ExitRequest request, String authHeader) {
        log.info("Exit request | vehicle={}", request.getVehicleNumber());

        // 1. Find the active log for this vehicle
        VehicleLog vehicleLog = vehicleLogRepository
                .findByVehicleNumberAndStatus(request.getVehicleNumber(), LogStatus.ACTIVE)
                .orElseThrow(() -> {
                    log.warn("No active session | vehicle={}", request.getVehicleNumber());
                    return new VehicleLogNotFoundException(
                            "No active parking session for vehicle: "
                                    + request.getVehicleNumber());
                });

        // 2. Calculate duration
        LocalDateTime exitTime = LocalDateTime.now();
        long duration = ChronoUnit.MINUTES.between(vehicleLog.getEntryTime(), exitTime);
        log.debug("Duration | minutes={}", duration);

        // 3. Free slot via Feign — set back to -1 for both entry types
        SlotResponseDTO freed = parkingSlotClient.updateSlotStatus(
                vehicleLog.getSlotId(), -1, authHeader);
        if ("UNKNOWN".equals(freed.getType())) {
            log.warn("Slot-service unavailable during exit. Slot {} may not be freed.",
                    vehicleLog.getSlotId());
        } else {
            log.info("Slot {} freed | type={}",
                    vehicleLog.getSlotId(),
                    vehicleLog.getReservationId() != null ? "RESERVED" : "WALK-IN");
        }

        // 4. Mark reservation COMPLETED — only for reserved vehicles
        if (vehicleLog.getReservationId() != null) {
            log.debug("Completing reservation id={}", vehicleLog.getReservationId());
            try {

                ReservationResponse existing =
                        reservationClient.getReservationById(vehicleLog.getReservationId());

                if (existing.getId() == -1L) {
                    log.warn("Reservation-service unavailable. Cannot fetch reservation {}.",
                            vehicleLog.getReservationId());
                } else {
                    ReservationUpdateRequest updateRequest = new ReservationUpdateRequest();
                    updateRequest.setVehicleNumber(existing.getVehicleNumber());
                    updateRequest.setStartTime(existing.getStartTime());
                    updateRequest.setEndTime(exitTime);
                    updateRequest.setStatus("COMPLETED");

                    ReservationResponse updated = reservationClient.updateReservation(
                            vehicleLog.getReservationId(), updateRequest);

                    if (updated.getId() == -1L) {
                        log.warn("Could not mark reservation {} as COMPLETED.",
                                vehicleLog.getReservationId());
                    } else {
                        log.info("Reservation {} marked as COMPLETED",
                                vehicleLog.getReservationId());
                    }
                }
            } catch (Exception e) {
                // Reservation update failure must NOT block the vehicle exit
                log.warn("Failed to update reservation {} during exit. Reason: {}",
                        vehicleLog.getReservationId(), e.getMessage());
            }
        } else {
            log.info("Walk-in exit — no reservation to update | vehicle={}",
                    request.getVehicleNumber());
        }

        // 5. Complete the vehicle log
        vehicleLog.setExitTime(exitTime);
        vehicleLog.setDurationMinutes(duration);
        vehicleLog.setStatus(LogStatus.COMPLETED);
        VehicleLog completed = vehicleLogRepository.save(vehicleLog);
        log.info("Log completed | logId={} duration={}min type={}",
                completed.getId(),
                duration,
                completed.getReservationId() != null ? "RESERVED" : "WALK-IN");

        return toResponse(completed);
    }

    // ── QUERIES ────────────────────────────────────────────────────────────

    @Override
    public VehicleLogResponse getLogById(Long logId) {
        log.info("Fetching log | logId={}", logId);
        VehicleLog vl = vehicleLogRepository.findById(logId)
                .orElseThrow(() -> new VehicleLogNotFoundException(
                        "Log not found with id: " + logId));
        return toResponse(vl);
    }

    @Override
    public List<VehicleLogResponse> getLogsByVehicle(String vehicleNumber) {
        log.info("Fetching logs | vehicle={}", vehicleNumber);
        return vehicleLogRepository.findByVehicleNumber(vehicleNumber)
                .stream().map(this::toResponse).toList();
    }

    @Override
    public List<VehicleLogResponse> getAllActiveLogs() {
        log.info("Fetching all active logs");
        return vehicleLogRepository.findByStatus(LogStatus.ACTIVE)
                .stream().map(this::toResponse).toList();
    }

    @Override
    public List<VehicleLogResponse> getAllLogs() {
        log.info("Fetching all logs");
        return vehicleLogRepository.findAll()
                .stream().map(this::toResponse).toList();
    }

    @Override
    public List<VehicleLogResponse> getLogsByUser(Long userId) {
        log.info("Fetching logs | userId={}", userId);
        return vehicleLogRepository.findByUserId(userId)
                .stream().map(this::toResponse).toList();
    }

    // ── HELPER ─────────────────────────────────────────────────────────────

    /**
     * Finds a CONFIRMED reservation matching the vehicle number.
     * Returns Optional.empty() for walk-in vehicles.
     */
    private Optional<ReservationResponse> findMatchingReservation(
            List<ReservationResponse> reservations,
            String vehicleNumber) {
        return reservations.stream()
                .filter(r -> vehicleNumber.equals(r.getVehicleNumber()))
                .findFirst();
    }

    // ── MAPPER ─────────────────────────────────────────────────────────────

    private VehicleLogResponse toResponse(VehicleLog vl) {
        return VehicleLogResponse.builder()
                .logId(vl.getId())
                .vehicleNumber(vl.getVehicleNumber())
                .slotId(vl.getSlotId())
                .userId(vl.getUserId())
                .reservationId(vl.getReservationId())
                .entryTime(vl.getEntryTime())
                .exitTime(vl.getExitTime())
                .durationMinutes(vl.getDurationMinutes())
                .status(vl.getStatus())
                .build();
    }
}