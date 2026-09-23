import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { partyForgotPassword, PartyKind } from "@/helper/partyAuth";
import logo from "@/assets/logo.png";

const KIND_LABELS: Record<PartyKind, string> = {
  vendor: "Landlord",
  tenant: "Tenant",
  contractor: "Contractor",
};

const KIND_LOGIN: Record<PartyKind, string> = {
  vendor: "/landlord/login",
  tenant: "/tenant/login",
  contractor: "/contractor/login",
};

const PartyForgotPassword = ({ kind }: { kind: PartyKind }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email) return;
    setSubmitting(true);
    try {
      await partyForgotPassword(kind, email);
      // Backend always returns a generic success regardless of whether the
      // email exists, so this UI never reveals account existence either.
      setSent(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Could not send reset email. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="glass-card rounded-xl p-6 w-full max-w-md mx-auto border bg-background">
        <div className="space-y-2 text-center">
          <img src={logo} alt="Woodland" className="mx-auto h-12 w-auto" />
          <h1 className="text-2xl font-bold tracking-tight">Reset {KIND_LABELS[kind]} password</h1>
          <p className="text-sm text-muted-foreground">Enter your account email and we'll send you a reset link.</p>
        </div>

        {sent ? (
          <div className="mt-6 space-y-4 text-center">
            <p className="text-sm">If an account exists for <strong>{email}</strong>, a reset link has been sent. Check your inbox.</p>
            <Button variant="outline" className="w-full" onClick={() => navigate(KIND_LOGIN[kind])}>
              <ArrowLeft className="mr-2 h-4 w-4" />Back to login
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Sending..." : "Send reset link"}
            </Button>
            <button
              type="button"
              className="w-full text-xs text-muted-foreground hover:text-foreground underline"
              onClick={() => navigate(KIND_LOGIN[kind])}
            >
              Back to login
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default PartyForgotPassword;
