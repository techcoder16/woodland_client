import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Eye, Shield } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionType } from '@/types/permissions';
import PermissionWrapper from '@/components/PermissionWrapper';

/**
 * Example component showing how to integrate the permission system
 * This demonstrates various ways to use permissions in your components
 */
const PermissionIntegrationExample: React.FC = () => {
  const {
    canRead,
    canWrite,
    canUpdate,
    canDelete,
    hasPermission,
    canAccess,
    isAdmin,
    permissions
  } = usePermissions();

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Permission System Integration Examples
          </CardTitle>
          <CardDescription>
            This component demonstrates how to integrate the permission system into your application.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Example 1: Basic Permission Checks */}
          <div>
            <h3 className="text-lg font-semibold mb-3">1. Basic Permission Checks</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="h-4 w-4" />
                  <span className="font-medium">Read Dashboard</span>
                </div>
                <Badge variant={canRead('/dashboard') ? 'default' : 'secondary'}>
                  {canRead('/dashboard') ? 'Allowed' : 'Denied'}
                </Badge>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Plus className="h-4 w-4" />
                  <span className="font-medium">Create Users</span>
                </div>
                <Badge variant={canWrite('/users') ? 'default' : 'secondary'}>
                  {canWrite('/users') ? 'Allowed' : 'Denied'}
                </Badge>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Edit className="h-4 w-4" />
                  <span className="font-medium">Update Properties</span>
                </div>
                <Badge variant={canUpdate('/properties') ? 'default' : 'secondary'}>
                  {canUpdate('/properties') ? 'Allowed' : 'Denied'}
                </Badge>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Trash2 className="h-4 w-4" />
                  <span className="font-medium">Delete Tenants</span>
                </div>
                <Badge variant={canDelete('/tenants') ? 'default' : 'secondary'}>
                  {canDelete('/tenants') ? 'Allowed' : 'Denied'}
                </Badge>
              </Card>
            </div>
          </div>

          {/* Example 2: Conditional Rendering */}
          <div>
            <h3 className="text-lg font-semibold mb-3">2. Conditional Rendering</h3>
            <div className="space-y-4">
              {/* Only show if user can read dashboard */}
              {canRead('/dashboard') && (
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-4">
                    <p className="text-green-800">✅ You can view the dashboard!</p>
                  </CardContent>
                </Card>
              )}

              {/* Show different content based on permissions */}
              {canWrite('/users') ? (
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4">
                    <p className="text-blue-800">✅ You can create and manage users!</p>
                    <Button className="mt-2">
                      <Plus className="h-4 w-4 mr-2" />
                      Add New User
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-gray-200 bg-gray-50">
                  <CardContent className="p-4">
                    <p className="text-gray-600">❌ You can only view users, not create them.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Example 3: Using PermissionWrapper */}
          <div>
            <h3 className="text-lg font-semibold mb-3">3. Permission Wrapper Component</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* This content will be hidden if user doesn't have READ permission for /properties */}
              <PermissionWrapper screen="/properties" permission={PermissionType.READ}>
                <Card>
                  <CardHeader>
                    <CardTitle>Property Management</CardTitle>
                    <CardDescription>Manage your properties</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>This content is only visible to users with READ permission for /properties</p>
                    <Button className="mt-2">
                      <Eye className="h-4 w-4 mr-2" />
                      View Properties
                    </Button>
                  </CardContent>
                </Card>
              </PermissionWrapper>

              {/* This content will show access denied message if user doesn't have WRITE permission */}
              <PermissionWrapper 
                screen="/tenants" 
                permission={PermissionType.WRITE}
                showAccessDenied={true}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Tenant Management</CardTitle>
                    <CardDescription>Create and manage tenants</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>This content is only visible to users with WRITE permission for /tenants</p>
                    <Button className="mt-2">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Tenant
                    </Button>
                  </CardContent>
                </Card>
              </PermissionWrapper>
            </div>
          </div>

          {/* Example 4: Admin-specific content */}
          <div>
            <h3 className="text-lg font-semibold mb-3">4. Admin-specific Content</h3>
            {isAdmin ? (
              <Card className="border-purple-200 bg-purple-50">
                <CardHeader>
                  <CardTitle className="text-purple-800">🔐 Administrator Panel</CardTitle>
                  <CardDescription className="text-purple-600">
                    You have full administrative access to the system.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-purple-700">• Manage all users and permissions</p>
                    <p className="text-sm text-purple-700">• Access system settings</p>
                    <p className="text-sm text-purple-700">• View audit logs</p>
                    <p className="text-sm text-purple-700">• Configure application settings</p>
                  </div>
                  <Button className="mt-4 bg-purple-600 hover:bg-purple-700">
                    <Shield className="h-4 w-4 mr-2" />
                    Open Admin Panel
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-gray-200 bg-gray-50">
                <CardContent className="p-4">
                  <p className="text-gray-600">You are a regular user with limited permissions.</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Example 5: Current User Permissions */}
          <div>
            <h3 className="text-lg font-semibold mb-3">5. Current User Permissions</h3>
            <Card>
              <CardHeader>
                <CardTitle>Your Permissions</CardTitle>
                <CardDescription>
                  Here are all the permissions assigned to your account:
                </CardDescription>
              </CardHeader>
              <CardContent>
                {permissions.length > 0 ? (
                  <div className="space-y-2">
                    {permissions.map((permission, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <span className="font-medium">{permission.screen.name}</span>
                          <span className="text-sm text-gray-500 ml-2">({permission.screen.route})</span>
                        </div>
                        <Badge variant={
                          permission.permission === PermissionType.DELETE ? 'destructive' :
                          permission.permission === PermissionType.WRITE ? 'default' :
                          permission.permission === PermissionType.UPDATE ? 'secondary' : 'outline'
                        }>
                          {permission.permission}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No specific permissions assigned. You have basic access.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Example 6: Advanced Permission Logic */}
          <div>
            <h3 className="text-lg font-semibold mb-3">6. Advanced Permission Logic</h3>
            <div className="space-y-4">
              {/* Complex permission check */}
              {(() => {
                const canManageProperties = hasPermission('/properties', PermissionType.WRITE) || 
                                          hasPermission('/properties', PermissionType.UPDATE) || 
                                          hasPermission('/properties', PermissionType.DELETE);
                
                return (
                  <Card className={canManageProperties ? 'border-green-200 bg-green-50' : 'border-gray-200'}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Property Management Access</h4>
                          <p className="text-sm text-gray-600">
                            {canManageProperties 
                              ? 'You can manage properties (create, update, or delete)' 
                              : 'You can only view properties'
                            }
                          </p>
                        </div>
                        <Badge variant={canManageProperties ? 'default' : 'secondary'}>
                          {canManageProperties ? 'Full Access' : 'Read Only'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}

              {/* Multiple permission check */}
              {canRead('/dashboard') && canRead('/properties') && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4">
                    <p className="text-blue-800">
                      ✅ You have access to both dashboard and properties!
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PermissionIntegrationExample;
