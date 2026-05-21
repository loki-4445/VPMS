/**
 * Angular dev-server proxy configuration.
 *
 * Problem solved here:
 * Paths like /users, /slots, /reservations are BOTH Angular routes AND
 * backend API prefixes.  When the browser refreshes on one of those pages
 * it sends a real HTTP GET with Accept: text/html. Without bypass(), the
 * proxy would forward that request to the Spring API Gateway, which returns
 * 401 "Authorization header is missing."
 *
 * The bypass() function detects browser navigation requests (Accept includes
 * text/html) and returns '/index.html' so Angular bootstraps and handles the
 * route client-side. All other requests (Angular HttpClient API calls) pass
 * through to the backend as normal.
 */

const htmlBypass = (req) => {
  const accept = req.headers['accept'] || '';
  if (accept.includes('text/html')) {
    return '/index.html';
  }
};

module.exports = {
  '/users': {
    target: 'http://localhost:9090',
    changeOrigin: true,
    secure: false,
    logLevel: 'debug',
    bypass: htmlBypass
  },
  '/reservations': {
    target: 'http://localhost:9090',
    changeOrigin: true,
    secure: false,
    bypass: htmlBypass
  },
  '/slots': {
    target: 'http://localhost:9090',
    changeOrigin: true,
    secure: false,
    bypass: htmlBypass
  },
  '/logs': {
    target: 'http://localhost:9090',
    changeOrigin: true,
    secure: false
  },
  '/api': {
    target: 'http://localhost:9090',
    changeOrigin: true,
    secure: false
  }
};
