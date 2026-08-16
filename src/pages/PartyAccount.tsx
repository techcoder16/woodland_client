import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getPartyInfo, partyChangePassword, PartyKind } from "@/helper/partyAuth";
import PartyDashboardLayout from "@/components/layout/PartyDashboardLayout";

const passwordSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

const PartyAccount = ({ kind }: { kind: PartyKind }) => {
  const [party, setParty] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormData>({ resolver: zodResolver(passwordSchema) });

  useEffect(() => {
    getPartyInfo(kind).then(setParty);
  }, [kind]);

  const onSubmit = async (data: PasswordFormData) => {
    setIsSaving(true);
    try {
      await partyChangePassword(kind, data.password);
      toast.success("Password updated");
      reset();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update password");
    } finally {
      setIsSaving(false);
    }
  };

  const displayName =
    party?.name || [party?.firstName, party?.lastName ?? party?.sureName].filter(Boolean).join(" ") || "-";

  return (
    <PartyDashboardLayout kind={kind}>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Account</h1>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Name</Label>
                <p className="text-sm mt-1">{displayName}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Email</Label>
                <p className="text-sm mt-1">{party?.email || "-"}</p>
              </div>
              {party?.phone && (
                <div>
                  <Label className="text-xs text-muted-foreground">Phone</Label>
                  <p className="text-sm mt-1">{party.phone}</p>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground pt-2">
              To update your contact details, please get in touch with your property manager.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Change password</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-sm">
              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <Input id="password" type="password" {...register("password")} />
                {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input id="confirmPassword" type="password" {...register("confirmPassword")} />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Update password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PartyDashboardLayout>
  );
};

export default PartyAccount;
