import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, AlertCircle, Info, Shield, Users, Monitor, Settings } from 'lucide-react';
import { screenApi, userApi, permissionApi } from '@/helper/simplePermissionApi';
import { ScreenStatus, Role } from '@/types/permissions';
import { toast } from 'sonner';

const SetupGuide: React.FC = () => {
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [setupProgress, setSetupProgress] = useState(0);
  const [setupComplete, setSetupComplete] = useState(false);

  const handleSetupSystem = async () => {
    setIsSettingUp(true);
    setSetupProgress(0);

    try {
      // Step 1: Create screens
      setSetupProgress(20);
      toast.info('Creating application screens...');
      
      const screens = [
        { name: 'Dashboard', description: 'Main dashboard', route: '/dashboard', status: ScreenStatus.ACTIVE },
        { name: 'Properties', description: 'Property management', route: '/properties', status: ScreenStatus.ACTIVE },
        { name: 'Tenants', description: 'Tenant management', route: '/tenants', status: ScreenStatus.ACTIVE },
        { name: 'Vendors', description: 'Vendor management', route: '/vendors', status: ScreenStatus.ACTIVE },
        { name: 'Users', description: 'User management', route: '/users', status: ScreenStatus.ACTIVE },
        { name: 'Admin Panel', description: 'Administrator panel', route: '/admin', status: ScreenStatus.ACTIVE },
        { name: 'Parties', description: 'Property parties management', route: '/parties', status: ScreenStatus.ACTIVE },
        { name: 'Rent Management', description: 'Rent and financial management', route: '/rent', status: ScreenStatus.ACTIVE },
      ];

      const createdScreens = [];
      for (const screen of screens) {
        try {
          const createdScreen = await screenApi.createScreen(screen);
          createdScreens.push(createdScreen);
        } catch (error) {
          console.log(`Screen ${screen.name} might already exist`);
        }
      }

      setSetupProgress(40);
      toast.success('Screens created successfully!');

      // Step 2: Get all users
      setSetupProgress(60);
      toast.info('Loading existing users...');
      
      const users = await userApi.getAllUsers();
      const regularUsers = users.filter(user => user.role !== Role.Admin);

      setSetupProgress(80);
      toast.info('Setting up permissions...');

      // Step 3: Create basic permissions for regular users
      for (const user of regularUsers) {
        // Give basic read access to dashboard and properties
        try {
          await permissionApi.createPermission({
            userId: user.id,
            screenId: createdScreens.find(s => s.route === '/dashboard')?.id || '',
            // No permission type needed in simplified system
          });
        } catch (error) {
          console.log(`Permission might already exist for user ${user.email}`);
        }

        try {
          await permissionApi.createPermission({
            userId: user.id,
            screenId: createdScreens.find(s => s.route === '/properties')?.id || '',
            // No permission type needed in simplified system
          });
        } catch (error) {
          console.log(`Permission might already exist for user ${user.email}`);
        }
      }

      setSetupProgress(100);
      setSetupComplete(true);
      toast.success('Permission system setup completed successfully!');

    } catch (error) {
      console.error('Setup error:', error);
      toast.error('Failed to setup permission system. Please check console for details.');
    } finally {
      setIsSettingUp(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Permission System Setup Guide
          </CardTitle>
          <CardDescription>
            Follow this guide to set up the permission management system for your application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="setup">Setup</TabsTrigger>
              <TabsTrigger value="usage">Usage</TabsTrigger>
              <TabsTrigger value="examples">Examples</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      User Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li>• Create and manage users</li>
                      <li>• Assign roles (Admin, User, Reseller)</li>
                      <li>• Update user information</li>
                      <li>• Delete users</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Monitor className="h-5 w-5" />
                      Screen Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li>• Define application screens</li>
                      <li>• Set routes and descriptions</li>
                      <li>• Enable/disable screens</li>
                      <li>• Organize by features</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Permission Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li>• Assign permissions to users</li>
                      <li>• Control access to screens</li>
                      <li>• Set permission levels</li>
                      <li>• Manage user access</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Permission Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 border rounded">
                      <Badge variant="outline" className="mb-2">READ</Badge>
                      <p className="text-sm text-gray-600">View content</p>
                    </div>
                    <div className="text-center p-4 border rounded">
                      <Badge variant="default" className="mb-2">WRITE</Badge>
                      <p className="text-sm text-gray-600">Create new content</p>
                    </div>
                    <div className="text-center p-4 border rounded">
                      <Badge variant="secondary" className="mb-2">UPDATE</Badge>
                      <p className="text-sm text-gray-600">Modify existing content</p>
                    </div>
                    <div className="text-center p-4 border rounded">
                      <Badge variant="destructive" className="mb-2">DELETE</Badge>
                      <p className="text-sm text-gray-600">Remove content</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="setup" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Setup</CardTitle>
                  <CardDescription>
                    Click the button below to automatically set up the permission system with default screens and permissions.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Button 
                        onClick={handleSetupSystem} 
                        disabled={isSettingUp}
                        className="flex items-center gap-2"
                      >
                        {isSettingUp ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Setting up... ({setupProgress}%)
                          </>
                        ) : (
                          <>
                            <Settings className="h-4 w-4" />
                            Setup Permission System
                          </>
                        )}
                      </Button>
                      
                      {setupComplete && (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="h-5 w-5" />
                          <span className="font-medium">Setup Complete!</span>
                        </div>
                      )}
                    </div>

                    {isSettingUp && (
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${setupProgress}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Manual Setup Steps</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 text-sm font-medium">1</span>
                      </div>
                      <div>
                        <h4 className="font-medium">Create Screens</h4>
                        <p className="text-sm text-gray-600">Define all the screens/routes in your application that need permission control.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 text-sm font-medium">2</span>
                      </div>
                      <div>
                        <h4 className="font-medium">Create Users</h4>
                        <p className="text-sm text-gray-600">Add users to your system with appropriate roles (Admin, User, Reseller).</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 text-sm font-medium">3</span>
                      </div>
                      <div>
                        <h4 className="font-medium">Assign Permissions</h4>
                        <p className="text-sm text-gray-600">Grant specific permissions to users for different screens.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 text-sm font-medium">4</span>
                      </div>
                      <div>
                        <h4 className="font-medium">Test Permissions</h4>
                        <p className="text-sm text-gray-600">Verify that permissions are working correctly in your application.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="usage" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Using Permissions in Components</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">1. Import the permission hook</h4>
                      <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`import { usePermissions } from '@/hooks/usePermissions';`}
                      </pre>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">2. Use permission checks</h4>
                      <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`const { canRead, canWrite, canUpdate, canDelete, isAdmin } = usePermissions();

// Check specific permissions
if (canRead('/dashboard')) {
  // Show dashboard content
}

// Conditional rendering
{canWrite('/users') && (
  <Button>Add User</Button>
)}`}
                      </pre>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">3. Use PermissionWrapper component</h4>
                      <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`import PermissionWrapper from '@/components/PermissionWrapper';

<PermissionWrapper screen="/properties">
  <PropertyList />
</PermissionWrapper>`}
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="examples" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Common Use Cases</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium">Navigation Menu</h4>
                      <p className="text-sm text-gray-600 mb-2">Show/hide menu items based on permissions:</p>
                      <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`{canRead('/dashboard') && <MenuItem>Dashboard</MenuItem>}
{canRead('/users') && <MenuItem>Users</MenuItem>}
{isAdmin && <MenuItem>Admin Panel</MenuItem>}`}
                      </pre>
                    </div>

                    <div>
                      <h4 className="font-medium">Action Buttons</h4>
                      <p className="text-sm text-gray-600 mb-2">Enable/disable buttons based on permissions:</p>
                      <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`<Button disabled={!canWrite('/properties')}>
  Add Property
</Button>`}
                      </pre>
                    </div>

                    <div>
                      <h4 className="font-medium">Data Tables</h4>
                      <p className="text-sm text-gray-600 mb-2">Show action buttons based on permissions:</p>
                      <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`<TableCell>
  {canUpdate('/users') && <EditButton />}
  {canDelete('/users') && <DeleteButton />}
</TableCell>`}
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default SetupGuide;
