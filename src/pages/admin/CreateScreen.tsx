import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Monitor, Plus, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { screenApi } from '@/helper/simplePermissionApi';
import { ScreenStatus } from '@/types/permissions';
import { usePermissions } from '@/hooks/usePermissions';
import DashboardLayout from '@/components/layout/DashboardLayout';

const CreateScreen: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = usePermissions();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    route: '',
    status: ScreenStatus.ACTIVE
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await screenApi.createScreen(formData);
      toast.success('Screen created successfully!');
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        route: '',
        status: ScreenStatus.ACTIVE
      });

      // Navigate back to admin dashboard
      navigate('/admin');

    } catch (error: any) {
      toast.error(error.message || 'Failed to create screen');
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <Settings className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl">Access Denied</CardTitle>
            <CardDescription>
              You need administrator privileges to create screens.
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
          <h1 className="text-3xl font-bold tracking-tight">Create New Screen</h1>
          <p className="text-gray-600">Add a new screen/page to the application</p>
        </div>
      </div>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Screen Information
            </CardTitle>
            <CardDescription>
              Define a new screen that users can access. This will create a new page/route in your application.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name">Screen Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., Dashboard, Vendor Management, Reports"
                />
                <p className="text-sm text-gray-500 mt-1">
                  A descriptive name for this screen (shown in navigation and admin panel)
                </p>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  placeholder="Brief description of what this screen does"
                  rows={3}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Explain what users can do on this screen
                </p>
              </div>

              <div>
                <Label htmlFor="route">Route Path *</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    /
                  </span>
                  <Input
                    id="route"
                    value={formData.route}
                    onChange={(e) => setFormData({ ...formData, route: e.target.value.replace(/^\//, '') })}
                    required
                    placeholder="dashboard, vendors, reports"
                    className="rounded-l-none"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  The URL path for this screen (without leading slash). Examples: dashboard, vendors, reports, settings
                </p>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as ScreenStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ScreenStatus.ACTIVE}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Active - Users can access this screen
                      </div>
                    </SelectItem>
                    <SelectItem value={ScreenStatus.INACTIVE}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        Inactive - Screen is disabled
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500 mt-1">
                  Inactive screens cannot be accessed by any user
                </p>
              </div>

              {/* Preview */}
              {formData.name && formData.route && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Preview</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Name:</strong> {formData.name}</p>
                    <p><strong>Route:</strong> /{formData.route}</p>
                    <p><strong>Description:</strong> {formData.description}</p>
                    <p><strong>Status:</strong> 
                      <span className={`ml-1 px-2 py-1 rounded text-xs ${
                        formData.status === ScreenStatus.ACTIVE 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {formData.status}
                      </span>
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/admin')}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Creating Screen...' : 'Create Screen'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      </div>
    </DashboardLayout>
  );
};

export default CreateScreen;
