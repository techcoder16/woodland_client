
import React, { useState } from "react";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Moon, Sun, User } from "lucide-react";
import { toast } from "sonner";

const Settings = () => {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("profile");
  const [font, setFont] = useState("inter");

  const handleSaveChanges = () => {
    toast.success("Settings saved successfully!");
  };

  const fonts = [
    { value: "inter", label: "Inter" },
    { value: "roboto", label: "Roboto" },
    { value: "poppins", label: "Poppins" },
    { value: "opensans", label: "Open Sans" },
    { value: "montserrat", label: "Montserrat" },
  ];

  return (
 
        <DashboardLayout>
          <div className="p-6 max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold tracking-tight mb-6">Settings</h1>

            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-8">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="appearance">Appearance</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
              </TabsList>

              <TabsContent value="profile">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Personal Information</CardTitle>
                      <CardDescription>Update your personal details and information.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <div className="w-24 h-24 rounded-full bg-red-600 flex items-center justify-center text-white text-2xl font-bold">
                            AU
                          </div>
                          <Button variant="outline" size="sm" className="absolute bottom-0 right-0 rounded-full w-8 h-8 p-0">
                            <User className="h-4 w-4" />
                          </Button>
                        </div>
                        <div>
                          <h3 className="font-medium">Profile Picture</h3>
                          <p className="text-sm text-muted-foreground">JPG, GIF or PNG. 1MB max size.</p>
                          <Button variant="outline" size="sm" className="mt-2">
                            Upload
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input id="firstName" defaultValue="Admin" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input id="lastName" defaultValue="User" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input id="email" type="email" defaultValue="admin@example.com" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input id="phone" placeholder="(123) 456-7890" />
                        </div>
                      </div>

                      <div className="pt-4">
                        <Button onClick={handleSaveChanges} className="bg-red-600 hover:bg-red-700">
                          Save Changes
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="appearance">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Theme Settings</CardTitle>
                      <CardDescription>Customize the appearance of the application.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="theme">Theme Mode</Label>
                          <div className="flex items-center space-x-2">
                            <Sun className="h-4 w-4" />
                            <Switch 
                              id="theme" 
                              checked={theme === "dark"} 
                              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")} 
                            />
                            <Moon className="h-4 w-4" />
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Switch between light and dark theme modes.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="font">Font Family</Label>
                        <Select value={font} onValueChange={setFont}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select font" />
                          </SelectTrigger>
                          <SelectContent>
                            {fonts.map((font) => (
                              <SelectItem key={font.value} value={font.value}>
                                {font.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">
                          Choose your preferred font for the interface.
                        </p>
                      </div>

                      <div className="pt-4">
                        <Button onClick={handleSaveChanges} className="bg-red-600 hover:bg-red-700">
                          Save Preferences
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="security">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Security Settings</CardTitle>
                      <CardDescription>Manage your account security preferences.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="font-medium">Change Password</h3>
                        <div className="space-y-2">
                          <Label htmlFor="current-password">Current Password</Label>
                          <Input id="current-password" type="password" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="new-password">New Password</Label>
                          <Input id="new-password" type="password" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirm-password">Confirm New Password</Label>
                          <Input id="confirm-password" type="password" />
                        </div>
                      </div>

                      <div className="pt-4">
                        <Button onClick={handleSaveChanges} className="bg-red-600 hover:bg-red-700">
                          Update Password
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </DashboardLayout>

  );
};

export default Settings;
