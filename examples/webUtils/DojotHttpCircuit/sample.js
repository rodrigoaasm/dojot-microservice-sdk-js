const express = require('express');
const {
  WebUtils: {
    DojotHttpCircuit,
  },
  Logger,
} = require('../../../index');

const serverPort = 3009;

// Start test api
const app = express();

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'health' });
});
app.listen(serverPort);

// Set the global logger properties
// Console transport is set by default, but with info level
Logger.setLevel('console', 'debug');
// Enable verbose mode
Logger.setVerbose(true);
// Instantiate a logger wrapper for the application
const logger = new Logger('sample1-secret-handler');

// Initialize dojotHttpCircuit and sets default options
const dojotHttpCircuit = new DojotHttpCircuit({
  defaultClientOptions: { timeout: 5000, baseURL: `http://localhost:${serverPort}` },
  logger,
  serviceName: 'service_a',
});

(async () => {
  // This request will be successful.
  await dojotHttpCircuit.request({
    method: 'get',
    url: 'health',
  }).then((response) => {
    logger.info(response.data);
  }).catch((error) => {
    logger.error(error);
  });

  // This request will fail.
  await dojotHttpCircuit.request({
    method: 'get',
    url: 'out',
  }).then((response) => {
    logger.info(response.data);
  }).catch((error) => {
    logger.error(error);
  });

  // This request will fail.
  await dojotHttpCircuit.request({
    method: 'get',
    url: 'out',
  }).then((response) => {
    logger.info(response.data);
  }).catch((error) => {
    logger.error(error);
  });
})();
