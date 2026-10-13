import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import { computeBudgetSummary } from '../src/controllers/planningController.js';

describe('WedPlan Planning Suite (Guests, RSVP, Budget & Tasks) Tests', () => {
  let server;
  let baseUrl;

  test('setup planning test server', async () => {
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  test('GET /api/v1/planning/projects/:id/guests blocks unauthenticated requests (HTTP 401)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/planning/projects/proj-123/guests`);
    assert.strictEqual(res.status, 401);

    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.match(body.message, /Not authenticated/);
  });

  test('GET /api/v1/planning/projects/:id/expenses blocks unauthenticated requests (HTTP 401)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/planning/projects/proj-123/expenses`);
    assert.strictEqual(res.status, 401);
  });

  test('GET /api/v1/planning/projects/:id/tasks blocks unauthenticated requests (HTTP 401)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/planning/projects/proj-123/tasks`);
    assert.strictEqual(res.status, 401);
  });

  test('computeBudgetSummary accurately computes Pakistani PKR budget balances and utilization', () => {
    const totalBudget = 3500000; // 3.5 Million PKR
    const mockExpenses = [
      { estimatedCostPKR: 350000, actualCostPKR: 350000, paidAmountPKR: 70000 },  // Venue
      { estimatedCostPKR: 850000, actualCostPKR: 832500, paidAmountPKR: 200000 }, // Catering
      { estimatedCostPKR: 160000, actualCostPKR: 160000, paidAmountPKR: 50000 }   // Photo
    ];

    const summary = computeBudgetSummary(totalBudget, mockExpenses);

    assert.strictEqual(summary.totalBudgetPKR, 3500000);
    assert.strictEqual(summary.totalEstimatedPKR, 1360000);
    assert.strictEqual(summary.totalActualPKR, 1342500);
    assert.strictEqual(summary.totalPaidPKR, 320000);
    assert.strictEqual(summary.remainingBudgetPKR, 2157500);
    assert.strictEqual(summary.pendingPaymentsPKR, 1022500);
    assert.strictEqual(summary.budgetUtilizationPercent, 38); // 1342500 / 3500000 = 38%
  });

  test('Guest RSVP aggregation computes headcount accurately', () => {
    const guests = [
      { name: 'Chaudhry Family', totalMembers: 5, rsvpStatus: 'attending', rsvpConfirmedCount: 5 },
      { name: 'Dr. Siddiqui', totalMembers: 3, rsvpStatus: 'attending', rsvpConfirmedCount: 2 },
      { name: 'Farhan Zaidi', totalMembers: 2, rsvpStatus: 'pending', rsvpConfirmedCount: 0 },
      { name: 'Uncle Tariq', totalMembers: 4, rsvpStatus: 'declined', rsvpConfirmedCount: 0 }
    ];

    const totalInvited = guests.reduce((acc, g) => acc + g.totalMembers, 0);
    const confirmedCount = guests.filter(g => g.rsvpStatus === 'attending').reduce((acc, g) => acc + g.rsvpConfirmedCount, 0);
    const pendingCount = guests.filter(g => g.rsvpStatus === 'pending').reduce((acc, g) => acc + g.totalMembers, 0);

    assert.strictEqual(totalInvited, 14);
    assert.strictEqual(confirmedCount, 7);
    assert.strictEqual(pendingCount, 2);
  });

  test('teardown planning test server', async () => {
    await new Promise((resolve) => server.close(resolve));
  });
});
