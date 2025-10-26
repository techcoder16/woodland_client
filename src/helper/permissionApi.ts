import { get, post, put, del } from './api';
import { User, Screen, UserPermission, LoginResponse, ScreenAccessCheck } from '@/types/permissions';

// Authentication APIs
export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await post<LoginResponse>('auth/login', { email, password });
    if (response.error) throw new Error(response.error.message);
    return response.data!;
  },

  refresh: async (refreshToken: string): Promise<LoginResponse> => {
    const response = await post<LoginResponse>('auth/refresh', { refresh_token: refreshToken });
    if (response.error) throw new Error(response.error.message);
    return response.data!;
  },

  logout: async (): Promise<void> => {
    await post('auth/logout', {});
  }
};

// User Management APIs (Admin Only)
export const userApi = {
  getCurrentUser: async (): Promise<User> => {
    const response = await get<User>('user/me');
    if (response.error) throw new Error(response.error.message);
    return response.data!;
  },

  getAllUsers: async (): Promise<User[]> => {
    const response = await get<User[]>('user/all');
    if (response.error) throw new Error(response.error.message);
    return response.data!;
  },

  createUser: async (userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone_number?: number;
    role: string;
  }): Promise<User> => {
    const response = await post<User>('user', userData);
    if (response.error) throw new Error(response.error.message);
    return response.data!;
  },

  getUserById: async (userId: string): Promise<User> => {
    const response = await get<User>(`user/${userId}`);
    if (response.error) throw new Error(response.error.message);
    return response.data!;
  },

  updateUser: async (userId: string, userData: {
    first_name?: string;
    last_name?: string;
    phone_number?: number;
    role?: string;
  }): Promise<User> => {
    const response = await put<User>(`user/${userId}`, userData);
    if (response.error) throw new Error(response.error.message);
    return response.data!;
  },

  deleteUser: async (userId: string): Promise<{ message: string }> => {
    const response = await del<{ message: string }>(`user/${userId}`);
    if (response.error) throw new Error(response.error.message);
    return response.data!;
  }
};

// Screen Management APIs (Admin Only)
export const screenApi = {
  createScreen: async (screenData: {
    name: string;
    description: string;
    route: string;
    status: string;
  }): Promise<Screen> => {
    const response = await post<Screen>('screen', screenData);
    if (response.error) throw new Error(response.error.message);
    return response.data!;
  },

  getAllScreens: async (): Promise<Screen[]> => {
    const response = await get<Screen[]>('screen');
    if (response.error) throw new Error(response.error.message);
    return response.data!;
  },

  getScreenById: async (screenId: string): Promise<Screen> => {
    const response = await get<Screen>(`screen/${screenId}`);
    if (response.error) throw new Error(response.error.message);
    return response.data!;
  },

  updateScreen: async (screenId: string, screenData: {
    name?: string;
    description?: string;
    status?: string;
  }): Promise<Screen> => {
    const response = await put<Screen>(`screen/${screenId}`, screenData);
    if (response.error) throw new Error(response.error.message);
    return response.data!;
  },

  deleteScreen: async (screenId: string): Promise<{ message: string }> => {
    const response = await del<{ message: string }>(`screen/${screenId}`);
    if (response.error) throw new Error(response.error.message);
    return response.data!;
  }
};

// Permission Management APIs (Admin Only)
export const permissionApi = {
  createPermission: async (permissionData: {
    userId: string;
    screenId: string;
    permission: string;
  }): Promise<Permission> => {
    const response = await post<Permission>('permission', permissionData);
    if (response.error) throw new Error(response.error.message);
    return response.data!;
  },

  getAllPermissions: async (): Promise<Permission[]> => {
    const response = await get<Permission[]>('permission');
    if (response.error) throw new Error(response.error.message);
    return response.data!;
  },

  getPermissionsByUserId: async (userId: string): Promise<Permission[]> => {
    const response = await get<Permission[]>(`permission/user/${userId}`);
    if (response.error) throw new Error(response.error.message);
    return response.data!;
  },

  getPermissionsByScreenId: async (screenId: string): Promise<Permission[]> => {
    const response = await get<Permission[]>(`permission/screen/${screenId}`);
    if (response.error) throw new Error(response.error.message);
    return response.data!;
  },

  getPermissionById: async (permissionId: string): Promise<Permission> => {
    const response = await get<Permission>(`permission/${permissionId}`);
    if (response.error) throw new Error(response.error.message);
    return response.data!;
  },

  updatePermission: async (permissionId: string, permissionData: {
    permission: string;
  }): Promise<Permission> => {
    const response = await put<Permission>(`permission/${permissionId}`, permissionData);
    if (response.error) throw new Error(response.error.message);
    return response.data!;
  },

  deletePermission: async (permissionId: string): Promise<{ message: string }> => {
    const response = await del<{ message: string }>(`permission/${permissionId}`);
    if (response.error) throw new Error(response.error.message);
    return response.data!;
  }
};

// User Permission APIs (Regular Users)
export const userPermissionApi = {
  getMyPermissions: async (): Promise<UserPermission[]> => {
    const response = await get<UserPermission[]>('user-permission/my-permissions');
    if (response.error) throw new Error(response.error.message);
    return response.data!;
  }
};
