const DojotHttpClient = require('./DojotHttpClient');

const states = {
  open: 'open',
  closed: 'closed',
  halfOpen: 'half-open',
};

/**
 * This module  execute an http request applying circuit breaker pattern.
 */
class DojotHttpCircuit extends DojotHttpClient {
  /**
   *
   * @param {string} serviceName the service name with which a circuit will be created.
   * @param {dojot.Logger} logger The Dojot logger.
   * @param {number} defaultRetryDelay Default retry delay for failed requests.
   * @param {number} attemptsThreshold Number of failed attempts to open the circuit breaker.
   * @param {number} resetTimeout Time for the circuit to be half-open
   * @param {string} initialState Initial state ('open', 'close', 'half-close')
   * @param {axios.AxiosRequestConfig} defaultClientOptions The axios request config
   *
   */
  constructor({
    serviceName,
    logger,
    defaultRetryDelay = 5000,
    attemptsThreshold = 3,
    resetTimeout = 30000,
    initialState = states.closed,
    defaultClientOptions,
  }) {
    super({
      defaultClientOptions,
      logger,
      defaultRetryDelay,
      defaultMaxNumberAttempts: attemptsThreshold,
    });
    this.status = initialState;
    this.serviceName = serviceName;
    this.resetTimeout = resetTimeout;
  }

  /**
   * Creates HTTP request promise and apply circuit breaker concept
   *
   * @param {axios.AxiosRequestConfig} options The axios request config
   *
   * @returns {Promise<AxiosResponse>} a promise of http response
   *
   * @public
   */
  request(options) {
    const outerThis = this;
    return new Promise((resolve, reject) => {
      const cbResolve = (data) => {
        if (outerThis.status === states.halfOpen) {
          outerThis.logger.debug(`The Http circuit with ${outerThis.serviceName} has been closed.`);
          outerThis.status = states.closed;
        }
        resolve(data);
      };

      const cbReject = (error) => {
        outerThis.lastError = error;
        outerThis.status = states.open;
        outerThis.logger.debug(`The Http circuit with ${outerThis.serviceName} has been opened.`);
        setTimeout(() => {
          outerThis.logger.debug(`The http circuit restart timeout with ${outerThis.serviceName} reached. The circuit is half-open.`);
          outerThis.status = states.halfOpen;
        }, outerThis.resetTimeout);
        reject(error);
      };

      let maxNumberAttempts = outerThis.defaultMaxNumberAttempts;
      if (outerThis.status === states.halfOpen) {
        outerThis.logger.debug(`Trying to close the Http circuit with ${outerThis.serviceName}`);
        maxNumberAttempts = 1;
      } else if (outerThis.status === states.open) {
        outerThis.logger.debug(`The Http circuit with ${outerThis.serviceName} is open.`);
        reject(outerThis.lastError ? outerThis.lastError : new Error('The circuit breaker is opened'));
        return;
      }

      outerThis.doRequest(
        options,
        cbResolve,
        cbReject,
        {
          attempts: 1,
          retryDelay: outerThis.defaultRetryDelay,
          maxNumberAttempts,
        },
      );
    });
  }
}

module.exports = {
  DojotHttpCircuitStates: states,
  DojotHttpCircuit,
};
