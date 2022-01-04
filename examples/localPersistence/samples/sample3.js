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
      name: 'example_3',
      options: {
        keyEncoding: 'utf8',
        valueEncoding: 'json',
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
    key: 'example_key_3',
    value: {
      example_value_3: 'example_value_3',
    },
  },
};

// Instantiate a local persistence manager
const localPersistence = new LocalPersistenceManager(logger, true);

// Initiate local persistence database
localPersistence.init().then(() => {

  // Initiate Input Persistence
  const inputPersister = new InputPersister(localPersistence, dispatchConfigExample);

  // Callback to notify dispatch success or failure.
  const errorCallback = (error) => {
    if (error) {

      // handling error
      logger.info('It was not possible to execute the dispatch');
      logger.debug(error.message);

    } else {

      // Reading data
      localPersistence.get('example_3', 'example_key_3').then((value) => {
        logger.info(`Value: ${value}`);

      }).catch(() => {
        logger.info('It was not possible to read the data');
      });
    }
  };

  // Gererate dispath callback
  const dispatchCallback = inputPersister.getDispatchCallback(
    InputPersisterArgs.INSERT_OPERATION,
    errorCallback,
    {},
  );

  // Execute dispath callback
  dispatchCallback(payloadExample);

}).catch((error) => {
  logger.info('It was not possible to initiate the database');
  logger.debug(error.message);
});
