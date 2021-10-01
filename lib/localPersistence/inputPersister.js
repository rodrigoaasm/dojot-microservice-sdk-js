
const INSERT_OPERATION = 'put';
const DELETE_OPERATION = 'del';

class InputPersister {
  /**
   * Manages automated data entry in local persistence
   *
   * @param {LocalPersistenceManager} localPersistenceManager Dojot local persistence manager
   * @param {*} config Object {
   *  levels: [ // Levels configurations
   *    Object {
   *      type: 'dynamic' | 'static', // 'dynamic'- the level name will be set by the payload data
   *                                  // 'static'- the level name will be set by the 'name' property
   *      source?: string, // Path to field to be set as level name. Used when 'type' is 'dynamic'
   *      name?: string, // Level name. Used when the 'type' is 'static'
   *      options: Level.Options, // Level options
   *    },
   *  ],
   *  frames: [ // Entries configurations
   *    Object {
   *      level: number, // Index of the level in level configurations
   *      pair: Object { // Pair configuration
   *        key: Object { // Key configuration
   *          type: 'dynamic' | 'static', // 'dynamic'- the key will be set by the payload data
   *                                      // 'static'- the key will be set by the 'source'
   *          source: string, // Path to field to be set as value
   *        },
   *        value: Object { // Value configuration
   *          type: 'dynamic' | 'static',
   *          source: string,
   *        }
   *      }
   *    }
   *  ]
   * }
   */
  constructor(localPersistenceManager, config) {
    this.dojotPersistenceManager = localPersistenceManager;
    this.logger = this.dojotPersistenceManager.logger;
    this.config = config;
  }

  /**
   * Gets a value from a path
   *
   * @param {Object} field Path to field to be get
   * @param {object} target Object to read from
   *
   * @returns the data from target
   *
   * @private
   */
  static get(field, target) {
    const source = field.match(/([^.]+)/g);
    let at = source.shift();
    let data = target;
    while (at) {
      // eslint-disable-next-line no-prototype-builtins
      if (!data.hasOwnProperty(at)) {
        return undefined;
      }

      data = data[at];
      at = source.shift();
    }

    return data;
  }

  /**
   * Populates level configuration with payload data when levelConfig.type is 'dynamic'. In case
   * levelConfig.type is static defines levelConfig.source as 'static'
   *
   * @param {*} levelConfig Level configuration entered in Levels configurations
   * @param {*} payload the payload from which the level name will be extracted
   * @returns The level configuration with name defined.
   *
   * @private
   */
  prepareLevel(levelConfig, payload) {
    if (levelConfig.type === 'static') {
      this.logger.debug(`Preparing ${levelConfig.name} level..`);
      return {
        ...levelConfig,
        source: 'static',
      };
    } if (levelConfig.type === 'dynamic') {
      this.logger.debug(`Preparing ${levelConfig.source} level..`);
      return {
        ...levelConfig,
        name: InputPersister.get(levelConfig.source, payload),
      };
    }
    return null;
  }

  /**
   * Extracts an entry from the payload data according to the frame entered.
   *
   * @param {Object} frame The entry configurations
   * @param {Object} payload The payload from which the data will be extracted
   * @returns a entry object
   *
   * @private
   */
  // eslint-disable-next-line class-methods-use-this
  extractData(frame, payload) {
    const data = {};
    Object.keys(frame.pair).forEach((prop) => {
      if (frame.pair[prop].type && frame.pair[prop].source && frame.pair[prop].type === 'dynamic') {
        const value = InputPersister.get(frame.pair[prop].source, payload);
        if (value) {
          data[prop] = value;
        }
      } else if (frame.pair[prop].type && frame.pair[prop].source && frame.pair[prop].type === 'static') {
        data[prop] = frame.pair[prop].source;
      }
    });

    return data.key && data.value ? data : undefined;
  }

  /**
   * Executes entries dispatch with a batch operations.
   *
   * @param {Object} payload the payload from which the data will be extracted.
   * @param {'put' | 'del'} operationType Type of operations that will be executed in batch.
   *
   * @public
   */
  async dispatch(payload, operationType) {
    const operations = new Map();
    this.config.frames.forEach((frame) => {
      const levelConfig = this.config.levels[frame.level];
      const processedLevelConfig = this.prepareLevel(levelConfig, payload);
      const data = this.extractData(frame, payload);

      if (processedLevelConfig && processedLevelConfig.source && data) {
        if (operations.has(levelConfig.source)) {
          const opsLevel = operations.get(processedLevelConfig.name);
          opsLevel.operations.push({ key: data.key, value: data.value });
        } else {
          operations.set(
            processedLevelConfig.name,
            {
              config: processedLevelConfig,
              operations: operationType === INSERT_OPERATION ? [
                { type: operationType, key: data.key, value: data.value },
              ] : [
                { type: operationType, key: data.key },
              ],
            },
          );
        }
      }
    });

    await this.dojotPersistenceManager.executeBatchForLevels(operations);
  }

  /**
   * Returns the dispatch method as a callback function
   *
   * @param {'put' | 'del'} operationType Type of operations that will be executed in batch.
   * @param {Function} errorCallback a callback to notify dispatch success or failure.
   * @param {Object} options Object { // optionals callbacks.
   *  transformCallback?: Function, // a callback to transform the payload.
      filterCallback?: Function, // a callback to filter the dispatches.
   * }
   * @returns the callback to execute the dispatch asynchronously. function (payload, error)
   * Note: By default, the errorCallback that will be executed is the one entered in this function.
   * However, if an errorCallback is entered at the time of calling the dispatchCallback it will
   * be executed instead.
   *
   * @public
   */
  getDispatchCallback(
    operationType,
    errorCallback,
    {
      transformCallback = undefined,
      filterCallback = undefined,
    },
  ) {
    return (payload, hotErrorCallback = undefined) => {
      let data = payload;
      const errorCallbackCurrent = hotErrorCallback || errorCallback;
      if (transformCallback) {
        try {
          data = transformCallback(payload);
        } catch (error) {
          errorCallback(error);
          return;
        }
      }

      try {
        if (!filterCallback || (filterCallback && filterCallback(data))) {
          this.dispatch(data, operationType).then(() => {
            errorCallbackCurrent(null);
          }).catch((error) => {
            errorCallbackCurrent(error);
          });
        } else {
          errorCallbackCurrent(new Error('The data does not satisfy the filter condition'));
        }
      } catch (error) {
        errorCallback(error);
      }
    };
  }
}

module.exports = {
  InputPersister,
  INSERT_OPERATION,
  DELETE_OPERATION,
};
