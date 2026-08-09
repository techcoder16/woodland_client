// src/App.tsx
import React, { useEffect, useState } from "react";
import { Provider } from "react-redux";
import store from "./redux/store";
import { ThemeProvider } from "@/context/ThemeContext";
import { FontProvider } from "@/context/FontContext";
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
import ContractorList from "./pages/ContractorList";
import AddContractor from "./pages/AddContractor";
import EditContractor from "./pages/EditContractor";
import MaintenanceList from "./pages/Maintenance/MaintenanceList";
import MaintenanceDetail from "./pages/Maintenance/MaintenanceDetail";
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
import DesignPreview from "./pages/_DesignPreview";
import PartyLogin from "./pages/PartyLogin";
import PartySetPassword from "./pages/PartySetPassword";
import PartyMaintenance from "./pages/PartyMaintenance";
import PartyProtectedRoute from "@/components/PartyProtectedRoute";
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
      <FontProvider>

        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <AuthProvider>
              <Sonner/>
              <Routes>
              <Route path="/" element={<Index />} />
                <Route path="/_design-preview" element={<DesignPreview />} />
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
                  <Route path="/contractors" element={
                    <ProtectedRoute route="/contractors">
                      <ContractorList />
                    </ProtectedRoute>
                  } />
                  <Route path="/contractors/add" element={
                    <ProtectedRoute route="/contractors/add">
                      <AddContractor />
                    </ProtectedRoute>
                  } />
                  <Route path="/contractors/edit" element={
                    <ProtectedRoute route="/contractors/edit">
                      <EditContractor />
                    </ProtectedRoute>
                  } />
                  <Route path="/maintenance" element={
                    <ProtectedRoute route="/maintenance">
                      <MaintenanceList />
                    </ProtectedRoute>
                  } />
                  <Route path="/maintenance/:id" element={
                    <ProtectedRoute route="/maintenance">
                      <MaintenanceDetail />
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
            
                  {/* Landlord (Vendor) portal */}
                  <Route path="/landlord/login" element={<PartyLogin kind="vendor" />} />
                  <Route path="/landlord/set-password" element={
                    <PartyProtectedRoute kind="vendor"><PartySetPassword kind="vendor" /></PartyProtectedRoute>
                  } />
                  <Route path="/landlord/maintenance" element={
                    <PartyProtectedRoute kind="vendor"><PartyMaintenance kind="vendor" /></PartyProtectedRoute>
                  } />

                  {/* Tenant portal */}
                  <Route path="/tenant/login" element={<PartyLogin kind="tenant" />} />
                  <Route path="/tenant/set-password" element={
                    <PartyProtectedRoute kind="tenant"><PartySetPassword kind="tenant" /></PartyProtectedRoute>
                  } />
                  <Route path="/tenant/maintenance" element={
                    <PartyProtectedRoute kind="tenant"><PartyMaintenance kind="tenant" /></PartyProtectedRoute>
                  } />

                  {/* Contractor portal */}
                  <Route path="/contractor/login" element={<PartyLogin kind="contractor" />} />
                  <Route path="/contractor/set-password" element={
                    <PartyProtectedRoute kind="contractor"><PartySetPassword kind="contractor" /></PartyProtectedRoute>
                  } />
                  <Route path="/contractor/maintenance" element={
                    <PartyProtectedRoute kind="contractor"><PartyMaintenance kind="contractor" /></PartyProtectedRoute>
                  } />

                {/* Redirect unknown routes to login */}
                <Route path="*" element={<NotFound />} />
              </Routes>
       
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </FontProvider>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
