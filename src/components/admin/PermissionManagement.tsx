import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Search, Shield, Monitor, Users, UserCheck, CheckSquare, RefreshCw } from 'lucide-react';
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
  const [isCreateScreenModalOpen, setIsCreateScreenModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBulkAssignModalOpen, setIsBulkAssignModalOpen] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<UserPermission | null>(null);
  const [selectedUserForBulk, setSelectedUserForBulk] = useState<string>('');
  const [selectedScreensForBulk, setSelectedScreensForBulk] = useState<string[]>([]);
  const [userCurrentScreens, setUserCurrentScreens] = useState<string[]>([]);
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
      console.log('Loading permission management data...');
      
      // Load data one by one to see which one fails
      console.log('Loading permissions...');
      const permissionsData = await permissionApi.getAllPermissions();
      console.log('Permissions loaded:', permissionsData);
      
      console.log('Loading screens...');
      const screensData = await screenApi.getAllScreens();
      console.log('Screens loaded:', screensData);
      
      console.log('Loading users...');
      const usersData = await userApi.getAllUsers();
      console.log('Users loaded:', usersData);
      
      setPermissions(permissionsData);
      setScreens(screensData);
      setUsers(usersData);
      
      console.log('All data loaded successfully');
    } catch (error: any) {
      console.error('Error loading permission data:', error);
      console.error('Error details:', error.response?.data || error.message);
      toast.error(error.message || 'Failed to load data');
      
      // Set empty arrays as fallback
      setPermissions([]);
      setScreens([]);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePermission = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await permissionApi.createPermission(formData);
      toast.success('Permission created successfully!');
      setIsCreateModalOpen(false);
      setFormData({ userId: '', screenId: '' });
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create permission');
    }
  };

  const handleCreateScreen = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await screenApi.createScreen(screenFormData);
      toast.success('Screen created successfully!');
      setIsCreateScreenModalOpen(false);
      setScreenFormData({ name: '', description: '', route: '', status: ScreenStatus.ACTIVE });
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create screen');
    }
  };

  const handleDeletePermission = async (permissionId: string) => {
    if (window.confirm('Are you sure you want to delete this permission?')) {
      try {
        await permissionApi.deletePermission(permissionId);
        toast.success('Permission deleted successfully!');
        loadData();
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete permission');
      }
    }
  };

  const handleDeleteScreen = async (screenId: string) => {
    if (window.confirm('Are you sure you want to delete this screen?')) {
      try {
        await screenApi.deleteScreen(screenId);
        toast.success('Screen deleted successfully!');
        loadData();
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete screen');
      }
    }
  };

  const handleBulkAssignPermissions = async () => {
    if (!isAdmin) {
      toast.error('You do not have permission to assign permissions');
      return;
    }
    if (!selectedUserForBulk || selectedScreensForBulk.length === 0) {
      toast.error('Please select a user and at least one screen');
      return;
    }
    try {
      const result = await permissionApi.bulkAssignPermissions({
        userId: selectedUserForBulk,
        screenIds: selectedScreensForBulk
      });
      toast.success(`Successfully assigned ${result.assigned} screen(s) to user!`);
      setIsBulkAssignModalOpen(false);
      setSelectedUserForBulk('');
      setSelectedScreensForBulk([]);
      setUserCurrentScreens([]);
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to assign permissions');
    }
  };

  const handleSelectAllScreens = (checked: boolean) => {
    if (checked) {
      setSelectedScreensForBulk(screens.map(screen => screen.id));
    } else {
      setSelectedScreensForBulk([]);
    }
  };

  const handleScreenToggle = (screenId: string, checked: boolean) => {
    if (checked) {
      setSelectedScreensForBulk([...selectedScreensForBulk, screenId]);
    } else {
      setSelectedScreensForBulk(selectedScreensForBulk.filter(id => id !== screenId));
    }
  };

  const handleUserSelection = (userId: string) => {
    setSelectedUserForBulk(userId);
    
    // Get current screens for this user
    const userPermissions = permissions.filter(p => p.userId === userId);
    const currentScreenIds = userPermissions.map(p => p.screenId);
    setUserCurrentScreens(currentScreenIds);
    
    // Pre-select current screens
    setSelectedScreensForBulk(currentScreenIds);
  };

  const filteredPermissions = permissions.filter(permission => {
    const user = users.find(u => u.id === permission.userId);
    const screen = screens.find(s => s.id === permission.screenId);
    const searchLower = searchTerm.toLowerCase();
    return (
      user?.first_name.toLowerCase().includes(searchLower) ||
      user?.last_name.toLowerCase().includes(searchLower) ||
      user?.email.toLowerCase().includes(searchLower) ||
      screen?.name.toLowerCase().includes(searchLower) ||
      screen?.route.toLowerCase().includes(searchLower)
    );
  });

  const filteredScreens = screens.filter(screen => {
    const searchLower = searchTerm.toLowerCase();
    return (
      screen.name.toLowerCase().includes(searchLower) ||
      screen.description.toLowerCase().includes(searchLower) ||
      screen.route.toLowerCase().includes(searchLower)
    );
  });

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
              You need administrator privileges to manage permissions.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading permission data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Permission Management
          </CardTitle>
          <CardDescription>
            Assign screen access to users and manage which users have access to which screens in your application.
          </CardDescription>
          {/* Debug Info */}
          <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
            <strong>Debug:</strong> Users: {users.length} | Screens: {screens.length} | Permissions: {permissions.length}
          </div>
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
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={loadData}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <Dialog open={isBulkAssignModalOpen} onOpenChange={setIsBulkAssignModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <UserCheck className="h-4 w-4 mr-2" />
                    Bulk Assign
                  </Button>
                </DialogTrigger>
              </Dialog>
              
              <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Assign Screen Access
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Assign Screen Access</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreatePermission} className="space-y-4">
                    <div>
                      <Label htmlFor="userId">User</Label>
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
                      <Label htmlFor="screenId">Screen</Label>
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
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">Assign Access</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
              
              {/* Bulk Assignment Modal */}
              <Dialog open={isBulkAssignModalOpen} onOpenChange={setIsBulkAssignModalOpen}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <UserCheck className="h-5 w-5" />
                      Bulk Assign Screen Permissions
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="bulkUserId">Select User</Label>
                      <Select
                        value={selectedUserForBulk}
                        onValueChange={handleUserSelection}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a user to assign permissions to" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map(user => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.first_name} {user.last_name} ({user.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <Label className="text-base font-medium">Select Screens</Label>
                          {selectedUserForBulk && userCurrentScreens.length > 0 && (
                            <p className="text-sm text-blue-600 mt-1">
                              User currently has {userCurrentScreens.length} screen(s) assigned
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {selectedUserForBulk && userCurrentScreens.length > 0 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedScreensForBulk(userCurrentScreens)}
                              className="text-xs"
                            >
                              Select Current
                            </Button>
                          )}
                          <Checkbox
                            id="selectAll"
                            checked={selectedScreensForBulk.length === screens.length}
                            onCheckedChange={handleSelectAllScreens}
                          />
                          <Label htmlFor="selectAll" className="text-sm">
                            Select All
                          </Label>
                        </div>
                      </div>
                      
                      <div className="max-h-60 overflow-y-auto border rounded-md p-4 space-y-3">
                        {screens.map(screen => {
                          const isCurrentlyAssigned = userCurrentScreens.includes(screen.id);
                          const isSelected = selectedScreensForBulk.includes(screen.id);
                          return (
                            <div key={screen.id} className={`flex items-center space-x-2 p-2 rounded-md ${
                              isCurrentlyAssigned ? 'bg-blue-50 border border-blue-200' : ''
                            }`}>
                              <Checkbox
                                id={`screen-${screen.id}`}
                                checked={isSelected}
                                onCheckedChange={(checked) => handleScreenToggle(screen.id, checked as boolean)}
                              />
                              <Label htmlFor={`screen-${screen.id}`} className="flex-1 cursor-pointer">
                                <div className="flex flex-col">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-medium">{screen.name}</span>
                                    {isCurrentlyAssigned && (
                                      <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700">
                                        Currently Assigned
                                      </Badge>
                                    )}
                                  </div>
                                  <span className="text-sm text-gray-500">{screen.route}</span>
                                </div>
                              </Label>
                              <Badge variant={screen.status === ScreenStatus.ACTIVE ? 'default' : 'destructive'}>
                                {screen.status}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                      
                      {selectedScreensForBulk.length > 0 && (
                        <p className="text-sm text-gray-600 mt-2">
                          {selectedScreensForBulk.length} screen(s) selected
                        </p>
                      )}
                    </div>
                    
                    <div className="flex gap-2 justify-end">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setIsBulkAssignModalOpen(false);
                          setSelectedUserForBulk('');
                          setSelectedScreensForBulk([]);
                          setUserCurrentScreens([]);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleBulkAssignPermissions}
                        disabled={!selectedUserForBulk || selectedScreensForBulk.length === 0}
                      >
                        <CheckSquare className="h-4 w-4 mr-2" />
                        Assign {selectedScreensForBulk.length} Screen(s)
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Tabs defaultValue="permissions" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="permissions" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                User Permissions
              </TabsTrigger>
              <TabsTrigger value="screens" className="flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                Screens
              </TabsTrigger>
            </TabsList>

            <TabsContent value="permissions" className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Permissions</p>
                        <p className="text-2xl font-bold">{permissions.length}</p>
                      </div>
                      <Shield className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Active Users</p>
                        <p className="text-2xl font-bold">{new Set(permissions.map(p => p.userId)).size}</p>
                      </div>
                      <Users className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Screens in Use</p>
                        <p className="text-2xl font-bold">{new Set(permissions.map(p => p.screenId)).size}</p>
                      </div>
                      <Monitor className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Permissions Table */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Screen</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPermissions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="flex flex-col items-center space-y-2">
                            <Shield className="h-12 w-12 text-gray-400" />
                            <p className="text-gray-500">No permissions assigned yet</p>
                            <p className="text-sm text-gray-400">Use "Bulk Assign" or "Assign Screen Access" to get started</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPermissions.map((permission) => {
                        const user = users.find(u => u.id === permission.userId);
                        const screen = screens.find(s => s.id === permission.screenId);
                        return (
                          <TableRow key={permission.id}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                  <span className="text-sm font-medium text-gray-600">
                                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                                  </span>
                                </div>
                                <div>
                                  <div className="font-medium">{user?.first_name} {user?.last_name}</div>
                                  <div className="text-sm text-gray-500">{user?.email}</div>
                                  <Badge variant="outline" className="text-xs">
                                    {user?.role}
                                  </Badge>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{screen?.name}</div>
                                <div className="text-sm text-gray-500">{screen?.description}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                                {screen?.route}
                              </code>
                            </TableCell>
                            <TableCell>
                              <Badge variant={screen?.status === ScreenStatus.ACTIVE ? 'default' : 'destructive'}>
                                {screen?.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-gray-500">
                                {permission.createdAt ? new Date(permission.createdAt).toLocaleDateString() : 'N/A'}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
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
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="screens" className="space-y-4">
              {/* Screens Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Screens</p>
                        <p className="text-2xl font-bold">{screens.length}</p>
                      </div>
                      <Monitor className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Active Screens</p>
                        <p className="text-2xl font-bold">{screens.filter(s => s.status === ScreenStatus.ACTIVE).length}</p>
                      </div>
                      <CheckSquare className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Application Screens</h3>
                <Dialog open={isCreateScreenModalOpen} onOpenChange={setIsCreateScreenModalOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Screen
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Screen</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateScreen} className="space-y-4">
                      <div>
                        <Label htmlFor="name">Screen Name</Label>
                        <Input
                          id="name"
                          value={screenFormData.name}
                          onChange={(e) => setScreenFormData({ ...screenFormData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Input
                          id="description"
                          value={screenFormData.description}
                          onChange={(e) => setScreenFormData({ ...screenFormData, description: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="route">Route</Label>
                        <Input
                          id="route"
                          value={screenFormData.route}
                          onChange={(e) => setScreenFormData({ ...screenFormData, route: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="status">Status</Label>
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
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsCreateScreenModalOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit">Create Screen</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Screen</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Users Assigned</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredScreens.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="flex flex-col items-center space-y-2">
                            <Monitor className="h-12 w-12 text-gray-400" />
                            <p className="text-gray-500">No screens created yet</p>
                            <p className="text-sm text-gray-400">Create your first screen to get started</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredScreens.map((screen) => {
                        const assignedUsers = permissions.filter(p => p.screenId === screen.id).length;
                        return (
                          <TableRow key={screen.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{screen.name}</div>
                                <div className="text-sm text-gray-500">{screen.description}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                                {screen.route}
                              </code>
                            </TableCell>
                            <TableCell>
                              <Badge variant={screen.status === ScreenStatus.ACTIVE ? 'default' : 'destructive'}>
                                {screen.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Users className="h-4 w-4 text-gray-400" />
                                <span className="text-sm font-medium">{assignedUsers}</span>
                                <span className="text-xs text-gray-500">user(s)</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-gray-500">
                                {screen.createdAt ? new Date(screen.createdAt).toLocaleDateString() : 'N/A'}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    // TODO: Add edit functionality
                                    toast.info('Edit functionality coming soon');
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteScreen(screen.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default PermissionManagement;