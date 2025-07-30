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
        
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/vendors" element={<VendorList />} />
                  <Route path="/vendors/add" element={<AddVendor />} />
                  <Route path="/property/add" element={<AddProperty />} />
                  <Route path="/property/edit" element={<EditProperty />} />
                  <Route path="/properties" element={<PropertyList />} />
                  <Route path="/property-management" element={<PropertyManager />} />
                  
                  <Route path="/tenants" element={<TenantList />} />
                  
                  <Route path="/vendors/edit" element={<EditVendor />} />
                  {/* <Route path="/tenant/add" element={<AddTenant />} />
                  <Route path="/tenant/edit" element={<EditTenant />} />
                   */}
            
                  <Route path="/property/manager" element={<ManageProperty />} />
                  <Route path="/settings" element={<Settings />} />
            
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
