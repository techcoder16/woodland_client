import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Search, Shield, Monitor, Users } from 'lucide-react';
import { toast } from 'sonner';
import { permissionApi, screenApi, userApi } from '@/helper/simplePermissionApi';
import { UserPermission, Screen, User, ScreenStatus } from '@/types/permissions';
import { usePermissions } from '@/hooks/usePermissions';

const PermissionManagement: React.FC = () => {
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [screens, setScreens] = useState<Screen[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isScreenModalOpen, setIsScreenModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    userId: '',
    screenId: ''
  });
  const [screenFormData, setScreenFormData] = useState({
    name: '',
    description: '',
    route: '',
    status: ScreenStatus.ACTIVE
  });

  const { isAdmin } = usePermissions();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [permissionsData, screensData, usersData] = await Promise.all([
        permissionApi.getAllPermissions(),
        screenApi.getAllScreens(),
        userApi.getAllUsers()
      ]);
      setPermissions(permissionsData);
      setScreens(screensData);
      setUsers(usersData);
    } catch (error) {
      toast.error('Failed to load data');
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePermission = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await permissionApi.createPermission(formData);
      toast.success('Permission created successfully');
      setIsCreateModalOpen(false);
      resetForm();
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create permission');
    }
  };

  const handleCreateScreen = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await screenApi.createScreen(screenFormData);
      toast.success('Screen created successfully');
      setIsScreenModalOpen(false);
      resetScreenForm();
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create screen');
    }
  };

  const handleDeletePermission = async (permissionId: string) => {
    if (window.confirm('Are you sure you want to delete this permission?')) {
      try {
        await permissionApi.deletePermission(permissionId);
        toast.success('Permission deleted successfully');
        loadData();
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete permission');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      userId: '',
      screenId: ''
    });
  };

  const resetScreenForm = () => {
    setScreenFormData({
      name: '',
      description: '',
      route: '',
      status: ScreenStatus.ACTIVE
    });
  };

  const filteredPermissions = permissions.filter(permission => {
    const user = users.find(u => u.id === permission.userId);
    const screen = screens.find(s => s.id === permission.screenId);
    return (
      user?.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user?.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      screen?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      screen?.route.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">Access Denied</h3>
          <p className="text-gray-500">You need administrator privileges to manage permissions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="permissions" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="screens">Screens</TabsTrigger>
        </TabsList>

        <TabsContent value="permissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Permission Management
              </CardTitle>
              <CardDescription>
                Assign screen access to users.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search permissions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Permission
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Permission</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreatePermission} className="space-y-4">
                      <div>
                        <Label htmlFor="user">User</Label>
                        <Select
                          value={formData.userId}
                          onValueChange={(value) => setFormData({ ...formData, userId: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a user" />
                          </SelectTrigger>
                          <SelectContent>
                            {users.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.first_name} {user.last_name} ({user.email})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="screen">Screen</Label>
                        <Select
                          value={formData.screenId}
                          onValueChange={(value) => setFormData({ ...formData, screenId: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a screen" />
                          </SelectTrigger>
                          <SelectContent>
                            {screens.map((screen) => (
                              <SelectItem key={screen.id} value={screen.id}>
                                {screen.name} ({screen.route})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit">Create Permission</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Screen</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">Loading...</TableCell>
                    </TableRow>
                  ) : filteredPermissions.length > 0 ? (
                    filteredPermissions.map((permission) => {
                      const user = users.find(u => u.id === permission.userId);
                      const screen = screens.find(s => s.id === permission.screenId);
                      return (
                        <TableRow key={permission.id}>
                          <TableCell>
                            {user ? `${user.first_name} ${user.last_name}` : 'Unknown User'}
                            <br />
                            <span className="text-sm text-gray-500">{user?.email}</span>
                          </TableCell>
                          <TableCell>{screen?.name || 'Unknown Screen'}</TableCell>
                          <TableCell>
                            <code className="bg-gray-100 px-2 py-1 rounded text-sm">{screen?.route || 'N/A'}</code>
                          </TableCell>
                          <TableCell>
                            {permission.createdAt ? new Date(permission.createdAt).toLocaleDateString() : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeletePermission(permission.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">No permissions found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="screens" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Screen Management
              </CardTitle>
              <CardDescription>
                Manage application screens and routes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-6">
                <div className="text-sm text-gray-500">
                  {screens.length} screens configured
                </div>
                <Dialog open={isScreenModalOpen} onOpenChange={setIsScreenModalOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Screen
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Screen</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateScreen} className="space-y-4">
                      <div>
                        <Label htmlFor="screen_name">Screen Name</Label>
                        <Input
                          id="screen_name"
                          value={screenFormData.name}
                          onChange={(e) => setScreenFormData({ ...screenFormData, name: e.target.value })}
                          placeholder="e.g., Dashboard"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="screen_description">Description</Label>
                        <Input
                          id="screen_description"
                          value={screenFormData.description}
                          onChange={(e) => setScreenFormData({ ...screenFormData, description: e.target.value })}
                          placeholder="Brief description of the screen"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="screen_route">Route</Label>
                        <Input
                          id="screen_route"
                          value={screenFormData.route}
                          onChange={(e) => setScreenFormData({ ...screenFormData, route: e.target.value })}
                          placeholder="e.g., /dashboard"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="screen_status">Status</Label>
                        <Select
                          value={screenFormData.status}
                          onValueChange={(value) => setScreenFormData({ ...screenFormData, status: value as ScreenStatus })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={ScreenStatus.ACTIVE}>Active</SelectItem>
                            <SelectItem value={ScreenStatus.INACTIVE}>Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setIsScreenModalOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit">Create Screen</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">Loading...</TableCell>
                    </TableRow>
                  ) : screens.length > 0 ? (
                    screens.map((screen) => (
                      <TableRow key={screen.id}>
                        <TableCell className="font-medium">{screen.name}</TableCell>
                        <TableCell>{screen.description}</TableCell>
                        <TableCell>
                          <code className="bg-gray-100 px-2 py-1 rounded text-sm">{screen.route}</code>
                        </TableCell>
                        <TableCell>
                          <Badge variant={screen.status === ScreenStatus.ACTIVE ? 'default' : 'secondary'}>
                            {screen.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {screen.createdAt ? new Date(screen.createdAt).toLocaleDateString() : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">No screens found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PermissionManagement;
