const { InputPersister, INSERT_OPERATION, DELETE_OPERATION } = require('../../../lib/localPersistence/inputPersister');

jest.setTimeout(30000);

class LocalPersistenceManagerMock {
  constructor() {
    this.logger = {
      // eslint-disable-next-line no-unused-vars
      debug: (text) => {},
      // eslint-disable-next-line no-unused-vars
      info: (text) => {},
    };
  }

  executeBatchForLevels(ops) {
    this.operations = ops;
  }
}

describe('Input Persister', () => {
  let inputPersister;
  let persistenceManagerMock;
  let payload;
  let config;

  beforeEach(() => {
    payload = {
      test_1: 'test_v1',
      test_2: {
        test_2_1: 'test_v2_1',
      },
    };

    config = {
      levels: [
        {
          type: 'static',
          name: 'tenants',
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
              source: 'test_1',
            },
            value: {
              type: 'dynamic',
              source: 'test_2',
            },
          },
        },
      ],
    };

    persistenceManagerMock = new LocalPersistenceManagerMock();
    inputPersister = new InputPersister(persistenceManagerMock, config);
  });

  it('Should construct the object ', () => {
    expect(inputPersister.config).toEqual(config);
    expect(inputPersister.dojotPersistenceManager).toEqual(persistenceManagerMock);
  });

  it('Should get the values ​​defined in the keypaths', () => {
    const value = InputPersister.get('test_2.test_2_1', payload);
    const unfound = InputPersister.get('test_.test_', payload);
    expect(value).toEqual('test_v2_1');
    expect(unfound).toBeUndefined();
  });

  it('Should return a static configuration level', () => {
    /* Test */
    const preparedConfig = inputPersister.prepareLevel({
      type: 'static',
      name: 'test_1',
    }, undefined);

    /* Matches */
    expect(preparedConfig).toEqual({
      type: 'static',
      name: 'test_1',
      source: 'static',
    });
  });

  it('Should return a dynamic configuration level', () => {
    /* Mocks */
    InputPersister.get = jest.fn(() => 'test_level');

    /* Test */
    const preparedConfig = inputPersister.prepareLevel({
      type: 'dynamic',
      source: 'test_1',
    }, undefined);

    /* Matches */
    expect(preparedConfig).toEqual({
      type: 'dynamic',
      name: 'test_level',
      source: 'test_1',
    });
  });

  it('Should return data extracted from the payload, when all fields are informed in the dynamic frame', () => {
    /* Mocks */
    InputPersister.get = jest.fn(() => 'test_pair');

    /* Test */
    const data = inputPersister.extractData({
      level: 0,
      pair: {
        key: {
          type: 'dynamic',
          source: 'data.label',
        },
        value: {
          type: 'dynamic',
          source: 'data.value',
        },
      },
    }, undefined);

    /* Matches */
    expect(data).toEqual({
      key: 'test_pair',
      value: 'test_pair',
    });
  });

  it('Should return an undefined value, when any of the fields is not informed in the dynamic frame', () => {
    /* Mocks */
    InputPersister.get = jest.fn(() => 'test_pair');

    /* Test 1 */
    let data = inputPersister.extractData({
      level: 0,
      pair: {
        key: {
          type: 'dynamic',
        },
        value: {
          type: 'dynamic',
          source: 'data.value',
        },
      },
    }, undefined);
    expect(data).toBeUndefined();

    /* Test 2 */
    data = inputPersister.extractData({
      level: 0,
      pair: {
        key: {
          type: 'dynamic',
          source: 'data.label',
        },
        value: {
          type: 'dynamic',
        },
      },
    }, undefined);
    expect(data).toBeUndefined();
  });

  it('Should return an undefined value, when the dynamic frame keypath does not represent any defined value', () => {
    /* Mocks */
    InputPersister.get = jest.fn(() => undefined);

    /* Test */
    const data = inputPersister.extractData({
      level: 0,
      pair: {
        key: {
          type: 'dynamic',
          source: 'data.value',
        },
        value: {
          type: 'dynamic',
          source: 'data.value',
        },
      },
    }, undefined);

    /* Matches */
    expect(data).toBeUndefined();
  });

  it('Should return a static data, when all fields are informed in the static frame', () => {
    /* Mocks */
    InputPersister.get = jest.fn(() => 'test_pair');

    /* Test */
    const data = inputPersister.extractData({
      level: 0,
      pair: {
        key: {
          type: 'static',
          source: 'key_static',
        },
        value: {
          type: 'static',
          source: 'value_static',
        },
      },
    }, undefined);

    /* Matches */
    expect(data).toEqual({
      key: 'key_static',
      value: 'value_static',
    });
  });

  it('Should return an undefined value, when any of the fields is not informed in the static frame', () => {
    /* Mocks */
    InputPersister.get = jest.fn(() => 'test_pair');

    /* Test 1 */
    let data = inputPersister.extractData({
      level: 0,
      pair: {
        key: {
          type: 'static',
        },
        value: {
          type: 'static',
          source: 'data.value',
        },
      },
    }, undefined);
    expect(data).toBeUndefined();

    /* Test 2 */
    data = inputPersister.extractData({
      level: 0,
      pair: {
        key: {
          type: 'static',
          source: 'data.label',
        },
        value: {
          type: 'static',
        },
      },
    }, undefined);
    expect(data).toBeUndefined();
  });

  it('Should send a batch of insertion operations for execution', async () => {
    /* Mocks */
    // eslint-disable-next-line no-unused-vars
    inputPersister.prepareLevel = jest.fn((levelConfig, data) => ({
      ...levelConfig,
      source: 'static',
    }));
    // eslint-disable-next-line no-unused-vars
    inputPersister.extractData = jest.fn((frame, data) => ({
      key: 'test_v1',
      value: {
        test_2_1: 'test_v2_1',
      },
    }));

    /* Prepare */
    const expectedOperations = new Map();
    expectedOperations.set('tenants', {
      config: {
        ...(config.levels[0]),
        source: 'static',
      },
      operations: [
        {
          type: 'put',
          key: 'test_v1',
          value: {
            test_2_1: 'test_v2_1',
          },
        },
      ],
    });

    /* Test */
    await inputPersister.dispatch(payload, INSERT_OPERATION);

    /* Matches */
    expect(persistenceManagerMock.operations).toEqual(expectedOperations);
  });

  it('Should send a batch of deletion operations for execution', async () => {
    /* Mocks */
    // eslint-disable-next-line no-unused-vars
    inputPersister.prepareLevel = jest.fn((levelConfig, data) => ({
      ...levelConfig,
      source: 'static',
    }));
    // eslint-disable-next-line no-unused-vars
    inputPersister.extractData = jest.fn((frame, data) => ({
      key: 'test_v1',
      value: {
        test_2_1: 'test_v2_1',
      },
    }));

    /* Prepare */
    const expectedOperations = new Map();
    expectedOperations.set('tenants', {
      config: {
        ...(config.levels[0]),
        source: 'static',
      },
      operations: [
        {
          type: 'del',
          key: 'test_v1',
        },
      ],
    });

    /* Test */
    await inputPersister.dispatch(payload, DELETE_OPERATION);

    /* Matches */
    expect(persistenceManagerMock.operations).toEqual(expectedOperations);
  });

  it('Should execute dispatch callback successfully, when optional callbacks have not been entered', (done) => {
    /* Mocks */
    // eslint-disable-next-line no-unused-vars
    inputPersister.dispatch = jest.fn(async (data, operationType) => {});

    /* Matches - Callbacks */
    function errorCallback(error) {
      expect(error).toBeNull();
      done();
    }

    /* Test */
    const dispatchCallback = inputPersister.getDispatchCallback(
      INSERT_OPERATION, errorCallback, {},
    );
    dispatchCallback(payload);
  });

  it('Should execute dispatch callback successfully, when filterCallback returns true', (done) => {
    /* Mocks */
    // eslint-disable-next-line no-unused-vars
    inputPersister.dispatch = jest.fn(async (data, operationType) => {});

    /* Matches - Callbacks */
    function errorCallback(error) {
      expect(error).toBeNull();
      done();
    }

    function filterCallback(data) {
      expect(payload).toEqual(data);
      return true;
    }

    /* Test */
    const dispatchCallback = inputPersister.getDispatchCallback(
      INSERT_OPERATION, errorCallback, { filterCallback },
    );
    dispatchCallback(payload);
  });

  it('Should not execute dispatch, when filterCallback returns false', (done) => {
    /* Mocks */
    // eslint-disable-next-line no-unused-vars
    inputPersister.dispatch = jest.fn(async (data, operationType) => {});

    /* Matches - Callbacks */
    function errorCallback(error) {
      expect(error.message).toEqual('The data does not satisfy the filter condition');
      done();
    }

    function filterCallback(data) {
      expect(data).toEqual(payload);
      return false;
    }

    /* Test */
    const dispatchCallback = inputPersister.getDispatchCallback(
      INSERT_OPERATION, errorCallback, { filterCallback },
    );
    dispatchCallback(payload);
  });

  it('Should not execute dispatch, when filterCallback throw a error', (done) => {
    /* Mocks */
    // eslint-disable-next-line no-unused-vars
    inputPersister.dispatch = jest.fn(async (data, operationType) => {});

    /* Matches - Callbacks */
    function errorCallback(error) {
      expect(error).toBeDefined();
      done();
    }

    // eslint-disable-next-line no-unused-vars
    function filterCallback(data) {
      throw new Error('forced');
    }

    /* Test */
    const dispatchCallback = inputPersister.getDispatchCallback(
      INSERT_OPERATION, errorCallback, { filterCallback },
    );
    dispatchCallback(payload);
  });

  it('Should execute dispatch callback successfully, when a transformCallback have been entered', (done) => {
    /* Mocks */
    // eslint-disable-next-line no-unused-vars
    inputPersister.dispatch = jest.fn(async (data, operationType) => {});

    /* Matches - Callbacks */
    function errorCallback(error) {
      expect(error).toBeNull();
      done();
    }

    function transformCallback(data) {
      expect(data).toEqual(payload);
      return 'transformed data';
    }

    /* Test */
    const dispatchCallback = inputPersister.getDispatchCallback(
      INSERT_OPERATION, errorCallback, { transformCallback },
    );
    dispatchCallback(payload);
  });

  it('Should not execute dispatch, when transformCallback throw a error', (done) => {
    /* Mocks */
    // eslint-disable-next-line no-unused-vars
    inputPersister.dispatch = jest.fn(async (data, operationType) => {});

    /* Matches - Callbacks */
    function errorCallback(error) {
      expect(error).toBeDefined();
      done();
    }

    // eslint-disable-next-line no-unused-vars
    function transformCallback(data) {
      throw new Error('forced');
    }

    /* Test */
    const dispatchCallback = inputPersister.getDispatchCallback(
      INSERT_OPERATION, errorCallback, { transformCallback },
    );
    dispatchCallback(payload);
  });

  it('Should throw a error, when dispatchCallback fails', (done) => {
    /* Mocks */
    // eslint-disable-next-line no-unused-vars
    inputPersister.dispatch = jest.fn((data, operationType) => {
      throw new Error('forced');
    });

    /* Matches - Callbacks */
    function errorCallback(error) {
      expect(error).toBeDefined();
      done();
    }

    /* Test */
    const dispatchCallback = inputPersister.getDispatchCallback(
      INSERT_OPERATION, errorCallback, {},
    );
    dispatchCallback(payload);
  });
});
