import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import { generateWeddingResponse } from '../src/controllers/chatController.js';

describe('WedPlan Real-Time Concierge Chat Suite Tests', () => {
  let server;
  let baseUrl;

  test('setup chat test server', async () => {
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  test('POST /api/v1/chat/message answers budget inquiries with calculated PKR blueprint', async () => {
    const res = await fetch(`${baseUrl}/api/v1/chat/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'What is the budget for 500 guests?' })
    });
    assert.strictEqual(res.status, 200);

    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.match(body.data.reply, /500 guests/);
    assert.match(body.data.reply, /PKR/);
    assert.ok(Array.isArray(body.data.suggestions));
    assert.strictEqual(body.data.actionLink, '/packages');
  });

  test('POST /api/v1/chat/message answers venue inquiries with verified halls and link', async () => {
    const res = await fetch(`${baseUrl}/api/v1/chat/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Show me wedding halls in Lahore' })
    });
    assert.strictEqual(res.status, 200);

    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.match(body.data.reply, /Royal Crystal Ballroom/);
    assert.strictEqual(body.data.actionLink, '/services/venues');
  });

  test('POST /api/v1/chat/message rejects empty message with HTTP 400', async () => {
    const res = await fetch(`${baseUrl}/api/v1/chat/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: '   ' })
    });
    assert.strictEqual(res.status, 400);

    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.match(body.message, /Please provide a non-empty message/);
  });

  test('GET /api/v1/chat/quick-prompts returns starter prompt chips', async () => {
    const res = await fetch(`${baseUrl}/api/v1/chat/quick-prompts`);
    assert.strictEqual(res.status, 200);

    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data.prompts));
    assert.ok(body.data.prompts.length >= 4);
  });

  test('generateWeddingResponse accurately categorizes car, package and human planner inquiries', () => {
    const carResponse = generateWeddingResponse('How much is Mercedes S Class?');
    assert.match(carResponse.reply, /Mercedes-Benz S-Class/);
    assert.strictEqual(carResponse.actionLink, '/services/cars');

    const pkgResponse = generateWeddingResponse('Tell me about 3 day wedding package');
    assert.match(pkgResponse.reply, /The Royal 3-Day Wedding Combo/);
    assert.strictEqual(pkgResponse.actionLink, '/packages');

    const agentResponse = generateWeddingResponse('I want to speak with a human agent or wedding planner');
    assert.match(agentResponse.reply, /Sajjad Wazir/);
    assert.strictEqual(agentResponse.actionLink, '/contact');
  });

  test('teardown chat test server', async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });
});
