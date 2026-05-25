/**
 * Angular dev-server proxy configuration.
 *
 * Problem: when the user refreshes the browser at an Angular route like
 * /reservations, the browser issues a plain GET /reservations with
 * Accept: text/html.  Without a bypass the proxy forwards that to the
 * Spring backend, which returns 401 because no Authorization header is sent.
 *
 * Fix: the bypass() function checks whether the request looks like a browser
 * page-navigation (Accept header contains "text/html").  If it does, it tells
 * the dev server to serve /index.html instead of proxying — Angular's router
 * then takes over on the client side, exactly as it does on a first load.
 */

function bypassHtml(req) {
  const accept = req.headers['accept'] || '';
  if (accept.includes('text/html')) {
    return '/index.html';   // serve the Angular shell, do NOT proxy
  }
  // returning undefined (or nothing) means: go ahead and proxy normally
}

module.exports = {
  '/users': {
    target: 'http://localhost:9090',
    changeOrigin: true,
    secure: false,
    logLevel: 'debug',
    bypass: bypassHtml
  },
  '/reservations': {
    target: 'http://localhost:9090',
    changeOrigin: true,
    secure: false,
    bypass: bypassHtml
  },
  '/slots': {
    target: 'http://localhost:9090',
    changeOrigin: true,
    secure: false,
    bypass: bypassHtml
  },
  '/logs': {
    target: 'http://localhost:9090',
    changeOrigin: true,
    secure: false,
    bypass: bypassHtml
  },
  '/api': {
    target: 'http://localhost:9090',
    changeOrigin: true,
    secure: false,
    bypass: bypassHtml
  }
};
