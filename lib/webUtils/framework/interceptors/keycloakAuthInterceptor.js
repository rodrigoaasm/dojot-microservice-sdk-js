const jwt = require('jsonwebtoken');
const { TokenSet } = require('openid-client');
const { Unauthorized } = require('../backing/errorTemplate');
const DojotClientHttp = require('../../DojotClientHttp');
const KeycloakClientSession = require('../../KeycloakClientSession');


/**
 * Format certificate in x5c format
 *
 * @param {string} base64PublicKey Public key in base64
 *
 * @returns rsa cerficate
 */
function formatCertificate(base64PublicKey) {
  let certificate = '-----BEGIN CERTIFICATE-----\n';
  const chucks = base64PublicKey.match(/.{1,64}/g);
  certificate += chucks.join('\n');
  certificate += '\n-----END CERTIFICATE-----';

  return certificate;
}

async function verifyOnlineWithKeycloak(
  tokenRaw, tenant, configKeycloak, logger,
) {
  const httpClient = new DojotClientHttp({
    defaultClientOptions: {},
    logger,
    defaultRetryDelay: 5000,
    defaultMaxNumberAttempts: 3,
  });

  const response = await httpClient.request({
    url: `${configKeycloak.url}/auth/realms/${tenant}/protocol/openid-connect/userinfo`,
    headers: {
      authorization: `Bearer ${tokenRaw}`,
    },
  });

  if (response.status !== 200) {
    throw new Error('Check online direct with keycloak fails');
  }

  // create a temporary session
  const session = new KeycloakClientSession(
    configKeycloak.url, tenant, {}, logger,
  );
  session.setTokenSet(new TokenSet({
    access_token: tokenRaw,
    expires_at: 120000,
  }));

  return {
    id: tenant,
    signatureKey: {},
    session,
  };
}

/**
 * Keycloak Middleware factory - Creates a middleware for verify the access_token of the requests
 *
 * @param {Function} filter The list of known tenants with their certificates
 * @param {*} logger Dojot logger
 * @param {*} path The routes that will be affected
 *
 * @returns a express middleware
 */
function createKeycloakAuthInterceptorWithFilter(
  filter, logger, path = '/', options = {},
) {
  return {
    path,
    name: 'keycloak-auth-interceptor',
    middleware: async (
      req, res, next,
    ) => {
      let prefix;
      let tokenRaw;
      let requestTenant;

      try {
        [prefix, tokenRaw] = req.headers.authorization.split(' ');
      } catch (error) {
        throw Unauthorized('Unauthorized access', 'Invalid access_token');
      }

      if (prefix === 'Bearer') {
        let tenant;
        try {
          logger.info('Decoding access_token.');
          const tokenDecoded = jwt.decode(tokenRaw);
          logger.debug('Getting tenant.');
          requestTenant = tokenDecoded.iss.split('/').pop();
          tenant = filter(requestTenant);
        } catch (decodedError) {
          throw Unauthorized('Unauthorized access', 'Invalid access_token');
        }

        if (requestTenant === 'master' && !options.allowMasterTenant) {
          throw Unauthorized('Unauthorized access', 'Tenant not found or invalid');
        }

        if (tenant) {
          logger.debug('Verify access_token.');
          jwt.verify(
            tokenRaw,
            formatCertificate(tenant.signatureKey.certificate),
            { algorithms: [tenant.signatureKey.algorithm] },
            (verifyTokenError) => {
              if (verifyTokenError) {
                logger.debug(verifyTokenError.message);
                throw Unauthorized('Unauthorized access', verifyTokenError.message);
              }
              logger.debug('Successfully verified.');
              req.tenant = tenant;
              next();
            },
          );
        } else {
          logger.debug('Tenant not found or invalid. Checking online direct with keycloak.');
          if (options && options.verifyOnline && options.configKeycloak) {
            try {
              req.tenant = await verifyOnlineWithKeycloak(
                tokenRaw,
                requestTenant,
                options.configKeycloak,
                logger,
              );

              next();
            } catch (verifyOnlineError) {
              throw Unauthorized('Unauthorized access', 'Tenant not found or invalid');
            }
          } else {
            throw Unauthorized('Unauthorized access', 'Tenant not found or invalid');
          }
        }
      } else {
        logger.debug('Access token is not found');
        throw Unauthorized('Unauthorized access', 'Access token is not found');
      }
    },
  };
}


/**
 * Keycloak Middleware factory - Creates a middleware for verify the access_token of the requests
 *
 * @param {Object {
 *  id: string,
 *  signatureKey: {
 *    certificate: string,
 *    algorithm: string
 *  }
 * }} tenants The list of known tenants with their certificates
 * @param {*} logger Dojot logger
 * @param {*} path The routes that will be affected
 *
 * @returns a express middleware
 */
function createKeycloakAuthInterceptor(
  tenants, logger, path = '/', options = {},
) {
  return createKeycloakAuthInterceptorWithFilter(
    (tenant) => tenants.find((item) => item.id === tenant),
    logger,
    path,
    options,
  );
}

module.exports = {
  createKeycloakAuthInterceptor,
  createKeycloakAuthInterceptorWithFilter,
};
