const express = require('express');
const {
  WebUtils: {
    DojotClientHttp,
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

// Initialize DojotClientHttp and sets default options
const dojotClientHttp = new DojotClientHttp({
  defaultClientOptions: { timeout: 5000, baseURL: `http://localhost:${serverPort}` },
  logger,
  defaultRetryDelay: 5000,
  defaultMaxNumberAttempts: 3,
});

// This request will be successful.
dojotClientHttp.request({
  method: 'get',
  url: 'health',
}).then((response) => {
  logger.info(response.data);
}).catch((error) => {
  logger.error(error);
});

// This request will fail.
dojotClientHttp.request(
  {
    method: 'get',
    url: 'out',
  }, 1000, 0,
).then((response) => {
  logger.info(response.data);
}).catch((error) => {
  logger.error(error);
});

/**
 * Note: Retry delay and maximum number of retries can be customized for each request.
dojotClientHttp.request({
  method: 'get',
  url: 'out',
}, 3000, 7).then((response) => {
  logger.info(response.data);
}).catch((error) => {
  logger.error(error);
});
*/
