// src/App.tsx
import React, { useEffect, useState } from "react";
import { Provider } from "react-redux";
import store from "./redux/store";
import { ThemeProvider } from "@/context/ThemeContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "./components/ui/toaster";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import VendorList from "./pages/VendorList";
import AddVendor from "./pages/AddVendor";
import PropertyList from "./pages/PropertyList";
import ProtectedRoute from "@/components/ProtectedRoute";
import { DEFAULT_COOKIE_GETTER } from "@/helper/Cookie";
import EditVendor from "./pages/EditVendor";
import AddProperty from "./pages/AddProperty";
import EditProperty from "./pages/EditProperty";
import ManageProperty from "./pages/Manager/ManagePropertyMain";
import { AuthProvider } from "./context/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { Toaster as Sonner } from "@/components/ui/sonner";
import  Settings  from "@/pages/Settings";
import TenantList from "./pages/TenantList";
import PropertyManager from "./pages/PropertyManager";
import MainTransaction from "./pages/MainTransaction";
import AdminDashboard from "./pages/SimpleAdminDashboard";
import CreateUser from "./pages/admin/CreateUser";
import CreateScreen from "./pages/admin/CreateScreen";
function App() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAccessToken = async () => {
      const token = await DEFAULT_COOKIE_GETTER("access_token");
      setAccessToken(token);
      setLoading(false);
    };

    fetchAccessToken();
  }, []);

  if (loading) {
 
    return <div>Loading...</div>;
  }

  return (
    <Provider store={store}>
      <ThemeProvider >


        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <AuthProvider>
              <Sonner/>
              <Routes>
              <Route path="/" element={<Index />} />
                {/* Protected Routes */}
        
                  <Route path="/dashboard" element={
                    <ProtectedRoute route="/dashboard">
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/vendors" element={
                    <ProtectedRoute route="/vendors">
                      <VendorList />
                    </ProtectedRoute>
                  } />
                  <Route path="/vendors/add" element={
                    <ProtectedRoute route="/vendors/add">
                      <AddVendor />
                    </ProtectedRoute>
                  } />
                  <Route path="/property/add" element={
                    <ProtectedRoute route="/property/add">
                      <AddProperty />
                    </ProtectedRoute>
                  } />
                  <Route path="/property/edit" element={
                    <ProtectedRoute route="/property/edit">
                      <EditProperty />
                    </ProtectedRoute>
                  } />
                  <Route path="/properties" element={
                    <ProtectedRoute route="/properties">
                      <PropertyList />
                    </ProtectedRoute>
                  } />
                  <Route path="/property-management" element={
                    <ProtectedRoute route="/property-management">
                      <PropertyManager />
                    </ProtectedRoute>
                  } />
                  <Route path="/transaction" element={
                    <ProtectedRoute route="/transaction">
                      <MainTransaction />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/tenants" element={
                    <ProtectedRoute route="/tenants">
                      <TenantList />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/vendors/edit" element={
                    <ProtectedRoute route="/vendors/edit">
                      <EditVendor />
                    </ProtectedRoute>
                  } />
                  {/* <Route path="/tenant/add" element={<AddTenant />} />
                  <Route path="/tenant/edit" element={<EditTenant />} />
                   */}
            
                  <Route path="/property/manager" element={
                    <ProtectedRoute route="/property/manager">
                      <ManageProperty />
                    </ProtectedRoute>
                  } />
                  <Route path="/settings" element={
                    <ProtectedRoute route="/settings">
                      <Settings />
                    </ProtectedRoute>
                  } />
                  
                  {/* Admin Routes */}
                  <Route path="/admin" element={
                    <ProtectedRoute route="/admin">
                      <AdminDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/create-user" element={
                    <ProtectedRoute route="/admin">
                      <CreateUser />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/create-screen" element={
                    <ProtectedRoute route="/admin">
                      <CreateScreen />
                    </ProtectedRoute>
                  } />
            
                {/* Redirect unknown routes to login */}
                <Route path="*" element={<NotFound />} />
              </Routes>
       
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
