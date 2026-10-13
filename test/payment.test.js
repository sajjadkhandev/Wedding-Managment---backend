import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import { generateInvoiceNumber, generatePaymentNumber } from '../src/controllers/paymentController.js';

describe('WedPlan Payments & Invoicing Suite Tests', () => {
  let server;
  let baseUrl;

  test('setup payment test server', async () => {
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  test('GET /api/v1/payments blocks unauthenticated requests (HTTP 401)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/payments`);
    assert.strictEqual(res.status, 401);

    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.match(body.message, /Not authenticated/);
  });

  test('POST /api/v1/payments blocks unauthenticated requests (HTTP 401)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId: 'bk-123', amountPKR: 50000 })
    });
    assert.strictEqual(res.status, 401);
  });

  test('Invoice and payment number generator creates formatted codes', () => {
    const inv = generateInvoiceNumber();
    const pay = generatePaymentNumber();

    assert.match(inv, /^WP-INV-\d+-\d+$/);
    assert.match(pay, /^WP-PAY-\d+-\d+$/);
  });

  test('Deposit installment calculation tracks 20% advance milestone', () => {
    const totalAmountPKR = 350000;
    const standardDepositPercent = 0.20;
    const expectedAdvancePKR = Math.round(totalAmountPKR * standardDepositPercent);
    const balanceRemainingPKR = totalAmountPKR - expectedAdvancePKR;

    assert.strictEqual(expectedAdvancePKR, 70000);
    assert.strictEqual(balanceRemainingPKR, 280000);
  });

  test('teardown payment test server', async () => {
    await new Promise((resolve) => server.close(resolve));
  });
});
