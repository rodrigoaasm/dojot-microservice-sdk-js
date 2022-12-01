const mockRequest = jest.fn();
const mockAxios = {
  default: {
    create: () => mockRequest,
  },
};
jest.mock('axios', () => mockAxios);

const DojotClientHttp = require('../../../lib/webUtils/DojotHttpClient');

const loggerMock = {
  error: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
};

describe('DojotClientHttp', () => {
  let dojotClientHttp;

  beforeEach(() => {
    dojotClientHttp = new DojotClientHttp({
      defaultClientOptions: { timeout: 5000 },
      logger: loggerMock,
    });
  });

  it('Should init a default client ', () => {
    expect(dojotClientHttp.axios).toBeDefined();
    expect(dojotClientHttp.logger).toBeDefined();
    expect(dojotClientHttp.defaultRetryDelay).toEqual(5000);
    expect(dojotClientHttp.defaultMaxNumberAttempts).toEqual(3);
  });

  it('Should use default options to call the doRequest when no options is entered', async () => {
    dojotClientHttp.doRequest = (
      options, resolve, reject, configRetryRequest,
    ) => {
      expect(configRetryRequest.attempts).toEqual(1);
      expect(configRetryRequest.retryDelay).toEqual(5000);
      expect(configRetryRequest.maxNumberAttempts).toEqual(3);
      resolve();
    };
    await dojotClientHttp.request({});
    expect.assertions(3);
  });

  it('Should use entered options to call the doRequest when the options is entered  ', async () => {
    dojotClientHttp.doRequest = (
      options, resolve, reject, configRetryRequest,
    ) => {
      expect(configRetryRequest.attempts).toEqual(1);
      expect(configRetryRequest.retryDelay).toEqual(7000);
      expect(configRetryRequest.maxNumberAttempts).toEqual(7);
      resolve();
    };
    await dojotClientHttp.request(
      {}, 7000, 7,
    );
    expect.assertions(3);
  });

  it('Should reply a response, when the request is successful', (done) => {
    mockRequest.mockResolvedValue({
      data: 'data',
    });

    const resolve = (response) => {
      expect(response.data).toEqual('data');
      done();
    };
    const reject = () => {};

    dojotClientHttp.doRequest(
      {},
      resolve,
      reject,
      {
        attempts: 0,
        retryDelay: 5000,
        maxNumberAttempts: 3,
      },
    );
    expect.assertions(1);
  });

  it('Should call retry method, when the request fails', (done) => {
    const mockError = new Error('Error');
    mockRequest.mockRejectedValue(mockError);

    dojotClientHttp.retry = (
      // eslint-disable-next-line no-shadow
      requestError, options, resolve, reject, configRetryRequest,
    ) => {
      expect(requestError).toBeDefined();
      expect(options).toBeDefined();
      expect(configRetryRequest).toEqual({
        attempts: 1,
        retryDelay: 5000,
        maxNumberAttempts: 3,
      });
      done();
    };

    dojotClientHttp.request({});
    expect.assertions(3);
  });

  it('Should recall the doRequest method, when the number of attempts has not exceeded the limit.  ', (done) => {
    const requestError = new Error('Error');
    requestError.response = {
      status: 400,
    };
    const resolve = () => {};
    const reject = () => {};

    dojotClientHttp.doRequest = (
      // eslint-disable-next-line no-shadow
      options, resolve, reject, configRetryRequest,
    ) => {
      expect(options).toBeDefined();
      expect(configRetryRequest).toEqual({
        attempts: 2,
        retryDelay: 10,
        maxNumberAttempts: 3,
      });
      done();
    };

    dojotClientHttp.retry(
      requestError, {}, resolve, reject, {
        attempts: 1,
        retryDelay: 10,
        maxNumberAttempts: 3,
      },
    );
    expect.assertions(2);
  });

  it('Should recall the doRequest method with double delay, when http response status is 429 ', (done) => {
    const requestError = new Error('Error');
    requestError.response = {
      status: 429,
    };
    const resolve = () => {};
    const reject = () => {};


    dojotClientHttp.doRequest = (
      // eslint-disable-next-line no-shadow
      options, resolve, reject, configRetryRequest,
    ) => {
      expect(options).toBeDefined();
      expect(configRetryRequest).toEqual({
        attempts: 2,
        retryDelay: 20,
        maxNumberAttempts: 3,
      });
      done();
    };

    dojotClientHttp.retry(
      requestError, {}, resolve, reject, {
        attempts: 1,
        retryDelay: 10,
        maxNumberAttempts: 3,
      },
    );
    expect.assertions(2);
  });

  it('Should reject the promise, when the number of attempts exceeded the limit.', (done) => {
    const requestError = new Error('Error');
    requestError.response = {
      status: 400,
    };
    dojotClientHttp.doRequest = jest.fn();
    const resolve = () => {};
    const reject = (error) => {
      expect(error.message).toEqual('Number of attempts exceeded.');
      expect(error.responseError.status).toEqual(400);
      done();
    };

    dojotClientHttp.retry(
      requestError, {}, resolve, reject, {
        attempts: 3,
        retryDelay: 10,
        maxNumberAttempts: 3,
      },
    );
    expect.assertions(2);
  });

  it('Should init a custom client', () => {
    dojotClientHttp = new DojotClientHttp({
      defaultClientOptions: { timeout: 5000 },
      logger: loggerMock,
      defaultRetryDelay: 10000,
      defaultMaxNumberAttempts: 0,
    });

    expect(dojotClientHttp.axios).toBeDefined();
    expect(dojotClientHttp.logger).toBeDefined();
    expect(dojotClientHttp.defaultRetryDelay).toEqual(10000);
    expect(dojotClientHttp.defaultMaxNumberAttempts).toEqual(0);
  });
});
