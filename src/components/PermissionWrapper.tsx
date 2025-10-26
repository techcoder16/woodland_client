import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionType } from '@/types/permissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';

interface PermissionWrapperProps {
  children: React.ReactNode;
  screen: string;
  permission?: PermissionType;
  fallback?: React.ReactNode;
  showAccessDenied?: boolean;
  className?: string;
}

const PermissionWrapper: React.FC<PermissionWrapperProps> = ({
  children,
  screen,
  permission = PermissionType.READ,
  fallback,
  showAccessDenied = true,
  className = ''
}) => {
  const { hasPermission, isAdmin } = usePermissions();

  // Admin has all permissions
  if (isAdmin) {
    return <div className={className}>{children}</div>;
  }

  // Check if user has the required permission
  const hasRequiredPermission = hasPermission(screen, permission);

  if (!hasRequiredPermission) {
    if (fallback) {
      return <div className={className}>{fallback}</div>;
    }

    if (showAccessDenied) {
      return (
        <div className={className}>
          <Card className="border-dashed">
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                <Shield className="h-4 w-4 text-gray-400" />
              </div>
              <CardTitle className="text-sm text-gray-500">Access Restricted</CardTitle>
              <CardDescription className="text-xs">
                You don't have permission to view this content.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      );
    }

    return null;
  }

  return <div className={className}>{children}</div>;
};

export default PermissionWrapper;
