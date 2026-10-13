import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';

describe('WedPlan Wedding Project & Event Suite Tests', () => {
  let server;
  let baseUrl;

  test('setup wedding test server', async () => {
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  test('GET /api/v1/weddings blocks unauthenticated requests (HTTP 401)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/weddings`);
    assert.strictEqual(res.status, 401);

    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.match(body.message, /Not authenticated/);
  });

  test('POST /api/v1/weddings blocks unauthenticated requests (HTTP 401)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/weddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'My Wedding', city: 'Lahore' })
    });
    assert.strictEqual(res.status, 401);
  });

  test('Schedule conflict algorithm detects overlapping dates', () => {
    const events = [
      { eventType: 'Baraat', date: '2026-11-20' },
      { eventType: 'Walima', date: '2026-11-20' } // Same date clash
    ];

    const dateMap = {};
    const conflicts = [];
    events.forEach((ev) => {
      if (dateMap[ev.date]) {
        conflicts.push({
          date: ev.date,
          clash: `${dateMap[ev.date].eventType} & ${ev.eventType}`
        });
      } else {
        dateMap[ev.date] = ev;
      }
    });

    assert.strictEqual(conflicts.length, 1);
    assert.strictEqual(conflicts[0].clash, 'Baraat & Walima');
  });

  test('teardown wedding test server', async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });
});
