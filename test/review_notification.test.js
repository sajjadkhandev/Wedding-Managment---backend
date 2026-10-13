import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import { calculateAverageRating } from '../src/controllers/reviewController.js';

describe('WedPlan Reviews, Ratings & Notifications Suite Tests', () => {
  let server;
  let baseUrl;

  test('setup review and notification test server', async () => {
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  test('POST /api/v1/reviews blocks unauthenticated requests (HTTP 401)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vendorId: 'vp-1', rating: 5, comment: 'Great hall!' })
    });
    assert.strictEqual(res.status, 401);

    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.match(body.message, /Not authenticated/);
  });

  test('GET /api/v1/notifications blocks unauthenticated requests (HTTP 401)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/notifications`);
    assert.strictEqual(res.status, 401);
  });

  test('GET /api/v1/reviews/vendor/:id returns 200 and public review stats', async () => {
    const res = await fetch(`${baseUrl}/api/v1/reviews/vendor/vp-demo-123`);
    assert.strictEqual(res.status, 200);

    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.data.reviews);
    assert.ok(body.data.stats);
    assert.strictEqual(typeof body.data.stats.averageRating, 'number');
  });

  test('calculateAverageRating accurately computes mean and count', () => {
    const sampleReviews = [
      { rating: 5 },
      { rating: 4 },
      { rating: 5 },
      { rating: 4 }
    ];

    const result = calculateAverageRating(sampleReviews);
    assert.strictEqual(result.count, 4);
    assert.strictEqual(result.average, 4.5);
  });

  test('calculateAverageRating handles empty reviews gracefully', () => {
    const result = calculateAverageRating([]);
    assert.strictEqual(result.count, 0);
    assert.strictEqual(result.average, 5.0);
  });

  test('teardown review and notification test server', async () => {
    await new Promise((resolve) => server.close(resolve));
  });
});
