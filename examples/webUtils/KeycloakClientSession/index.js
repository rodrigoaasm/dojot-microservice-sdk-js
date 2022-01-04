const {
  WebUtils: {
    KeycloakClientSession,
  },
  Logger,
} = require('../../../index');

const KEYCLOAK_URI = 'http://localhost:8080';
const KEYCLOAK_REALM = 'master';
const KEYCLOAK_CLIENT_ID = 'sample_client';
const KEYCLOAK_CLIENT_SECRET = 'secret';

// Set the global logger properties
// Console transport is set by default, but with info level
Logger.setLevel('console', 'debug');
// Enable verbose mode
Logger.setVerbose(true);
// Instantiate a logger wrapper for the application
const logger = new Logger('sample1-secret-handler');

/**
 *  Prepare the connection for keycloak by entering
 * credentials and other keycloak information
 */
const keycloakClientSession = new KeycloakClientSession(
  KEYCLOAK_URI,
  KEYCLOAK_REALM,
  {
    credentials: 'client_credentials',
    client_id: KEYCLOAK_CLIENT_ID,
    client_secret: KEYCLOAK_CLIENT_SECRET,
  },
  logger,
  {
    retryDelay: 5000,
  },
);

/**
 * When the connection is stabilized or updated, this event
 * will be emitted with the set of tokens.
 */
keycloakClientSession.on('update-token', (tokenSet) => {
  logger.info(tokenSet);
});

// Start session
keycloakClientSession.start().then(() => {
  logger.info('Successfully connected to keycloak.');
}).catch((error) => {
  logger.error(error);
});

/**
 * Note: login, update and retry on failure will be automatic
 */
