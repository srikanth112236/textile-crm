import request from 'supertest';
import app from '../src/server';
import { setupTestDB, teardownTestDB, clearDatabase, createTestUser } from './helpers/testHelpers';
import { generateAccessToken } from '../src/utils/jwt';
import { generateMFASecret, verifyMFAToken } from '../src/utils/mfa';

describe('MFA API', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe('POST /api/auth/mfa/setup', () => {
    it('should setup MFA and return QR code', async () => {
      const user = await createTestUser();
      const token = generateAccessToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      const response = await request(app)
        .post('/api/auth/mfa/setup')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('secret');
      expect(response.body).toHaveProperty('qrCodeUrl');
      expect(response.body.qrCodeUrl).toContain('data:image');
    });

    it('should reject MFA setup without authentication', async () => {
      await request(app)
        .post('/api/auth/mfa/setup')
        .expect(401);
    });
  });

  describe('MFA Utilities', () => {
    it('should generate and verify MFA token', async () => {
      const email = 'test@example.com';
      const { secret } = await generateMFASecret(email);

      // Generate token using speakeasy
      const speakeasy = require('speakeasy');
      const token = speakeasy.totp({
        secret,
        encoding: 'base32',
      });

      const isValid = verifyMFAToken(secret, token);
      expect(isValid).toBe(true);
    });

    it('should reject invalid MFA token', () => {
      const secret = 'TEST_SECRET_BASE32';
      const invalidToken = '000000';

      const isValid = verifyMFAToken(secret, invalidToken);
      expect(isValid).toBe(false);
    });
  });
});

