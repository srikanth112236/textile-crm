import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User } from '../../src/models/User';
import { UserRole } from '../../src/types/roles';

let mongoServer: MongoMemoryServer;

export const setupTestDB = async (): Promise<void> => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
};

export const teardownTestDB = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
};

export const clearDatabase = async (): Promise<void> => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

export const createTestUser = async (overrides: Partial<any> = {}) => {
  const userData = {
    email: 'test@example.com',
    password: 'TestPassword123!@#',
    role: UserRole.USER,
    ...overrides,
  };

  const user = new User(userData);
  await user.save();
  return user;
};

export const createTestAdmin = async (overrides: Partial<any> = {}) => {
  return createTestUser({
    email: 'admin@example.com',
    role: UserRole.ADMIN,
    ...overrides,
  });
};

export const createTestSuperadmin = async (overrides: Partial<any> = {}) => {
  return createTestUser({
    email: 'superadmin@example.com',
    role: UserRole.SUPERADMIN,
    ...overrides,
  });
};

