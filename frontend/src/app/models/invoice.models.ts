export interface CustomerBillDTO {
  invoiceId: number;
  vehicleNumber: string;
  durationMinutes: number;
  amount: number;
  paymentQRCodeBase64: string;
  status: 'PENDING' | 'PAID' | 'CANCELLED';
  createdAt: string;
}

export interface AdminBillDTO {
  invoiceId: number;
  userId: number;
  vehicleNumber: string;
  slotType: string;
  durationMinutes: number;
  amount: number;
  paymentMethod: string;
  status: 'PENDING' | 'PAID' | 'CANCELLED';
  createdAt: string;
}

export interface PaymentRequest {
  invoiceId: number;
  paymentMethod: 'UPI' | 'CASH' | 'CARD' | 'ONLINE';
}
