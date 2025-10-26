import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, UserPlus, Monitor, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { userApi, screenApi, permissionApi } from '@/helper/simplePermissionApi';
import { User, Screen, Role, ScreenStatus } from '@/types/permissions';
import { usePermissions } from '@/hooks/usePermissions';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { validatePhoneNumber, getPhoneNumberError } from '@/utils/phoneValidation';

const CreateUser: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = usePermissions();
  const [loading, setLoading] = useState(false);
  const [screens, setScreens] = useState<Screen[]>([]);
  const [selectedScreens, setSelectedScreens] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    salutation: '',
    post_code: '',
    Address: '',
    Town: '',
    Country: '',
    phone_number: 0,
    fax: '',
    date_of_birth: '',
    website: '',
    pager: '',
    birth_place: '',
    nationality: '',
    passport: '',
    accpet_LHA_DWP: '',
    internal_info: '',
    role: Role.User
  });

  useEffect(() => {
    loadScreens();
  }, []);

  const loadScreens = async () => {
    try {
      const screensData = await screenApi.getAllScreens();
      setScreens(screensData.filter(screen => screen.status === ScreenStatus.ACTIVE));
    } catch (error) {
      toast.error('Failed to load screens');
      console.error('Error loading screens:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate phone number format
      const phoneError = getPhoneNumberError(formData.phone_number);
      if (phoneError) {
        toast.error(phoneError);
        setLoading(false);
        return;
      }

      // Create the user
      const newUser = await userApi.createUser({
        ...formData,
        phone_number: formData.phone_number || undefined
      });
      toast.success('User created successfully!');

      // If user role, assign selected screens
      if (formData.role === Role.User && selectedScreens.length > 0) {
        for (const screenId of selectedScreens) {
          try {
            await permissionApi.createPermission({
              userId: newUser.id,
              screenId: screenId
            });
          } catch (error) {
            console.log(`Permission might already exist for screen ${screenId}`);
          }
        }
        toast.success('Screen permissions assigned successfully!');
      }

      // Reset form
      setFormData({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        salutation: '',
        post_code: '',
        Address: '',
        Town: '',
        Country: '',
        phone_number: 0,
        fax: '',
        date_of_birth: '',
        website: '',
        pager: '',
        birth_place: '',
        nationality: '',
        passport: '',
        accpet_LHA_DWP: '',
        internal_info: '',
        role: Role.User
      });
      setSelectedScreens([]);

      // Navigate back to admin dashboard
      navigate('/admin');

    } catch (error: any) {
      toast.error(error.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleScreenToggle = (screenId: string) => {
    setSelectedScreens(prev => 
      prev.includes(screenId) 
        ? prev.filter(id => id !== screenId)
        : [...prev, screenId]
    );
  };

  const handleSelectAllScreens = () => {
    if (selectedScreens.length === screens.length) {
      setSelectedScreens([]);
    } else {
      setSelectedScreens(screens.map(screen => screen.id));
    }
  };

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
              You need administrator privileges to create users.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => navigate('/admin')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Admin
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New User</h1>
          <p className="text-gray-600">Add a new user and assign screen permissions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Information Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              User Information
            </CardTitle>
            <CardDescription>
              Enter the user's basic information and role.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    required
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    required
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  placeholder="Enter password"
                  minLength={6}
                />
              </div>

              <div>
                <Label htmlFor="phone_number">Phone Number *</Label>
                <Input
                  id="phone_number"
                  type="tel"
                  value={formData.phone_number || ''}
                  onChange={(e) => setFormData({ ...formData, phone_number: parseInt(e.target.value) || 0 })}
                  placeholder="Enter phone number (e.g., 1234567890)"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Format: 1234567890 (numbers only)
                </p>
              </div>

              <div>
                <Label htmlFor="salutation">Salutation</Label>
                <Input
                  id="salutation"
                  value={formData.salutation}
                  onChange={(e) => setFormData({ ...formData, salutation: e.target.value })}
                  placeholder="Mr, Mrs, Dr, etc."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="post_code">Post Code</Label>
                  <Input
                    id="post_code"
                    value={formData.post_code}
                    onChange={(e) => setFormData({ ...formData, post_code: e.target.value })}
                    placeholder="Postal code"
                  />
                </div>
                <div>
                  <Label htmlFor="Town">Town</Label>
                  <Input
                    id="Town"
                    value={formData.Town}
                    onChange={(e) => setFormData({ ...formData, Town: e.target.value })}
                    placeholder="Town/City"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="Address">Address</Label>
                <Input
                  id="Address"
                  value={formData.Address}
                  onChange={(e) => setFormData({ ...formData, Address: e.target.value })}
                  placeholder="Street address"
                />
              </div>

              <div>
                <Label htmlFor="Country">Country</Label>
                <Input
                  id="Country"
                  value={formData.Country}
                  onChange={(e) => setFormData({ ...formData, Country: e.target.value })}
                  placeholder="Country"
                />
              </div>

              <div>
                <Label htmlFor="role">User Role *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value as Role })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={Role.User}>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">User</Badge>
                        <span className="text-sm text-gray-500">Limited access to assigned screens</span>
                      </div>
                    </SelectItem>
                    <SelectItem value={Role.Admin}>
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive">Admin</Badge>
                        <span className="text-sm text-gray-500">Full access to all screens</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4">
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Creating User...' : 'Create User'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Screen Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Screen Permissions
            </CardTitle>
            <CardDescription>
              {formData.role === Role.Admin 
                ? "Admins automatically have access to all screens"
                : "Select which screens this user can access"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {formData.role === Role.Admin ? (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-green-700 mb-2">Full Access</h3>
                <p className="text-gray-600">
                  Admin users automatically have access to all screens and features.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Available Screens</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAllScreens}
                  >
                    {selectedScreens.length === screens.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {screens.map((screen) => (
                    <div
                      key={screen.id}
                      className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <Checkbox
                        id={screen.id}
                        checked={selectedScreens.includes(screen.id)}
                        onCheckedChange={() => handleScreenToggle(screen.id)}
                      />
                      <div className="flex-1">
                        <Label htmlFor={screen.id} className="font-medium cursor-pointer">
                          {screen.name}
                        </Label>
                        <p className="text-sm text-gray-500">{screen.description}</p>
                        <code className="text-xs text-gray-400">{screen.route}</code>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedScreens.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <strong>{selectedScreens.length}</strong> screen(s) selected
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </div>
    </DashboardLayout>
  );
};

export default CreateUser;
