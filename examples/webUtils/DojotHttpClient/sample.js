const express = require('express');
const {
  WebUtils: {
    DojotHttpClient,
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
const dojotClientHttp = new DojotHttpClient({
  defaultClientOptions: { timeout: 5000, baseURL: `http://localhost:${serverPort}` },
  logger,
  defaultRetryDelay: 5000,
  defaultMaxNumberAttempts: 3,
});

(async () => {
  // This request will be successful.
  await dojotClientHttp.request({
    method: 'get',
    url: 'health',
  }).then((response) => {
    logger.info(response.data);
  }).catch((error) => {
    logger.error(error);
  });

  /**
   * Note: Retry delay and maximum number of retries can be customized for each request.
   *
   * This request will fail, One attempt.
  * */
  await dojotClientHttp.request(
    {
      method: 'get',
      url: 'out',
    }, 1000, 1,
  ).then((response) => {
    logger.info(response.data);
  }).catch((error) => {
    logger.error(error);
  });

  // This request will fail. Three time.
  await dojotClientHttp.request(
    {
      method: 'get',
      url: 'out',
    }, 1000, 3,
  ).then((response) => {
    logger.info(response.data);
  }).catch((error) => {
    logger.error(error);
  });

  // This request will fail. Infinity time.
  await dojotClientHttp.request(
    {
      method: 'get',
      url: 'out',
    }, 1000, 0,
  ).then((response) => {
    logger.info(response.data);
  }).catch((error) => {
    logger.error(error);
  });
})();
