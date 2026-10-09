import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../app.js';

// Helper to simulate request to Express app without spinning up a live network socket
function mockRequest(app, method, url, { headers = {}, body = null } = {}) {
  return new Promise((resolve) => {
    // Create mock req and res
    const req = {
      method,
      url,
      headers: { 'content-type': 'application/json', ...headers },
      body: body || {},
      ip: '127.0.0.1'
    };

    let statusCode = 200;
    let resHeaders = {};
    let resBody = '';

    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      setHeader(k, v) {
        resHeaders[k] = v;
      },
      json(data) {
        resolve({
          status: statusCode,
          headers: resHeaders,
          body: data
        });
      },
      send(data) {
        resolve({
          status: statusCode,
          headers: resHeaders,
          body: data
        });
      },
      sendFile(path) {
        resolve({
          status: statusCode,
          headers: resHeaders,
          filePath: path
        });
      },
      redirect(path) {
        resolve({
          status: 302,
          redirectUrl: path
        });
      }
    };

    app.handle(req, res);
  });
}

test('API Integration - GET /api/health responds with status ok', async () => {
  const res = await mockRequest(app, 'GET', '/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'ok');
});

test('API Integration - Protected route without JWT token returns 401', async () => {
  const res = await mockRequest(app, 'GET', '/api/transactions');
  assert.equal(res.status, 401);
  assert.equal(res.body.success, false);
  assert.equal(res.body.code, 'AUTH_REQUIRED');
});

test('API Integration - POST /api/auth/signup rejects invalid email', async () => {
  const res = await mockRequest(app, 'POST', '/api/auth/signup', {
    body: { email: 'invalid-email', password: 'Short' }
  });

  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
  assert.equal(res.body.code, 'VALIDATION_FAILED');
});

test('API Integration - POST /api/auth/login rejects empty payload', async () => {
  const res = await mockRequest(app, 'POST', '/api/auth/login', {
    body: {}
  });

  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
  assert.equal(res.body.code, 'VALIDATION_FAILED');
});

test('API Integration - Unknown API endpoint returns 404', async () => {
  const res = await mockRequest(app, 'GET', '/api/nonexistent-route-endpoint');
  assert.equal(res.status, 404);
  assert.equal(res.body.success, false);
  assert.equal(res.body.code, 'RESOURCE_NOT_FOUND');
});
