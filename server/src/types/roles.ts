export enum UserRole {
  SUPERADMIN = 'superadmin',
  ADMIN = 'admin',
  USER = 'user',
}

export type RoleType = UserRole.SUPERADMIN | UserRole.ADMIN | UserRole.USER;

