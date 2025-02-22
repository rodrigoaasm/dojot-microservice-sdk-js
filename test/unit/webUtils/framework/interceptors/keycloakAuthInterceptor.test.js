const jwt = require('jsonwebtoken');

const mockDojotHttpClient = {
  request: jest.fn(),
};

jest.mock('../../../../../lib/webUtils/DojotHttpClient',
  () => jest.fn().mockImplementation(() => mockDojotHttpClient));

const {
  createKeycloakAuthInterceptor,
  createKeycloakAuthInterceptorWithFilter,
} = require('../../../../../lib/webUtils/framework/interceptors/keycloakAuthInterceptor');

const mockLogger = {
  error: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
};

const privateKey = `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA4R9mBEIaygmSpF+4FStSpuM3ssiJmfclPuSjEa1SxK9IhBGq
6ZPuLQxJ9twgA01mQaYxBcSib9ahoCS7j5hHvs4gcweh5F0xX5NCWZ12wUagXzW7
0042TRMVu1rpji9iw4123JGJgPzygBo0J86j5T9qSXmcq3gWGIvrZcsyIK0n1Iiq
Dkr5G4yaIK0tegM/jQVALDMVj4jqU9hO4C2LB3r+uKeOBirRqR9fgBdOiPw3+T3u
UXXeg4EdK1v5p1roklBKOlBiaIW9gsj5ossBNcwpYyns5pxIrgsUvAudibCAyrjB
b/QnY53K5CzT5SExGk8HnE5IQ75bFRhG7JSuMwIDAQABAoIBAQCb7jWpaWhI3QyX
kj1dXF6pfeTMjx7QaGGCCLfyvI0B8y9VWy95DqAAz+xDcwExiGD1w/lct3CT6qSU
2hyYP7AiN4A+bODz3qEeRE/G5syk3xiiGgP5PslZ5Yg996Cifav5K3lTGfOWRp5p
oLzTfcwENEKYlgWwt0MGyZPJNE+KVVkLwVTTE54nPcwj3CKovvfX30vWKlkzi8Tk
KXoieWiQTr1BRCzdvlmcunZY4odqtiq4/Tbj2XMZdoIy6NYK3WWCsCNnWRRXc8bU
QXAMLxfQtU3E+QBjrsKvmUTyrR7olyJZ+95Il3Zh8I0u6hmEzC4nunSCmF8S38I9
iQhwRpUxAoGBAPSPwWcoJFrZEBpYkidyvVrvA48lhrBmD6qwp04HMKstlsynlqrO
7aZfcMxecYXN5omhIVJsM0OPPrw1Goidho2YAGdglpVFcR6wF/LofvqB6FqcXr3/
e42C/5uPqOIBxyUTQrg1Fj2tcXzgNvc4Vu60cOTHW9zSup5IrGVgt63FAoGBAOum
5HiBhFQj8WjjHgVV3gsysQlvIJ4nz2UybtVPk/lAyzntmL4emUQVlW1/PGnsca0K
Y2tbHN8hdOB5fhVgHgFaq7VJQAMdjZvhBpCPPQ8ViY/CUqXb3Wp0E6XFXNjkTx+j
ZPsMtAdG/Y7iV3feiEKrTEY99gIfSDeqN1rSgmOXAoGAJng6fwSUe2nrm4lVLDlj
SduRHsJTZooXas0w9BgzcqnQL88o5yN3xJT8xFkS2G5kFkAvYqy8f6MXxjlAPD8z
PDCt15Uc+swamC4xBjfGSZeHukEgshhvEfqKRKkbcrm+3rkh5KINJpSS5obKfqbx
HclqfMJTU/AeBOn/nE7TddUCgYAkrDFMC6PjUECmeQnX/Lf0eCwS8sdZtYpSDlov
OhYmKQ43cqFdnPdvIAjEJJPrTA+YxVAZifFhTBybPmz/uJiSz2B/cunSUkwSYR+b
aZ8v9MMWq0Afbar0gSH5n1BGtKkXnF7/rsdphoO5M8I29luwPGY/XC8nv2SGvSem
K7J8+wKBgQDFMDJtAuiXSMQzeW5GfwB46CqQ98YSXaAiytfZ5reKsXZlreCher2T
mbmPeT9gnYiXYRE0xp1lLGPrd8MdPLp/SNU6s+VFbdmEVorLnE28/Ra2CTOQkIdG
ZpVt/Uei5cBM57E+phH4Xh1JT1wQRJlXrx1pYDVZ4XYnD9TrV5RhWw==
-----END RSA PRIVATE KEY-----`;

