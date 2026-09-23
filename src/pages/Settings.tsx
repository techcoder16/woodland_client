import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useTheme, BrandColors, DEFAULT_BRAND_COLORS } from "@/context/ThemeContext";
import { useFont } from "@/context/FontContext";
import { usePermissions } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { DEFAULT_COOKIE_GETTER } from "@/helper/Cookie";
import { patch } from "@/helper/api";

// Converts between the "H S% L%" strings the CSS custom properties use and
// the hex format a native <input type="color"> swatch needs.
function hslStringToHex(hsl: string): string {
  const [h, s, l] = hsl.split(" ").map((part) => parseFloat(part));
  const sNorm = s / 100;
  const lNorm = l / 100;
  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;
  let [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToHslString(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
      case g: h = ((b - r) / d + 2) * 60; break;
      case b: h = ((r - g) / d + 4) * 60; break;
    }
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

const COLOR_FIELDS: { key: keyof BrandColors; label: string; description: string }[] = [
  { key: "primary", label: "Primary", description: "Buttons, links, active nav, and chart accents" },
  { key: "success", label: "Success", description: "Paid / positive amounts" },
  { key: "warning", label: "Warning", description: "On hold / due soon" },
  { key: "destructive", label: "Destructive", description: "Errors and overdue amounts" },
];

const Settings = () => {
  const { isAdmin } = usePermissions();
  const { fontId, setFontId, options: fontOptions } = useFont();
  const { brandColors, setBrandColors, resetBrandColors } = useTheme();
  const [activeTab, setActiveTab] = useState("profile");
  const [profileValues, setProfileValues] = useState({
    id: "user-unique-id", // Provide user id from your auth context/state
    first_name: "Admin",
    last_name: "User",
    email: "admin@example.com",
    phone_number: ""
  });
  
    useEffect(() => {

    const fetchProfileData = async () => {
      const accessToken = await DEFAULT_COOKIE_GETTER("access_token");
      const user = await DEFAULT_COOKIE_GETTER("user");

      if (user) {
        const userData = JSON.parse(user);
        setProfileValues({
          ...profileValues,
          id: userData.id,
          first_name: userData.first_name || "",
          last_name: userData.last_name || "",
          email: userData.email || "",
          phone_number: userData.phone_number || ""
        });
      }
    };
fetchProfileData();
  },[]);

  
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
      "Content-Type": "application/json",
    };

    let user_data  = JSON.parse(user);
    profileValues.email = user_data?.email;


    const { data, error } = await patch("auth/update-meta", profileValues,headers);
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
    const { data, error } = await patch("auth/update-password", {
      email: passwordValues.email,
      currentPassword: passwordValues.currentPassword,
      newPassword: passwordValues.newPassword
    },headers);
    if (error && error) {
      toast.error(error.message);
    } else {  
      toast.success("Password updated successfully!");
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <h1 className="hero-stat text-[2rem] mb-6">Settings</h1>

        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            {isAdmin && <TabsTrigger value="appearance">Appearance</TabsTrigger>}
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
                    <Button onClick={handleProfileSave}>
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
                    <Button onClick={handlePasswordSave}>
                      Update Password
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Appearance Tab (admin only) */}
          {isAdmin && (
            <TabsContent value="appearance">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Site Font</CardTitle>
                    <CardDescription>
                      Pick a font to preview across the whole site. Your choice is saved to this browser.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                      {fontOptions.map((option) => {
                        const isSelected = option.id === fontId;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => setFontId(option.id)}
                            className={`text-left rounded-lg border p-4 transition-colors ${
                              isSelected
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-muted-foreground/40"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-muted-foreground">{option.label}</span>
                              {isSelected && <Check className="h-4 w-4 text-primary" />}
                            </div>
                            <div
                              className="text-2xl leading-tight"
                              style={{ fontFamily: `"${option.family}", system-ui, sans-serif` }}
                            >
                              Aa Bb Cc
                            </div>
                            <div
                              className="text-sm text-muted-foreground mt-1"
                              style={{ fontFamily: `"${option.family}", system-ui, sans-serif` }}
                            >
                              You're managing 12 properties
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Brand Colors</CardTitle>
                        <CardDescription>
                          Set the colors used across the whole system — buttons, active nav, status badges, and chart accents. Saved to this browser.
                        </CardDescription>
                      </div>
                      <Button variant="outline" size="sm" onClick={resetBrandColors}>
                        <RotateCcw className="mr-2 h-4 w-4" />Reset to default
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      {COLOR_FIELDS.map((field) => {
                        const hslValue = brandColors[field.key] || DEFAULT_BRAND_COLORS[field.key];
                        return (
                          <div key={field.key} className="flex items-center gap-3 rounded-lg border p-3">
                            <input
                              type="color"
                              value={hslStringToHex(hslValue)}
                              onChange={(e) =>
                                setBrandColors({ ...brandColors, [field.key]: hexToHslString(e.target.value) })
                              }
                              className="h-10 w-10 shrink-0 cursor-pointer rounded border"
                            />
                            <div>
                              <p className="text-sm font-medium">{field.label}</p>
                              <p className="text-xs text-muted-foreground">{field.description}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
