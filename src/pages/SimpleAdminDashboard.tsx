import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Shield, Settings, BarChart3, Plus, UserPlus, Monitor } from 'lucide-react';
import UserManagement from '@/components/admin/UserManagement';
import PermissionManagement from '@/components/admin/SimplePermissionManagement';
import AdminTest from '@/components/AdminTest';
import { usePermissions } from '@/hooks/usePermissions';
import DashboardLayout from '@/components/layout/DashboardLayout';

const AdminDashboard: React.FC = () => {
  const { isAdmin, user } = usePermissions();
  const navigate = useNavigate();

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <Shield className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl">Access Denied</CardTitle>
            <CardDescription>
              You need administrator privileges to access this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Administrator Dashboard</h1>
          <p className="text-gray-600">
            Manage users, screens, and system settings.
          </p>
          {/* Debug info */}
       
        </div>
          <div className="flex gap-3">
            <Button onClick={() => navigate('/admin/create-user')} className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Create User
            </Button>
            <Button onClick={() => navigate('/admin/create-screen')} variant="outline" className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Create Screen
            </Button>
          </div>
        </div>

        {/* Quick Actions Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/admin/create-user')}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <UserPlus className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Create User</CardTitle>
                  <CardDescription>Add new users and assign permissions</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Create new users with Admin or User roles and assign them access to specific screens.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/admin/create-screen')}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Monitor className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Create Screen</CardTitle>
                  <CardDescription>Add new pages/screens to the app</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Define new screens/pages that users can access. Create routes and assign permissions.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/admin?tab=permissions')}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Shield className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Manage Permissions</CardTitle>
                  <CardDescription>Assign screen access to users</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                View and manage which users have access to which screens in your application.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Admin Test Component
        <AdminTest /> */}

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Permissions
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <UserManagement />
        </TabsContent>

        <TabsContent value="permissions" className="space-y-6">
          <PermissionManagement />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">-</div>
                <p className="text-xs text-muted-foreground">
                  +0% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Permissions</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">-</div>
                <p className="text-xs text-muted-foreground">
                  +0% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Screens</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">-</div>
                <p className="text-xs text-muted-foreground">
                  +0% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Admin Actions</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">-</div>
                <p className="text-xs text-muted-foreground">
                  +0% from last month
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
