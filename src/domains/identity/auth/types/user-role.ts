export enum UserRole {
  Master = 'Master',
  Admin = 'Admin',
  User = 'User',
}

export type CreatableRoles = UserRole.Admin | UserRole.User;
