const {
  WebUtils: {
    SecretFileHandler,
  },
  Logger,
} = require('../../../index');

// Set the global logger properties
// Console transport is set by default, but with info level
Logger.setLevel('console', 'debug');
// Enable verbose mode
Logger.setVerbose(true);
// Instantiate a logger wrapper for the application
const logger = new Logger('sample1-secret-handler');

/**
 * Application configuration must include properties
 * that end with ".file". Case this properties don't
 * exist the secretHandler skip the operation.
 */
const config = {
  service: {
    secret: 'default',
    'secret.file': 'sample-unique-secret',
  },
};

// Init SecretFileHandler
const secretFileHandler = new SecretFileHandler(config, logger);

// Enter in the SecretFileHandler what property it will get or watch.
secretFileHandler.handle('service.secret', 'secret/').then(() => {
  logger.info(config);
}).catch((error) => {
  logger.error(error);
});