const tenants = [{
  id: 'test',
  signatureKey: {
    certificate: 'MIIDmTCCAoGgAwIBAgIUOMd65CpRqdo3cplYmLqD1hr3b34wDQYJKoZIhvcNAQELBQAwXDELMAkGA1UEBhMCQlIxCzAJBgNVBAgMAk1HMRMwEQYDVQQHDApJdGFqdWLDg8KhMQ0wCwYDVQQKDARDUFFEMQ0wCwYDVQQLDARDUFFEMQ0wCwYDVQQDDARDUFFEMB4XDTIxMTIxMzExMTY0NloXDTMxMTIxMTExMTY0NlowXDELMAkGA1UEBhMCQlIxCzAJBgNVBAgMAk1HMRMwEQYDVQQHDApJdGFqdWLDg8KhMQ0wCwYDVQQKDARDUFFEMQ0wCwYDVQQLDARDUFFEMQ0wCwYDVQQDDARDUFFEMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA4R9mBEIaygmSpF+4FStSpuM3ssiJmfclPuSjEa1SxK9IhBGq6ZPuLQxJ9twgA01mQaYxBcSib9ahoCS7j5hHvs4gcweh5F0xX5NCWZ12wUagXzW70042TRMVu1rpji9iw4123JGJgPzygBo0J86j5T9qSXmcq3gWGIvrZcsyIK0n1IiqDkr5G4yaIK0tegM/jQVALDMVj4jqU9hO4C2LB3r+uKeOBirRqR9fgBdOiPw3+T3uUXXeg4EdK1v5p1roklBKOlBiaIW9gsj5ossBNcwpYyns5pxIrgsUvAudibCAyrjBb/QnY53K5CzT5SExGk8HnE5IQ75bFRhG7JSuMwIDAQABo1MwUTAdBgNVHQ4EFgQUHdbxNovwN5pSrBiuZEqAgjt45nowHwYDVR0jBBgwFoAUHdbxNovwN5pSrBiuZEqAgjt45nowDwYDVR0TAQH/BAUwAwEB/zANBgkqhkiG9w0BAQsFAAOCAQEATRtjaoGMIwuEGEMcmi8aNiQXWsGkzHN7a9KRHfKMRYZgrdnXjcNAtHaT33SgiQTywt+GfISkZ8JCG2CdKLTkA94CTq5j+noWWhpjk9cX394wK37eUXSariZ+IhghlBzuEzTIvTYwgveBqNSlup1MlFieqOhiXXTiCGn2IaoYIam1O+bOhuNyrdgmOpClCT3DAuqq9uwG2N1g7Y3sSnFyNpFls9gSQE8LVowfYxuTDiXDUrNxzKjdqvHPiVIbkLl/c9Pt6G/UyIJ08nJgvSxsoNkR/A591gNn/kMGNwMTD5yUg/MKb9e9jyAIFtz5MpxSQuVQWzarwbGGE/TwDIOqnQ==',
    algorithm: 'RS512',
  },
}];

