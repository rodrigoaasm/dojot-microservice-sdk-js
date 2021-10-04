/* eslint-disable padded-blocks */
const express = require('express');
const bodyParser = require('body-parser');

const {
  Kafka: { Consumer },
  Logger,
  LocalPersistence: {
    LocalPersistenceManager,
    InputPersister,
    InputPersisterArgs,
  },
} = require('../dojot/index');

// Set the global logger properties
// Console transport is set by default, but with info level
Logger.setLevel('console', 'debug');

// Enable verbose mode
Logger.setVerbose(true);

// Instantiate a logger wrapper for the application
const logger = new Logger('sample-local-persistence');

// Define the dispatchs configurations
const config = {
  levels: [
    {
      type: 'dynamic',
      source: 'meta.service',
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
          source: 'data.id',
        },
        value: {
          type: 'static',
          source: true,
        },
      },
    },
  ],
};

// Instantiate a local persistence manager
const dojotDB = new LocalPersistenceManager(logger);


// Initiate local persistence database
dojotDB.init().then(() => {

  // Initiate Input Persistence
  const inputPersister = new InputPersister(dojotDB, config);

  // Instance dojot consumer
  const consumer = new Consumer({
    'enable.async.commit': true,
    'kafka.consumer': {
      'group.id': 'history',
      'metadata.broker.list': 'kafka:9092',
    },
  });

  // Register on consumer's events
  consumer.on('ready', () => logger.info('Received ready event!'));
  consumer.on('disconnected', () => logger.info('Received disconnected event'));
  consumer.on('paused', () => logger.info('Received paused event'));
  consumer.on('resumed', () => logger.info('Received resumed event'));
  consumer.on('error.connecting', () => logger.info('Received error.connecting event'));
  consumer.on('error.processing', (cbId, data) => logger.info(`Received error.processing event (cbId: ${cbId}: data: ${JSON.stringfy(data)}`));

  // Starting listen
  consumer.init().then(() => {

    // The target kafka topic, it could be a String or a RegExp
    const topic = 'admin.dojot.device-manager.device';

    // Callback to notify dispatch success or failure.
    // Note: This callback will not be executed, because the kafka consumer will enter
    // an ack callback in the dispatch callback.
    const errorCallback = () => {};

    // Callback to transform the payload before the dispatches.
    const transformCallback = (data) => {
      const { value: payload } = data;
      return JSON.parse(payload.toString());
    };

    // Callback to filter the dispatches.
    const filterCallback = (data) => data.event === 'create';

    // Gererate dispath callback
    const dispatchCallback = inputPersister.getDispatchCallback(
      InputPersisterArgs.INSERT_OPERATION,
      errorCallback,
      {
        transformCallback,
        filterCallback,
      },
    );

    // Register callback for processing incoming data
    consumer.registerCallback(topic, dispatchCallback);

  }).catch((error) => {
    logger.error(`Caught an error: ${error.stack || error}`);
  });

  // Starting API
  const app = express();
  app.use(bodyParser.json());

  // Routes
  // Payload dispatch route
  app.post('/dispatch', async (req, res) => {

    // Dispatch payload
    inputPersister.dispatch(req.body, InputPersisterArgs.INSERT_OPERATION).then(() => {
      res.status(201).json();
    }).catch((error) => {
      logger.info(error.message);
      res.status(500).json({ error: error.message });
    });
  });

  // Query route
  app.get('/level/:level/key/:key', async (req, res) => {
    try {
      // Read entry
      const result = await dojotDB.get(req.params.level, req.params.key);
      res.status(200).json({ result });
    } catch (error) {
      logger.info(error);
      res.status(404).send();
    }
  });

  //  Exclusion route
  app.delete('/level/:level/key/:key', async (req, res) => {
    try {
      // Delete entry
      const result = await dojotDB.del(req.params.level, req.params.key);
      res.status(200).json({ result });
    } catch (error) {
      logger.info(error.message);
      res.status(404).send({ error: error.message });
    }
  });

  app.listen(4020, () => {});
});
