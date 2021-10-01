const LocalPersistenceManager = require('./localPersistenceManager');
const { InputPersister, INSERT_OPERATION, DELETE_OPERATION } = require('./inputPersister');

module.exports = {
  LocalPersistenceManager,
  InputPersister,
  InputPersisterArgs: {
    INSERT_OPERATION,
    DELETE_OPERATION,
  },
};
