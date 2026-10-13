import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';

describe('WedPlan API Health & Error Middleware Tests', () => {
  let server;
  let baseUrl;

  test('setup test server', async () => {
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  test('GET /api/v1/health returns 200 and healthy status', async () => {
    const res = await fetch(`${baseUrl}/api/v1/health`);
    assert.strictEqual(res.status, 200);

    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.status, 'healthy');
    assert.strictEqual(body.data.currency, 'PKR');
    assert.strictEqual(body.data.region, 'Pakistan');
  });

  test('GET /api/v1/non-existent-route returns 404 with ApiError response', async () => {
    const res = await fetch(`${baseUrl}/api/v1/non-existent-route`);
    assert.strictEqual(res.status, 404);

    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.statusCode, 404);
    assert.match(body.message, /Route not found/);
  });

  test('teardown test server', async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });
});
