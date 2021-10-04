/* eslint-disable padded-blocks */
const {
  Logger,
  LocalPersistence: { LocalPersistenceManager, InputPersister, InputPersisterArgs },
} = require('../../../index');

// Set the global logger properties
// Console transport is set by default, but with info level
Logger.setLevel('console', 'debug');

// Enable verbose mode
Logger.setVerbose(true);

// Instantiate a logger wrapper for the application
const logger = new Logger('sample-local-persistence');

// Define the dispatchs configurations
const dispatchConfigExample = {
  levels: [
    {
      type: 'static',
      name: 'example_2',
      options: {
        keyEncoding: 'utf8',
        valueEncoding: 'utf8',
      },
    },
  ],
  frames: [
    {
      level: 0,
      pair: {
        key: {
          type: 'dynamic',
          source: 'data.key',
        },
        value: {
          type: 'dynamic',
          source: 'data.value',
        },
      },
    },
  ],
};

// Example payload
const payloadExample = {
  data: {
    key: 'example_key_2',
    value: 'example_value_2',
  },
};

// Instantiate a local persistence manager
const localPersistence = new LocalPersistenceManager(logger, true);

// Initiate local persistence database
localPersistence.init().then(() => {

  // Initiate Input Persistence
  const inputPersister = new InputPersister(localPersistence, dispatchConfigExample);

  // Executes payload dispatch
  inputPersister.dispatch(payloadExample, InputPersisterArgs.INSERT_OPERATION).then(() => {

    // Reading data
    localPersistence.get('example_2', 'example_key_2').then((value) => {
      logger.info(`Value: ${value}`);

    }).catch(() => {
      logger.info('It was not possible to read the data');
    });

  }).catch((error) => {
    logger.info('It was not possible to execute the dispatch');
    logger.debug(error.message);
  });

}).catch((error) => {
  logger.info('It was not possible to initiate the database');
  logger.debug(error.message);
});
