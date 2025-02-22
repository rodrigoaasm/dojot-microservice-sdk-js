const Consumer = require('./lib/kafka/Consumer');
const Producer = require('./lib/kafka/Producer');
const { Logger } = require('./lib/logging/Logger');
const ConfigManager = require('./lib/configManager');
const ServiceStateManager = require('./lib/serviceStateManager/ServiceStateManager');
const WebUtils = require('./lib/webUtils');
const LocalPersistence = require('./lib/localPersistence');

module.exports = {
  Kafka: {
    Consumer,
    Producer,
  },
  Logger,
  ConfigManager,
  ServiceStateManager,
  WebUtils,
  LocalPersistence,
};
