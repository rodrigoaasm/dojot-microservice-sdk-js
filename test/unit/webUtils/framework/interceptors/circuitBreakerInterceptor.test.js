const createCircuitBreakerInterceptor = require('../../../../../lib/webUtils/framework/interceptors/circuitBreakerInterceptor');
const { DojotHttpCircuit, DojotHttpCircuitStates } = require('../../../../../lib/webUtils');

describe('Circuit Breaker Interceptor', () => {
  let circuitBreakerInterceptor = null;
  const circuitBreakers = [];

  beforeAll(() => {
    circuitBreakers.push(new DojotHttpCircuit({
      serviceName: 'test1',
      logger: null,
      initialState: DojotHttpCircuitStates.open,
      defaultClientOptions: {},
    }));
    circuitBreakers.push(new DojotHttpCircuit({
      serviceName: 'test2',
      logger: null,
      initialState: DojotHttpCircuitStates.close,
      defaultClientOptions: {},
    }));
    circuitBreakerInterceptor = createCircuitBreakerInterceptor(circuitBreakers);
  });

  it('Should reject the request', () => {
    const request = {};
    const response = {};
    const next = (error) => {
      expect(error).toBeDefined();
    };

    circuitBreakerInterceptor.middleware(
      request, response, next,
    );
    expect.assertions(1);
  });

  it('Should accept the request', () => {
    const request = {};
    const response = {};
    const next = (error) => {
      expect(error).toBeUndefined();
    };

    // closing all circuits
    circuitBreakers.forEach((cb) => {
      // eslint-disable-next-line no-param-reassign
      cb.status = DojotHttpCircuitStates.closed;
    });

    circuitBreakerInterceptor.middleware(
      request, response, next,
    );
    expect.assertions(1);
  });
});