describe('keycloakAuthInterceptor', () => {
  it('Should authorized the request ', async () => {
    const keycloakAuthInterceptor = createKeycloakAuthInterceptor(tenants, mockLogger);

    const token = jwt.sign(
      { iss: 'auth/realms/test' },
      privateKey,
      { expiresIn: 200, header: { alg: 'RS512' } },
    );

    const request = {
      headers: {
        authorization: `Bearer ${token}`,
      },
    };
    const next = (error) => {
      expect(error).toBeUndefined();
    };

    await keycloakAuthInterceptor.middleware(
      request, {}, next,
    );

    expect.assertions(1);
  });

  it('Should not authorize the request when the authorization header does not follow the bearer format ', async () => {
    const keycloakAuthInterceptor = createKeycloakAuthInterceptor(tenants, mockLogger);

    const token = jwt.sign(
      { iss: 'auth/realms/test' },
      privateKey,
      { expiresIn: 200, header: { alg: 'RS512' } },
    );

    const request = {
      headers: {
        authorization: `${token}`,
      },
    };

    try {
      await keycloakAuthInterceptor.middleware(
        request, {}, () => {},
      );
    } catch (httpError) {
      expect(httpError.responseJSON.error).toEqual('Unauthorized access');
      expect(httpError.responseJSON.detail).toEqual('Access token is not found');
    }

    expect.assertions(2);
  });

  it('Should not authorize the request when happen any error.', async () => {
    const keycloakAuthInterceptor = createKeycloakAuthInterceptor(tenants, mockLogger);

    const request = {
      headers: {
        authorization: undefined,
      },
    };

    try {
      await keycloakAuthInterceptor.middleware(
        request, {}, () => {},
      );
    } catch (httpError) {
      expect(httpError).toBeDefined();
    }

    expect.assertions(1);
  });

  it('Should not authorize the request when the tenant does not exist ', async () => {
    const keycloakAuthInterceptor = createKeycloakAuthInterceptor(tenants, mockLogger);

    const token = jwt.sign(
      { iss: 'auth/realms/test_error' },
      privateKey,
      { expiresIn: 200, header: { alg: 'RS512' } },
    );

    const request = {
      headers: {
        authorization: `Bearer ${token}`,
      },
    };

    try {
      await keycloakAuthInterceptor.middleware(
        request, {}, () => {},
      );
    } catch (httpError) {
      expect(httpError.responseJSON.error).toEqual('Unauthorized access');
      expect(httpError.responseJSON.detail).toEqual('Tenant not found or invalid');
    }

    expect.assertions(2);
  });

  it('Should authorized the request when the filter function return a valid tenant', async () => {
    const filter = () => ({
      id: 'test',
      signatureKey: {
        certificate: 'MIIDmTCCAoGgAwIBAgIUOMd65CpRqdo3cplYmLqD1hr3b34wDQYJKoZIhvcNAQELBQAwXDELMAkGA1UEBhMCQlIxCzAJBgNVBAgMAk1HMRMwEQYDVQQHDApJdGFqdWLDg8KhMQ0wCwYDVQQKDARDUFFEMQ0wCwYDVQQLDARDUFFEMQ0wCwYDVQQDDARDUFFEMB4XDTIxMTIxMzExMTY0NloXDTMxMTIxMTExMTY0NlowXDELMAkGA1UEBhMCQlIxCzAJBgNVBAgMAk1HMRMwEQYDVQQHDApJdGFqdWLDg8KhMQ0wCwYDVQQKDARDUFFEMQ0wCwYDVQQLDARDUFFEMQ0wCwYDVQQDDARDUFFEMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA4R9mBEIaygmSpF+4FStSpuM3ssiJmfclPuSjEa1SxK9IhBGq6ZPuLQxJ9twgA01mQaYxBcSib9ahoCS7j5hHvs4gcweh5F0xX5NCWZ12wUagXzW70042TRMVu1rpji9iw4123JGJgPzygBo0J86j5T9qSXmcq3gWGIvrZcsyIK0n1IiqDkr5G4yaIK0tegM/jQVALDMVj4jqU9hO4C2LB3r+uKeOBirRqR9fgBdOiPw3+T3uUXXeg4EdK1v5p1roklBKOlBiaIW9gsj5ossBNcwpYyns5pxIrgsUvAudibCAyrjBb/QnY53K5CzT5SExGk8HnE5IQ75bFRhG7JSuMwIDAQABo1MwUTAdBgNVHQ4EFgQUHdbxNovwN5pSrBiuZEqAgjt45nowHwYDVR0jBBgwFoAUHdbxNovwN5pSrBiuZEqAgjt45nowDwYDVR0TAQH/BAUwAwEB/zANBgkqhkiG9w0BAQsFAAOCAQEATRtjaoGMIwuEGEMcmi8aNiQXWsGkzHN7a9KRHfKMRYZgrdnXjcNAtHaT33SgiQTywt+GfISkZ8JCG2CdKLTkA94CTq5j+noWWhpjk9cX394wK37eUXSariZ+IhghlBzuEzTIvTYwgveBqNSlup1MlFieqOhiXXTiCGn2IaoYIam1O+bOhuNyrdgmOpClCT3DAuqq9uwG2N1g7Y3sSnFyNpFls9gSQE8LVowfYxuTDiXDUrNxzKjdqvHPiVIbkLl/c9Pt6G/UyIJ08nJgvSxsoNkR/A591gNn/kMGNwMTD5yUg/MKb9e9jyAIFtz5MpxSQuVQWzarwbGGE/TwDIOqnQ==',
        algorithm: 'RS512',
      },
    });

    const token = jwt.sign(
      { iss: 'auth/realms/filtered_tenant' },
      privateKey,
      { expiresIn: 200, header: { alg: 'RS512' } },
    );

    const request = {
      headers: {
        authorization: `Bearer ${token}`,
      },
    };
    const next = (error) => {
      expect(error).toBeUndefined();
    };

    const keycloakAuthInterceptor = createKeycloakAuthInterceptorWithFilter(filter, mockLogger);

    await keycloakAuthInterceptor.middleware(
      request, {}, next,
    );

    expect.assertions(1);
  });

  it('Should not authorize the request when the filter function return undefined', async () => {
    const filter = () => undefined;

    const token = jwt.sign(
      { iss: 'auth/realms/filtered_error' },
      privateKey,
      { expiresIn: 200, header: { alg: 'RS512' } },
    );

    const request = {
      headers: {
        authorization: `Bearer ${token}`,
      },
    };

    const keycloakAuthInterceptor = createKeycloakAuthInterceptorWithFilter(filter, mockLogger);
    try {
      await keycloakAuthInterceptor.middleware(
        request, {}, () => {},
      );
    } catch (httpError) {
      expect(httpError.responseJSON.error).toEqual('Unauthorized access');
      expect(httpError.responseJSON.detail).toEqual('Tenant not found or invalid');
    }

    expect.assertions(2);
  });

  it('Should not authorize request when access token belongs to master tenant and options.allowMasterTenant = false', async () => {
    const token = jwt.sign(
      { iss: 'auth/realms/master' },
      privateKey,
      { expiresIn: 200, header: { alg: 'RS512' } },
    );

    const request = {
      headers: {
        authorization: `Bearer ${token}`,
      },
    };

    const keycloakAuthInterceptor = createKeycloakAuthInterceptor(
      [],
      mockLogger,
      '/',
      {
        allowMasterTenant: false,
      },
    );
    try {
      await keycloakAuthInterceptor.middleware(
        request, {}, () => {},
      );
    } catch (httpError) {
      expect(httpError.responseJSON.error).toEqual('Unauthorized access');
      expect(httpError.responseJSON.detail).toEqual('Tenant not found or invalid');
    }

    expect.assertions(2);
  });

  it('Should verify the access token online and authorize request when the tenant does not exist in the list, options.checkOnline = true and verification is ok', async () => {
    mockDojotHttpClient.request.mockResolvedValue({
      status: 200,
    });
    const token = jwt.sign(
      { iss: 'auth/realms/test' },
      privateKey,
      { expiresIn: 200, header: { alg: 'RS512' } },
    );
    const request = {
      headers: {
        authorization: `Bearer ${token}`,
      },
    };

    const keycloakAuthInterceptor = createKeycloakAuthInterceptor(
      [],
      mockLogger,
      '/',
      {
        verifyOnline: true,
        configKeycloak: 'http://localhost:8080',
      },
    );
    const next = (error) => {
      expect(error).toBeUndefined();
    };

    await keycloakAuthInterceptor.middleware(
      request, {}, next,
    );

    expect.assertions(1);
  });

  it('Should verify the access token online and not authorize request when the tenant does not exist in the list, options.checkOnline = true and verification is not ok', async () => {
    mockDojotHttpClient.request.mockResolvedValue({
      status: 401,
    });
    const token = jwt.sign(
      { iss: 'auth/realms/test' },
      privateKey,
      { expiresIn: 200, header: { alg: 'RS512' } },
    );
    const request = {
      headers: {
        authorization: `Bearer ${token}`,
      },
    };

    const keycloakAuthInterceptor = createKeycloakAuthInterceptor(
      [],
      mockLogger,
      '/',
      {
        verifyOnline: true,
        configKeycloak: 'http://localhost:8080',
      },
    );

    try {
      await keycloakAuthInterceptor.middleware(
        request, {}, () => {},
      );
    } catch (httpError) {
      expect(httpError.responseJSON.error).toEqual('Unauthorized access');
      expect(httpError.responseJSON.detail).toEqual('Tenant not found or invalid');
    }

    expect.assertions(2);
  });
});
