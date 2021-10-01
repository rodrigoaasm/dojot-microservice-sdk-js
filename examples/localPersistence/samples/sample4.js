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
      name: 'example_4',
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
    key: 'example_key_4',
    value: {
      example_value_4: 'example_value_4',
    },
  },
};

const payloadExample2 = {
  data: {
    key: 'not_processed',
    value: 'not_processed',
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
      logger.debug(error.message);
    } else {

      // Reading data
      localPersistence.get('example_4', 'example_key_4').then((value) => {
        logger.info(`Value: ${value}`);

      }).catch(() => {
        logger.info('It was not possible to read the data');
      });
    }
  };

  // Callback to filter the dispatches.
  const filterCallback = (payload) => payload.data.key !== 'not_processed';

  // Gererate dispath callback
  const dispatchCallback = inputPersister.getDispatchCallback(
    InputPersisterArgs.INSERT_OPERATION,
    errorCallback,
    {
      filterCallback,
    },
  );

  // Execute dispath callback
  dispatchCallback(payloadExample);
  // Execute dispath callback that will be ignored
  dispatchCallback(payloadExample2);

}).catch((error) => {
  logger.info('It was not possible to initiate the database');
  logger.debug(error.message);
});
