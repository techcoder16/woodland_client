// src/components/ProtectedRoute.tsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface ProtectedRouteProps {
  // Optionally, you can accept additional props if needed
}

const ProtectedRoute = ({}: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }
  console.log(isAuthenticated)
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <Outlet />;
};

export default ProtectedRoute;
