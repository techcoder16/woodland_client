import React from "react";
import { Navigate, Outlet } from "react-router-dom";

interface ProtectedRouteProps {
  accessToken: string | null;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ accessToken }) => {
  return accessToken ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
