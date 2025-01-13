import { Toaster } from "./components/ui/toaster";  // Use react-hot-toast's Toaster
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import React, { useEffect, useState } from "react";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import VendorList from "./pages/VendorList";
import AddVendor from "./pages/AddVendor";
import PropertyList from "./pages/PropertyList";
import ProtectedRoute from "@/components/ProtectedRoute"; // Import the ProtectedRoute
import { DEFAULT_COOKIE_GETTER } from "@/helper/Cookie";

function App() {
  const [queryClient] = useState(() =>
    new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5 * 60 * 1000, // 5 minutes
          retry: 1,
        },
      },
    })
  );

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
    <QueryClientProvider client={queryClient}>
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
                <Route path="/properties" element={<PropertyList />} />
              </Route>

              {/* Redirect unknown routes to login */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
