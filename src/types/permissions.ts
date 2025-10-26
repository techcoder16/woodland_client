// Simple Permission Management Types

export enum Role {
  Admin = "Admin",
  User = "User"
}

export enum ScreenStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE"
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  salutation?: string;
  post_code?: string;
  Address?: string;
  Town?: string;
  Country?: string;
  phone_number?: any;
  fax?: string;
  date_of_birth?: string;
  website?: string;
  pager?: string;
  birth_place?: string;
  nationality?: string;
  passport?: string;
  accpet_LHA_DWP?: string;
  internal_info?: string;
  role: Role;
  createdAt?: string;
  updatedAt?: string;
}

export interface Screen {
  id: string;
  name: string;
  description: string;
  route: string;
  status: ScreenStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserPermission {
  id: string;
  userId: string;
  screenId: string;
  screen: Screen;
  createdAt?: string;
  updatedAt?: string;
}

// API Response Types
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  sessionId: string;
  user: User;
}

export interface AuthError {
  statusCode: number;
  message: string;
  error: string;
}

// Simple Permission Check Types
export interface ScreenAccessCheck {
  canAccess: boolean;
  route: string;
}

export interface UserPermissions {
  permissions: UserPermission[];
  isAdmin: boolean;
}
