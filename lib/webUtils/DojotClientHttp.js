const { default: axios } = require('axios');

module.exports = class DojotClientHttp {
  constructor({
    defaultClientOptions, logger, defaultRetryDelay = 5000, defaultMaxNumberAttempts = 3,
  }) {
    this.axios = axios.create(defaultClientOptions);
    this.defaultRetryDelay = defaultRetryDelay;
    this.defaultMaxNumberAttempts = defaultMaxNumberAttempts;
    this.logger = logger;
  }

  request(options, retryDelay, maxNumberAttempts) {
    const outerThis = this;
    return new Promise((resolve, reject) => {
      outerThis.doRequest(options, resolve, reject, {
        attempts: 0,
        retryDelay: retryDelay || outerThis.defaultRetryDelay,
        maxNumberAttempts: maxNumberAttempts || this.defaultMaxNumberAttempts,
      });
    });
  }

  retry(requestError, options, resolve, reject, configRetryRequest) {
    const outerThis = this;
    const { attempts, retryDelay, maxNumberAttempts } = configRetryRequest;
    if (maxNumberAttempts > 0 && attempts >= maxNumberAttempts) {
      reject(new Error('Number of attempts exceeded.'));
    } else {
      this.logger.error(requestError.message);
      const newRetryDelay = (requestError.response && requestError.response.status === 429)
        ? retryDelay * 2 : retryDelay;
      this.logger.debug(`Retrying in ${retryDelay}`);

      setTimeout(() => {
        outerThis.logger.debug(`Retrying response - attempt:${attempts + 1}.`);
        outerThis.doRequest(options, resolve, reject, {
          attempts: attempts + 1, retryDelay: newRetryDelay, maxNumberAttempts,
        });
      }, newRetryDelay);
    }
  }

  doRequest(options, resolve, reject, configRetryRequest) {
    this.axios(options).then((response) => {
      resolve(response);
    }).catch((requestError) => {
      this.retry(requestError, options, resolve, reject, configRetryRequest);
    });
  }
};
