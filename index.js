const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

const secret = process.env.SECRET; // Get the secret from environment variables

app.use(bodyParser.json());

app.post('/api/update', (req, res) => {
  const { route, jsFile } = req.body;
  const secretKey = req.headers.secret; // Get the secret key from the request header

  if (!secretKey || secretKey !== secret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!route || !jsFile) {
    return res.status(400).json({ error: 'Missing route or jsFile' });
  }

  try {
    const filePath = path.join(__dirname, 'routes', `${route}.js`);
    fs.writeFileSync(filePath, jsFile);
    console.log(`File written to ${filePath}`);
    res.json({ message: 'File updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update file' });
  }
});

// Function to dynamically load and execute route handlers
function loadRoutes(req, res, next) {
  const routePath = path.join(__dirname, 'routes', `${req.path}.js`);

  try {
    // Check if the route file exists
    if (fs.existsSync(routePath)) {
      const routeHandler = require(routePath);
      // Call the route handler
      if (routeHandler && typeof routeHandler === 'function') {
        routeHandler(req, res, next); // Pass next for potential middleware usage
      } else {
        res.status(404).json({ error: 'Route handler not found' });
      }
    } else {
      res.status(404).json({ error: 'Route not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error loading route handler' });
  }
}

// Apply CORS headers to all responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // Allow requests from any origin
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next(); // Move to the next middleware or route handler
});

// Dynamically load routes
app.use('/api', loadRoutes);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
