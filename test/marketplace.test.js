import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';

describe('WedPlan Marketplace & Access Control Tests', () => {
  let server;
  let baseUrl;

  test('setup marketplace test server', async () => {
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  test('GET /api/v1/categories returns list of active wedding categories', async () => {
    const res = await fetch(`${baseUrl}/api/v1/categories`);
    assert.strictEqual(res.status, 200);

    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.length > 0);
  });

  test('GET /api/v1/services returns 200 with pagination structure', async () => {
    const res = await fetch(`${baseUrl}/api/v1/services`);
    assert.strictEqual(res.status, 200);

    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data.services));
    assert.ok(body.data.pagination);
  });

  test('GET /api/v1/admin/stats blocks unauthenticated requests (HTTP 401)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/admin/stats`);
    assert.strictEqual(res.status, 401);

    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.match(body.message, /Not authenticated/);
  });

  test('POST /api/v1/services blocks unauthenticated requests (HTTP 401)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Test Hall', startingPrice: 100000 })
    });
    assert.strictEqual(res.status, 401);
  });

  test('teardown marketplace test server', async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });
});
