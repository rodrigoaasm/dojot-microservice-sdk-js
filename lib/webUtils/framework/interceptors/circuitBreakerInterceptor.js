const { DojotHttpCircuitStates } = require('../../DojotHttpCircuit');
const { ServiceUnavailable } = require('../backing/errorTemplate');

function createCircuitBreakerInterceptor(circuits, path = '/') {
  return {
    path,
    name: 'circuit-breaker-interceptor',
    middleware: (
      req, res, next,
    ) => {
      const openCircuits = circuits
        .filter((circuit) => circuit.status === DojotHttpCircuitStates.open);
      if (openCircuits.length === 0) {
        next();
      } else {
        next(ServiceUnavailable('Service unavailable', `${openCircuits.length} dependencies is unavailable`));
      }
    },
  };
}

module.exports = createCircuitBreakerInterceptor;
