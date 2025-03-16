// src/pages/Login.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import LoadingBar from "react-top-loading-bar";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";

import wall2 from "@/assets/wall2.jpg";
import wall3 from "@/assets/wall3.jpg";
import wall5 from "@/assets/wall5.jpg";
import wall6 from "@/assets/wall6.jpg";
import { toast } from "sonner";

const Login = () => {
  const { login } = useAuth();
  const [progress, setProgress] = useState(0);
  const [currentImage, setCurrentImage] = useState(wall2);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const images = [wall2, wall3, wall5, wall6];
  const navigate = useNavigate();
  // Rotate background images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prevImage) => {
        const currentIndex = images.indexOf(prevImage);
        return images[(currentIndex + 1) % images.length];
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [images]);

  // Form validation schema
  const formSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }).min(1, "Email is required"),
    password: z.string().min(1, "Password is required"),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (payload: { email: string; password: string }) => {
    setProgress(30);
    setIsLoading(true);
    const success = await login(payload.email, payload.password);
    setProgress(100);
    setIsLoading(false);
    if (!success) {
      toast.error("Invalid email or password");

    }
else{
    toast.success("Login successful");
    navigate("/dashboard");
}


  };

  return (
    <>
      <LoadingBar color="rgb(95,126,220)" progress={progress} onLoaderFinished={() => setProgress(0)} />
      <div
        style={{
          backgroundImage: `url(${currentImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          transition: "background-image 1s ease-in-out",
        }}
        className="min-h-screen flex items-center justify-center relative"
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-md" />
       
            <div className="glass-card rounded-xl p-6 w-full max-w-md mx-auto">
              <div className="space-y-2 text-center">
                <div className="mx-auto h-12 w-12 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-white font-bold text-lg">PM</span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight">Property Management</h1>
                <p className="text-sm text-muted-foreground">Enter your credentials to access your account</p>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      placeholder="you@example.com"
                      type="email"
                      {...register("email")}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      {...register("password")}
                      className="pl-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign in"}
                </Button>
              </form>
            </div>
       
      </div>
    </>
  );
};

export default Login;
