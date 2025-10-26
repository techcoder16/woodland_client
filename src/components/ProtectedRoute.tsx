import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, LogOut } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  route: string;
  fallbackPath?: string;
  showAccessDenied?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  route,
  fallbackPath = '/dashboard',
  showAccessDenied = true
}) => {
  const { isAuthenticated, isLoading, canAccess, isAdmin, logout } = useAuth();
  const location = useLocation();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Check access - admin routes need admin role, others need screen access
  const isAdminRoute = route.startsWith('/admin');
  const hasAccess = isAdminRoute ? isAdmin : canAccess(route);
  
  if (!hasAccess) {
    if (showAccessDenied) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <Shield className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-xl">Access Denied</CardTitle>
              <CardDescription>
                {isAdminRoute 
                  ? "You need administrator privileges to access this page."
                  : "You don't have permission to access this page."
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-gray-500 mb-4">
                {isAdminRoute 
                  ? "Admin access required"
                  : `Required access to: ${route}`
                }
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => window.history.back()}
                  className="flex items-center gap-2"
                >
                  ← Go Back
                </Button>
                <Button
                  variant="destructive"
                  onClick={logout}
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    } else {
      return <Navigate to={fallbackPath} replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;