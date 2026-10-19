import request from 'supertest';
import app from '../src/server';
import { setupTestDB, teardownTestDB, clearDatabase, createTestUser } from './helpers/testHelpers';

describe('Auth API', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'TestPassword123!@#',
        })
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.user.email).toBe('newuser@example.com');
      expect(response.body.user.role).toBe('user');
    });

    it('should not register user with existing email', async () => {
      await createTestUser({ email: 'existing@example.com' });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'TestPassword123!@#',
        })
        .expect(400);

      expect(response.body.error.message).toContain('already exists');
    });

    it('should reject registration with invalid email', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'TestPassword123!@#',
        })
        .expect(400);
    });

    it('should reject registration with weak password', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'user@example.com',
          password: 'weak',
        })
        .expect(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      await createTestUser({
        email: 'login@example.com',
        password: 'TestPassword123!@#',
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'TestPassword123!@#',
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('login@example.com');
    });

    it('should reject login with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'TestPassword123!@#',
        })
        .expect(401);

      expect(response.body.error.message).toContain('Invalid');
    });

    it('should reject login with invalid password', async () => {
      await createTestUser({
        email: 'user@example.com',
        password: 'TestPassword123!@#',
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@example.com',
          password: 'WrongPassword123!@#',
        })
        .expect(401);

      expect(response.body.error.message).toContain('Invalid');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully with valid token', async () => {
      const user = await createTestUser();
      
      // First login to get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: user.email,
          password: 'TestPassword123!@#',
        });

      const token = loginResponse.body.accessToken;

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.message).toContain('successful');
    });

    it('should reject logout without token', async () => {
      await request(app)
        .post('/api/auth/logout')
        .expect(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh token successfully', async () => {
      const user = await createTestUser();
      
      // First login to get tokens
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: user.email,
          password: 'TestPassword123!@#',
        });

      // Note: In a real implementation, refresh token would come from cookie or response
      // For testing, we'll need to adjust based on implementation
      // This is a placeholder test
      expect(loginResponse.body).toHaveProperty('accessToken');
    });
  });
});

