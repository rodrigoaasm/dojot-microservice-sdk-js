
const defaultTokenSet = {
  access_token: 'access_token',
  id_token: 'id_token',
  refresh_token: 'refresh_token',
  expires_in: 1,
};

const refreshedTokenSet = {
  access_token: 'access_token_refreshed',
  id_token: 'id_token_refreshed',
  refresh_token: 'refresh_token_refreshed',
  expires_in: 1,
};

const mockClient = {
  grant: jest.fn(() => defaultTokenSet),
  refresh: jest.fn(() => refreshedTokenSet),
};

jest.mock('openid-client', () => ({
  Issuer: {
    discover: () => ({
      Client: jest.fn().mockImplementation(() => mockClient),
    }),
  },
}));

const KeycloakClientSession = require('../../../lib/webUtils/KeycloakClientSession');

const mockLogger = {
  error: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
};

describe('keycloakAuthInterceptor', () => {
  let keycloakSession;
  beforeEach(() => {
    keycloakSession = new KeycloakClientSession(
      'keycloak_url',
'test',
{
        grant_type: 'client-credentials',
        client_id: 'test_id',
        client_secret: 'client_secret',
      },
mockLogger,
{ retryDelay: 20 },
    );
  });

  it('Should start session and schedule refresh.', async () => {
    keycloakSession.setTimeRefresh = (timelifeAccessToken) => {
      expect(timelifeAccessToken).toEqual(1);
    };
    await keycloakSession.start();

    expect(keycloakSession.getTokenSet()).toEqual(defaultTokenSet);
    expect.assertions(2);
  });

  it('Should retry start session when the attempt fails.', async () => {
    mockClient.grant.mockImplementationOnce(() => {
      keycloakSession.doAuthClient = (credentials, resolve) => {
        expect(credentials).toBeDefined();
        resolve();
      };
      throw Error('Error');
    });
    await keycloakSession.start();

    expect.assertions(1);
  });

  it('Should schedule the refresh routine.', (done) => {
    expect.assertions(1);
    keycloakSession.refresh = () => {
      expect(true).toBeTruthy();
      done();
    };
    keycloakSession.setTimeRefresh(1);
  });

  it('Should refresh the access_token', async () => {
    keycloakSession.setTimeRefresh = jest.fn();

    await keycloakSession.start();
    await keycloakSession.refresh();

    expect(keycloakSession.getTokenSet()).toEqual(refreshedTokenSet);
    expect.assertions(1);
  });

  it('Should emit the "update-token" event when the refresh is successful', async () => {
    await keycloakSession.refresh();
    keycloakSession.setTimeRefresh = () => {
    };
    keycloakSession.on('update-token', (tokenSet) => {
      expect(tokenSet).toEqual(refreshedTokenSet);
    });

    expect.assertions(1);
  });

  it('Should restart the session when refresh_token does not exist.', async () => {
    keycloakSession.tokenSet = {
      access_token: 'access_token_refreshed',
      id_token: 'id_token_refreshed',
      expires_in: 1,
    };
    keycloakSession.start = () => {
      expect(true).toBeTruthy();
    };

    await keycloakSession.refresh();

    expect.assertions(1);
  });

  it('Should close the session', async () => {
    keycloakSession.setTimeRefresh = jest.fn();
    await keycloakSession.start();

    keycloakSession.close();

    expect(keycloakSession.client).toBeNull();
    expect(keycloakSession.tokenSet).toBeNull();
  });
});
