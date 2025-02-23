import { Toaster } from "./components/ui/toaster";  // Use react-hot-toast's Toaster
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Provider } from "react-redux"; // Import Redux Provider
import store from "./redux/store"; // Import Redux store

import React, { useEffect, useState } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import VendorList from "./pages/VendorList";
import AddVendor from "./pages/AddVendor";
import PropertyList from "./pages/PropertyList";
import ProtectedRoute from "@/components/ProtectedRoute"; // Import the ProtectedRoute
import { DEFAULT_COOKIE_GETTER } from "@/helper/Cookie";
import EditVendor from "./pages/EditVendor";
import AddProperty from "./pages/AddProperty";

function App() {
  

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAccessToken = async () => {
      const access_object = await DEFAULT_COOKIE_GETTER("access_token");
      setAccessToken(access_object);
      setLoading(false);
      
    };

    fetchAccessToken();
  }, []);

  if (loading) {
    return <div>Loading...</div>; // Show a loading state
  }

  return (
    <Provider store={store}> {/* Redux Provider */}
      
        <ThemeProvider defaultTheme="light">
          <TooltipProvider>
            <Toaster /> {/* Single Toaster for toast notifications */}
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />

                {/* Protected Routes */}
                <Route element={<ProtectedRoute accessToken={accessToken} />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/vendors" element={<VendorList />} />
                  <Route path="/vendors/add" element={<AddVendor />} />
                  <Route path="/property/add" element={<AddProperty />} />
                  
                  <Route path="/properties" element={<PropertyList />} />
                  <Route path="/vendors/edit" element={<EditVendor />} />
                </Route>

                {/* Redirect unknown routes to login */}
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      
    </Provider>
  );
}

export default App;
