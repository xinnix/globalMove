const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5002',
      changeOrigin: true,
      secure: false,
      logLevel: 'debug',
      pathRewrite: {
        '^/api': ''  
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log('Proxy Request:', {
          method: proxyReq.method,
          path: proxyReq.path,
          originalUrl: req.originalUrl,
          headers: proxyReq.getHeaders()
        });

        if (req.body) {
          const bodyData = JSON.stringify(req.body);
          proxyReq.setHeader('Content-Type', 'application/json');
          proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
          proxyReq.write(bodyData);
        }
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log('Proxy Response:', {
          statusCode: proxyRes.statusCode,
          headers: proxyRes.headers,
          originalUrl: req.originalUrl,
          path: req.path
        });

        let responseBody = '';
        proxyRes.on('data', function(chunk) {
          responseBody += chunk;
        });
        proxyRes.on('end', function() {
          console.log('Response body:', responseBody);
        });
      },
      onError: (err, req, res) => {
        console.error('Proxy Error:', err);
        res.status(500).json({ error: 'Proxy error', details: err.message });
      }
    })
  );
};
