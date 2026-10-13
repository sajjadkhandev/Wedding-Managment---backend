import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { generateToken } from '../src/utils/token.js';
import { authorize } from '../src/middleware/auth.js';
import ApiError from '../src/utils/ApiError.js';

describe('WedPlan Authentication & Security Logic Tests', () => {
  const dummyUserId = '654321654321654321654321';
  const dummySecret = 'wedplan_dev_secret_key_pk_2026_super_secure_auth_token';

  test('bcrypt hashes and validates password correctly', async () => {
    const rawPassword = 'SecureWeddingPassword!2026';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(rawPassword, salt);

    assert.notStrictEqual(hash, rawPassword);
    const isMatch = await bcrypt.compare(rawPassword, hash);
    assert.strictEqual(isMatch, true);

    const isWrongMatch = await bcrypt.compare('WrongPassword', hash);
    assert.strictEqual(isWrongMatch, false);
  });

  test('generateToken creates valid verifiable JWT with payload', () => {
    process.env.JWT_SECRET = dummySecret;
    const token = generateToken(dummyUserId);

    assert.ok(typeof token === 'string' && token.length > 20);
    const decoded = jwt.verify(token, dummySecret);
    assert.strictEqual(decoded.id, dummyUserId);
  });

  test('authorize middleware permits users with matching role', () => {
    const authMiddleware = authorize('admin', 'vendor');
    const mockReq = { user: { role: 'vendor' } };
    const mockRes = {};
    let nextCalled = false;

    authMiddleware(mockReq, mockRes, (err) => {
      assert.strictEqual(err, undefined);
      nextCalled = true;
    });

    assert.strictEqual(nextCalled, true);
  });

  test('authorize middleware denies users without matching role', () => {
    const authMiddleware = authorize('admin');
    const mockReq = { user: { role: 'customer' } };
    const mockRes = {};
    let passedError = null;

    authMiddleware(mockReq, mockRes, (err) => {
      passedError = err;
    });

    assert.ok(passedError instanceof ApiError);
    assert.strictEqual(passedError.statusCode, 403);
    assert.match(passedError.message, /Access forbidden/);
  });
});
