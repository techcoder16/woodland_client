import { useAuth } from '@/context/AuthContext';
import { Role } from '@/types/permissions';

/**
 * Simple permission hook for Admin/User system
 * Just checks screen access - no complex permissions
 */
export const usePermissions = () => {
  const { canAccess, isAdmin, permissions, user } = useAuth();

  return {
    // Check if user can access a screen
    canAccess: (screen: string) => canAccess(screen),
    
    // Check if user is admin
    isAdmin,
    
    // Get all user permissions
    permissions,
    
    // Get user info
    user,
    
    // Check if user has any permission for a screen
    hasAnyPermission: (screen: string) => {
      if (isAdmin) return true;
      return permissions.some(p => p.screen.route === screen && p.screen.status === 'ACTIVE');
    },

    // Get accessible routes for navigation
    getAccessibleRoutes: () => {
      if (isAdmin) {
        // Admin can access all routes
        return [
          '/dashboard',
          '/vendors',
          '/vendors/add',
          '/vendors/edit',
          '/properties',
          '/property/add',
          '/property/edit',
          '/property-management',
          '/property/manager',
          '/transaction',
          '/tenants',
          '/settings',
          '/',
          '/404'
        ];
      }
      
      return permissions
        .filter(p => p.screen.status === 'ACTIVE')
        .map(p => p.screen.route);
    }
  };
};

/**
 * Hook for checking specific screen access patterns
 */
export const useScreenAccess = () => {
  const { canAccess, isAdmin } = useAuth();

  return {
    // Dashboard access
    canAccessDashboard: () => canAccess('/dashboard'),
    
    // Vendor management access
    canAccessVendors: () => canAccess('/vendors'),
    canAddVendors: () => canAccess('/vendors/add'),
    canEditVendors: () => canAccess('/vendors/edit'),
    
    // Property management access
    canAccessProperties: () => canAccess('/properties'),
    canAddProperties: () => canAccess('/property/add'),
    canEditProperties: () => canAccess('/property/edit'),
    canAccessPropertyManagement: () => canAccess('/property-management'),
    canAccessPropertyManager: () => canAccess('/property/manager'),
    
    // Transaction access
    canAccessTransactions: () => canAccess('/transaction'),
    
    // Tenant access
    canAccessTenants: () => canAccess('/tenants'),
    
    // Settings access
    canAccessSettings: () => canAccess('/settings'),
    
    // Admin panel access
    canAccessAdminPanel: () => isAdmin,
    
    // Check multiple screens at once
    canAccessAny: (screens: string[]) => {
      return screens.some(screen => canAccess(screen));
    },
    
    // Check all screens
    canAccessAll: (screens: string[]) => {
      return screens.every(screen => canAccess(screen));
    }
  };
};
