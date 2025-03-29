import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import postApi from "@/helper/postApi"; // Your postApi function
import { DEFAULT_COOKIE_GETTER } from "@/helper/Cookie";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const [profileValues, setProfileValues] = useState({
    id: "user-unique-id", // Provide user id from your auth context/state
    first_name: "Admin",
    last_name: "User",
    email: "admin@example.com",
    phone_number: ""
  });
  
  const [passwordValues, setPasswordValues] = useState({
    email: "user-unique-id", // Provide user id from your auth context/state
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Handler for profile updates
  const handleProfileSave = async () => {

    const accessToken = await DEFAULT_COOKIE_GETTER("access_token");
    const user = await DEFAULT_COOKIE_GETTER("user");

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
    };

    let user_data  = JSON.parse(user);
    profileValues.email = user_data?.email;


    const { data, error } = await postApi("auth/update-metadata", profileValues,headers);
    if (error && error.message) {
      toast.error(error.message);
    } else {
      toast.success("Profile updated successfully!");
    }
  };

  // Handler for password updates
  const handlePasswordSave = async () => {
    const accessToken = await DEFAULT_COOKIE_GETTER("access_token");
const user = await DEFAULT_COOKIE_GETTER("user");
    
    let user_data  = JSON.parse(user);
    passwordValues.email = user_data?.email;

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
    };
    
    if (passwordValues.newPassword !== passwordValues.confirmPassword) {
      return toast.error("New passwords do not match");
    }
    const { data, error } = await postApi("auth/update-password", {
      email: passwordValues.email,
      currentPassword: passwordValues.currentPassword,
      newPassword: passwordValues.newPassword
    },headers);
    if (error && error.message) {
      toast.error(error.message);
    } else {  
      toast.success("Password updated successfully!");
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Settings</h1>

        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your personal details and information.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={profileValues.first_name}
                        onChange={(e) =>
                          setProfileValues({ ...profileValues, first_name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={profileValues.last_name}
                        onChange={(e) =>
                          setProfileValues({ ...profileValues, last_name: e.target.value })
                        }
                      />
                    </div>
                   
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="number"
                        min={0}
                        minLength={10}
                        value={profileValues.phone_number}
                        onChange={(e) =>
                          setProfileValues({ ...profileValues, phone_number: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button onClick={handleProfileSave} className="bg-red-600 hover:bg-red-700">
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Security Tab */}
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
                      <Input
                        id="current-password"
                        type="password"
                        value={passwordValues.currentPassword}
                        onChange={(e) =>
                          setPasswordValues({ ...passwordValues, currentPassword: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={passwordValues.newPassword}
                        onChange={(e) =>
                          setPasswordValues({ ...passwordValues, newPassword: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={passwordValues.confirmPassword}
                        onChange={(e) =>
                          setPasswordValues({ ...passwordValues, confirmPassword: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button onClick={handlePasswordSave} className="bg-red-600 hover:bg-red-700">
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
