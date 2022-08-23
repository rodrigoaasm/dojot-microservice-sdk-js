const { DojotHttpCircuit } = require('../../../lib/webUtils/DojotHttpCircuit');

// const mockRequest = jest.fn();
// const mockAxios = {
//   default: {
//     create: () => mockRequest,
//   },
// };
// jest.mock('axios', () => mockAxios);

const loggerMock = {
  error: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
};

const mockDoRequest = jest.fn();

describe('DojotClientHttp', () => {
  let dojotHttpCircuit;

  beforeEach(() => {
    dojotHttpCircuit = new DojotHttpCircuit({
      serviceName: 'test-service',
      logger: loggerMock,
      defaultClientOptions: { timeout: 5000 },
      resetTimeout: 1000,
    });
    dojotHttpCircuit.doRequest = mockDoRequest;
  });

  it('Should init a default client ', () => {
    expect(dojotHttpCircuit.axios).toBeDefined();
    expect(dojotHttpCircuit.logger).toBeDefined();
    expect(dojotHttpCircuit.defaultRetryDelay).toEqual(5000);
    expect(dojotHttpCircuit.status).toBeDefined();
    expect(dojotHttpCircuit.serviceName).toBeDefined();
    expect(dojotHttpCircuit.resetTimeout).toBeDefined();
  });

  it('Should use default options to call the doRequest when no options is entered.', async () => {
    mockDoRequest.mockImplementationOnce((
      options, resolve, reject, configRetryRequest,
    ) => {
      expect(configRetryRequest.attempts).toEqual(1);
      expect(configRetryRequest.retryDelay).toEqual(5000);
      expect(configRetryRequest.maxNumberAttempts).toEqual(3);
      resolve();
    });
    await dojotHttpCircuit.request({});
    expect.assertions(3);
  });

  it('Should execute the request successfully when the ccto is closed', async () => {
    mockDoRequest.mockImplementationOnce((
      // eslint-disable-next-line no-unused-vars
      options, resolve, reject, configRetryRequest,
    ) => resolve({ status: 200 }));

    const response = await dojotHttpCircuit.request({});
    expect(response.status).toEqual(200);
  });

  it('Should execute the request and open the ccto when there is a failure.', async () => {
    mockDoRequest.mockImplementationOnce((
      // eslint-disable-next-line no-unused-vars
      options, resolve, reject, configRetryRequest,
    ) => reject(new Error('RequestError')));

    try {
      await dojotHttpCircuit.request({});
    } catch (error) {
      expect(error.message).toEqual('RequestError');
      expect(dojotHttpCircuit.status).toEqual('open');
    }
  });

  it('Should return an error without executing the request when the ccto is open', async () => {
    dojotHttpCircuit.status = 'open';

    try {
      await dojotHttpCircuit.request({});
    } catch (error) {
      expect(error.message).toEqual('The circuit breaker is opened');
      expect(dojotHttpCircuit.status).toEqual('open');
      expect(mockDoRequest).toHaveBeenCalledTimes(0);
    }
  });

  it('Should execute request only once when the ccto is half-open', async () => {
    dojotHttpCircuit.status = 'half-open';

    mockDoRequest.mockImplementationOnce((
      options, resolve, reject, configRetryRequest,
    ) => {
      expect(configRetryRequest.attempts).toEqual(1);
      expect(configRetryRequest.retryDelay).toEqual(5000);
      expect(configRetryRequest.maxNumberAttempts).toEqual(1);
      reject(new Error('RequestError'));
    });
    try {
      await dojotHttpCircuit.request({});
    } catch (error) {
      expect(error).toBeDefined();
    }

    expect.assertions(4);
  });

  it('Should after a request failure open the circuit and in 1s be half open ', (done) => {
    // Generate first error
    mockDoRequest.mockImplementationOnce((
      // eslint-disable-next-line no-unused-vars
      options, resolve, reject, configRetryRequest,
    ) => reject(new Error('RequestError')));

    dojotHttpCircuit.request({}).catch((error) => {
      expect(error).toBeDefined();
    });

    setTimeout(() => {
      expect(dojotHttpCircuit.status).toEqual('half-open');
      done();
    }, 1500);

    expect.assertions(2);
  });

  it('Should close the circuit', async () => {
    dojotHttpCircuit.status = 'half-open';

    mockDoRequest.mockImplementationOnce((
      // eslint-disable-next-line no-unused-vars
      options, resolve, reject, configRetryRequest,
    ) => resolve());

    await dojotHttpCircuit.request({});
    expect(dojotHttpCircuit.status).toEqual('closed');
  });
});
