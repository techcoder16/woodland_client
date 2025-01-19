import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import LoadingBar from "react-top-loading-bar";
import { VscEye, VscEyeClosed } from "react-icons/vsc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEFAULT_COOKIE_SETTER } from "@/helper/Cookie";
import postApi from "@/helper/postApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

import wall2 from "@/assets/wall2.jpg";
import wall3 from "@/assets/wall3.jpg";
import wall5 from "@/assets/wall5.jpg";
import wall6 from "@/assets/wall6.jpg";
import { Toaster } from "@/components/ui/toaster"; // Ensure this is properly set up

const Login = () => {
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();
  const [currentImage, setCurrentImage] = useState(wall2);
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const images = [wall2, wall3, wall5, wall6];
  const { toast } = useToast();

  // Background image transition logic
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

  const onSubmit = async (data: { email: string; password: string }) => {
    setProgress(30);

    try {

      const response = await postApi("auth/getLogin", data);
      
      setProgress(60);

      if (response?.data) {
        const { message, user, accessToken } = response.data;

        // Save user data and access token
        localStorage.setItem("user_data", JSON.stringify(user));
        await DEFAULT_COOKIE_SETTER("access_token", accessToken, false);
        await DEFAULT_COOKIE_SETTER("user", JSON.stringify({ email: user.email, name: user.name }), false);

        toast({
          title: "Success",
          description: message,
        });
        navigate("/dashboard");
        setProgress(100);

   
      } else {
        throw new Error(response?.error?.message || "Unknown error occurred");
      }
    } catch (error: any) {

      toast({
        title: "Error",
        description: error.message || "Network Error!",
        variant: "destructive",
      });
       
      // toast.error(error.message || "Network Error!");

      setProgress(100);
    }
  };

  return (

    <React.Fragment>

      <LoadingBar
        color="rgb(95,126,220)"
        progress={progress}
        onLoaderFinished={() => setProgress(0)}
      />
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
        <Card className="z-10 w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-3xl font-semibold text-center text-gray-800">
              Welcome to Woodland
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-600">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  className={`mt-1 ${errors.email ? "border-red-500" : "border-gray-300"}`}
                  placeholder="Enter your email"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors?.email?.message}</p>}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-600">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={isPasswordVisible ? "text" : "password"}
                    {...register("password")}
                    className={`mt-1 ${errors.password ? "border-red-500" : "border-gray-300"}`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordVisible(!isPasswordVisible)}
                    className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                  >
                    {isPasswordVisible ? <VscEye /> : <VscEyeClosed />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
              </div>

              <Button type="submit" className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors">
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </React.Fragment>
  );
};

export default Login;
