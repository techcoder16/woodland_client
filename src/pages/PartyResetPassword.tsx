import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { partyResetPassword, PartyKind } from "@/helper/partyAuth";
import logo from "@/assets/logo.png";

const KIND_LOGIN: Record<PartyKind, string> = {
  vendor: "/landlord/login",
  tenant: "/tenant/login",
  contractor: "/contractor/login",
};

const PartyResetPassword = ({ kind }: { kind: PartyKind }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) {
      toast.error("This reset link is missing its token. Please request a new one.");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      await partyResetPassword(kind, token, password);
      toast.success("Password reset. Please log in with your new password.");
      navigate(KIND_LOGIN[kind]);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "This reset link is invalid or has expired.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="glass-card rounded-xl p-6 w-full max-w-md mx-auto border bg-background">
        <div className="space-y-2 text-center">
          <img src={logo} alt="Woodland" className="mx-auto h-12 w-auto" />
          <h1 className="text-2xl font-bold tracking-tight">Choose a new password</h1>
          {!token && <p className="text-sm text-destructive">This link is missing its reset token. Please request a new one from the login page.</p>}
        </div>

        <form onSubmit={onSubmit} className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                minLength={8}
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
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting || !token}>
            {submitting ? "Resetting..." : "Reset password"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default PartyResetPassword;
