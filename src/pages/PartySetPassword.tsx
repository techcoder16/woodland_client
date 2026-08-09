import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { partyChangePassword, PartyKind } from "@/helper/partyAuth";

const formSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const KIND_HOME: Record<PartyKind, string> = {
  vendor: "/landlord/maintenance",
  tenant: "/tenant/maintenance",
  contractor: "/contractor/maintenance",
};

const PartySetPassword = ({ kind }: { kind: PartyKind }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(formSchema) });

  const onSubmit = async (data: { password: string; confirmPassword: string }) => {
    setIsLoading(true);
    try {
      await partyChangePassword(kind, data.password);
      toast.success("Password updated");
      navigate(KIND_HOME[kind]);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40">
      <div className="glass-card rounded-xl p-6 w-full max-w-md mx-auto border bg-background">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Set a new password</h1>
          <p className="text-sm text-muted-foreground">
            You're using a temporary password. Please set a new one to continue.
          </p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input id="password" type="password" {...register("password")} required />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message as string}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input id="confirmPassword" type="password" {...register("confirmPassword")} required />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword.message as string}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Saving..." : "Set password"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default PartySetPassword;
