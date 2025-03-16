
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthBackground } from "@/components/auth/AuthBackground";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import Login from "./Login";
import { useEffect } from "react";
import { Navigate } from "react-router-dom";

const Index = () => {
  const { isAuthenticated } = useAuth(); // Assume this flag is set in your AuthContext

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
    <AuthBackground />
    <div className="relative z-10 w-full px-4">
      <Login />
    </div>
  </div>
  );
};

export default Index;
