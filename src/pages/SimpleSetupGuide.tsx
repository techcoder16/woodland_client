import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, AlertCircle, Info, Shield, Users, Monitor, Settings } from 'lucide-react';
import { screenApi, userApi, permissionApi } from '@/helper/simplePermissionApi';
import { ScreenStatus, Role } from '@/types/permissions';
import { toast } from 'sonner';

const SimpleSetupGuide: React.FC = () => {
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
        { name: 'Vendor List', description: 'Vendor management', route: '/vendors', status: ScreenStatus.ACTIVE },
        { name: 'Add Vendor', description: 'Add new vendor', route: '/vendors/add', status: ScreenStatus.ACTIVE },
        { name: 'Edit Vendor', description: 'Edit vendor', route: '/vendors/edit', status: ScreenStatus.ACTIVE },
        { name: 'Property List', description: 'Property management', route: '/properties', status: ScreenStatus.ACTIVE },
        { name: 'Add Property', description: 'Add new property', route: '/property/add', status: ScreenStatus.ACTIVE },
        { name: 'Edit Property', description: 'Edit property', route: '/property/edit', status: ScreenStatus.ACTIVE },
        { name: 'Property Management', description: 'Property management', route: '/property-management', status: ScreenStatus.ACTIVE },
        { name: 'Property Manager', description: 'Property manager', route: '/property/manager', status: ScreenStatus.ACTIVE },
        { name: 'Transaction Management', description: 'Transaction management', route: '/transaction', status: ScreenStatus.ACTIVE },
        { name: 'Tenant List', description: 'Tenant management', route: '/tenants', status: ScreenStatus.ACTIVE },
        { name: 'Settings', description: 'Application settings', route: '/settings', status: ScreenStatus.ACTIVE },
        { name: 'Home Page', description: 'Home page', route: '/', status: ScreenStatus.ACTIVE },
        { name: '404 Not Found', description: '404 error page', route: '/404', status: ScreenStatus.ACTIVE },
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
            screenId: createdScreens.find(s => s.route === '/dashboard')?.id || ''
          });
        } catch (error) {
          console.log(`Permission might already exist for user ${user.email}`);
        }

        try {
          await permissionApi.createPermission({
            userId: user.id,
            screenId: createdScreens.find(s => s.route === '/properties')?.id || ''
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
            Simple Permission System Setup Guide
          </CardTitle>
          <CardDescription>
            Follow this guide to set up the simple Admin/User permission system for your application.
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Simple Two-Role System
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li>• <strong>Admin:</strong> Full access to all screens</li>
                      <li>• <strong>User:</strong> Access to assigned screens only</li>
                      <li>• No complex permissions - just screen access</li>
                      <li>• Easy to understand and manage</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Monitor className="h-5 w-5" />
                      Screen-Based Access
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li>• Define application screens/routes</li>
                      <li>• Assign screen access to users</li>
                      <li>• Admin can access all screens</li>
                      <li>• Users see only their assigned screens</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Test Credentials</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded">
                      <Badge variant="destructive" className="mb-2">Admin</Badge>
                      <p className="text-sm text-gray-600">admin@woodland.com</p>
                      <p className="text-sm text-gray-600">admin123</p>
                    </div>
                    <div className="text-center p-4 border rounded">
                      <Badge variant="secondary" className="mb-2">User1</Badge>
                      <p className="text-sm text-gray-600">user1@woodland.com</p>
                      <p className="text-sm text-gray-600">user123</p>
                    </div>
                    <div className="text-center p-4 border rounded">
                      <Badge variant="secondary" className="mb-2">User2</Badge>
                      <p className="text-sm text-gray-600">user2@woodland.com</p>
                      <p className="text-sm text-gray-600">user123</p>
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
                        <p className="text-sm text-gray-600">Add users to your system with Admin or User roles.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 text-sm font-medium">3</span>
                      </div>
                      <div>
                        <h4 className="font-medium">Assign Screen Access</h4>
                        <p className="text-sm text-gray-600">Grant screen access to users. Admin automatically gets all screens.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 text-sm font-medium">4</span>
                      </div>
                      <div>
                        <h4 className="font-medium">Test Access</h4>
                        <p className="text-sm text-gray-600">Verify that users can only access their assigned screens.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="usage" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Using the Simple Permission System</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">1. Import the permission hook</h4>
                      <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`import { useSimplePermissions } from '@/hooks/useSimplePermissions';`}
                      </pre>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">2. Check screen access</h4>
                      <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`const { canAccess, isAdmin } = useSimplePermissions();

// Check if user can access a screen
if (canAccess('/dashboard')) {
  // Show dashboard content
}

// Check if user is admin
if (isAdmin) {
  // Show admin features
}`}
                      </pre>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">3. Use ProtectedRoute component</h4>
                      <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`import ProtectedRoute from '@/components/ProtectedRoute';

<ProtectedRoute route="/vendors">
  <VendorList />
</ProtectedRoute>`}
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
                      <p className="text-sm text-gray-600 mb-2">Show/hide menu items based on screen access:</p>
                      <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`{canAccess('/dashboard') && <MenuItem>Dashboard</MenuItem>}
{canAccess('/vendors') && <MenuItem>Vendors</MenuItem>}
{isAdmin && <MenuItem>Admin Panel</MenuItem>}`}
                      </pre>
                    </div>

                    <div>
                      <h4 className="font-medium">Route Protection</h4>
                      <p className="text-sm text-gray-600 mb-2">Protect entire routes:</p>
                      <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`<Route path="/vendors" element={
  <ProtectedRoute route="/vendors">
    <VendorList />
  </ProtectedRoute>
} />`}
                      </pre>
                    </div>

                    <div>
                      <h4 className="font-medium">Conditional Rendering</h4>
                      <p className="text-sm text-gray-600 mb-2">Show different content based on access:</p>
                      <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`{canAccess('/vendors') ? (
  <VendorManagement />
) : (
  <AccessDenied />
)}`}
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

export default SimpleSetupGuide;
