const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Use port 3000 by default, but let Next.js handle port selection
const port = process.env.PORT || 3000;

app.prepare().then(() => {
  createServer((req, res) => {
    // Add CORS headers to allow cross-origin requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Parse the URL
    const parsedUrl = parse(req.url, true);

    // Let Next.js handle the request
    handle(req, res, parsedUrl);
  }).listen(port, (err) => {
    if (err) {
      console.error('Error starting server:', err);
      // Try another port if the default is in use
      if (err.code === 'EADDRINUSE') {
        console.log(`Port ${port} is in use, trying another port...`);
      }
      throw err;
    }
    console.log(`> Ready on http://localhost:${port}`);
  });
});
