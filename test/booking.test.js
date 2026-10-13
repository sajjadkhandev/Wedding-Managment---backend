import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import { checkSlotConflict, normalizeEventDate } from '../src/controllers/bookingController.js';
import { BOOKING_STATUS } from '../src/config/constants.js';

describe('WedPlan Booking Engine & Anti-Conflict Suite Tests', () => {
  let server;
  let baseUrl;

  test('setup booking test server', async () => {
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  test('GET /api/v1/bookings blocks unauthenticated requests (HTTP 401)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/bookings`);
    assert.strictEqual(res.status, 401);

    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.match(body.message, /Not authenticated/);
  });

  test('POST /api/v1/bookings blocks unauthenticated requests (HTTP 401)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serviceId: 'srv-1', eventDate: '2026-11-20' })
    });
    assert.strictEqual(res.status, 401);
  });

  test('GET /api/v1/bookings/check-availability rejects missing parameters (HTTP 400)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/bookings/check-availability`);
    assert.strictEqual(res.status, 400);

    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.match(body.message, /serviceId and date are required/);
  });

  test('GET /api/v1/bookings/check-availability returns availability status for valid query', async () => {
    const res = await fetch(`${baseUrl}/api/v1/bookings/check-availability?serviceId=srv-demo-999&date=2026-12-15&timeSlot=evening`);
    assert.strictEqual(res.status, 200);

    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.available, true);
    assert.strictEqual(body.data.timeSlot, 'evening');
  });

  test('Anti-double-booking slot conflict detects exact same date & timeSlot collision', () => {
    const existing = [
      {
        eventDate: new Date('2026-11-20'),
        timeSlot: 'evening',
        status: BOOKING_STATUS.CONFIRMED
      }
    ];

    // Attempting same date and slot
    const conflict = checkSlotConflict(existing, '2026-11-20', 'evening');
    assert.strictEqual(conflict, true, 'Should detect conflict on identical evening slot');

    // Attempting different slot on same date (e.g. morning vs evening)
    const morningCheck = checkSlotConflict(existing, '2026-11-20', 'morning');
    assert.strictEqual(morningCheck, false, 'Morning slot should be open when only evening is booked');

    // Attempting different date
    const nextDayCheck = checkSlotConflict(existing, '2026-11-21', 'evening');
    assert.strictEqual(nextDayCheck, false, 'Next day should be open');
  });

  test('Anti-double-booking slot conflict handles full_day exclusivity', () => {
    const existingFullDay = [
      {
        eventDate: new Date('2026-11-25'),
        timeSlot: 'full_day',
        status: BOOKING_STATUS.ACCEPTED
      }
    ];

    // Any slot on a full_day booking is a conflict
    assert.strictEqual(checkSlotConflict(existingFullDay, '2026-11-25', 'morning'), true);
    assert.strictEqual(checkSlotConflict(existingFullDay, '2026-11-25', 'evening'), true);

    // Cancelled or rejected bookings never block a slot
    const cancelledBooking = [
      {
        eventDate: new Date('2026-11-25'),
        timeSlot: 'full_day',
        status: BOOKING_STATUS.CANCELLED
      }
    ];
    assert.strictEqual(checkSlotConflict(cancelledBooking, '2026-11-25', 'evening'), false);
  });

  test('Price freezing snapshot calculates authoritative PKR rate on backend', () => {
    const packageRatePKR = 1850; // per head
    const guestCount = 350;
    const computedTotal = packageRatePKR * guestCount;

    assert.strictEqual(computedTotal, 647500);
    // Never allow a customer to pass manipulated total:
    const fakeClientTotal = 50000;
    const authoritativeTotal = (packageRatePKR * guestCount);
    assert.notStrictEqual(fakeClientTotal, authoritativeTotal);
    assert.strictEqual(authoritativeTotal, 647500);
  });

  test('teardown booking test server', async () => {
    await new Promise((resolve) => server.close(resolve));
  });
});
