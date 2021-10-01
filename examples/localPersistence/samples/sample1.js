/* eslint-disable padded-blocks */
const { Logger, LocalPersistence: { LocalPersistenceManager } } = require('../../../index');

// Set the global logger properties
// Console transport is set by default, but with info level
Logger.setLevel('console', 'debug');

// Enable verbose mode
Logger.setVerbose(true);

// Instantiate a logger wrapper for the application
const logger = new Logger('sample-local-persistence');

// Instantiate a local persistence manager
const localPersistence = new LocalPersistenceManager(logger, true);

// Initiate local persistence database
localPersistence.init().then(() => {

  // Writing data
  localPersistence.put('example_1', 'example_key_1', 'example_value_1').then(() => {

    // Reading data
    localPersistence.get('example_1', 'example_key_1').then((value) => {
      logger.info(`Value: ${value}`);

    }).catch(() => {
      logger.info('It was not possible to read the data');
    });

  }).catch((error) => {
    logger.info('It was not possible to write the data');
    logger.debug(error.message);
  });

}).catch((error) => {
  logger.info('It was not possible to initiate the database');
  logger.debug(error.message);
});
