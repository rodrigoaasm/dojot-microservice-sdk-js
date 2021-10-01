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
localPersistence.init().then(async () => {

  // Writing data
  await localPersistence.put('example_6', 'example_key_1', 'example_value_1');
  await localPersistence.put('example_6', 'example_key_2', 'example_value_2');
  await localPersistence.put('example_6', 'example_key_2', 'example_value_2');

  (await localPersistence.createStream('example_6')).on('data', (data) => {
    logger.info(`key = ${data.key} value = ${data.value}`);
  });

}).catch((error) => {
  logger.info('It was not possible to initiate the database');
  logger.debug(error.message);
});
