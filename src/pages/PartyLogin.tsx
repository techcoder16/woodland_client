import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import LoadingBar from "react-top-loading-bar";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { partyLogin, PartyKind } from "@/helper/partyAuth";
import logo from "@/assets/logo.png";
import wall2 from "@/assets/wall2.jpg";
import wall3 from "@/assets/wall3.jpg";
import wall5 from "@/assets/wall5.jpg";
import wall6 from "@/assets/wall6.jpg";

const BACKGROUND_IMAGES = [wall2, wall3, wall5, wall6];

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }).min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

const KIND_LABELS: Record<PartyKind, string> = {
  vendor: "Landlord",
  tenant: "Tenant",
  contractor: "Contractor",
};

const KIND_HOME: Record<PartyKind, string> = {
  vendor: "/landlord/maintenance",
  tenant: "/tenant/maintenance",
  contractor: "/contractor/maintenance",
};

const KIND_SET_PASSWORD: Record<PartyKind, string> = {
  vendor: "/landlord/set-password",
  tenant: "/tenant/set-password",
  contractor: "/contractor/set-password",
};

const PartyLogin = ({ kind }: { kind: PartyKind }) => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [currentImage, setCurrentImage] = useState(BACKGROUND_IMAGES[0]);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const label = KIND_LABELS[kind];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prevImage) => {
        const currentIndex = BACKGROUND_IMAGES.indexOf(prevImage);
        return BACKGROUND_IMAGES[(currentIndex + 1) % BACKGROUND_IMAGES.length];
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(formSchema) });

  const onSubmit = async (payload: { email: string; password: string }) => {
    setProgress(30);
    setIsLoading(true);
    try {
      const result = await partyLogin(kind, payload.email, payload.password);
      setProgress(100);
      toast.success("Login successful");
      navigate(result.mustChangePassword ? KIND_SET_PASSWORD[kind] : KIND_HOME[kind]);
    } catch (error: any) {
      setProgress(0);
      toast.error(error.response?.data?.message || "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <LoadingBar color="hsl(0, 81%, 43%)" progress={progress} onLoaderFinished={() => setProgress(0)} />
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
        <div className="glass-card rounded-xl p-6 w-full max-w-md mx-auto relative">
          <div className="space-y-2 text-center">
            <img src={logo} alt="Woodland" className="mx-auto h-12 w-auto" />
            <h1 className="text-2xl font-bold tracking-tight">{label} Portal</h1>
            <p className="text-sm text-muted-foreground">Enter your credentials to access your account</p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" {...register("email")} className="pl-10" required />
              </div>
              {errors.email && <p className="text-sm text-destructive">{errors.email.message as string}</p>}
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
              {errors.password && <p className="text-sm text-destructive">{errors.password.message as string}</p>}
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

export default PartyLogin;
