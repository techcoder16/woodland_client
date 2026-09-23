import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, UserPlus, Loader2 } from "lucide-react";
import BasicInfo from "./Tenant/BasicInfo";
import { post } from "@/helper/api";
import { tenantSchema } from "@/schema/tenant.schema";


type FormData = z.infer<typeof tenantSchema>;

type AddTenantModalProps = {
  isOpen: boolean;
  onClose: () => void;
  propertyId?: string;
};

// Single-step form — there's only one section (Basic Info), so no
// step/wizard chrome (Previous button, progress bar) belongs here.
export function AddTenant({ isOpen, onClose, propertyId }: AddTenantModalProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(tenantSchema),
    mode: "onSubmit",
  });
  const { toast } = useToast();
  const { watch } = form;

  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data: FormData) => {
    const isValid = await form.trigger();
    if (!isValid) return;

    setIsSubmitting(true);

    try {
      // Drop null/undefined so optional fields aren't sent as literal nulls.
      const payload: Record<string, unknown> = {};
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") payload[key] = value;
      });

      const { data: createdTenant, error } = await post<any>("tenants", payload);
      if (error && error.message) throw new Error(error.message);

      // If this modal was opened from a property page, link the new tenant
      // to that property right away, without touching the landlord or any
      // other tenant already linked to it.
      if (propertyId && createdTenant?.id) {
        const { error: linkErr } = await post(
          `property-management/party/${propertyId}/tenants/${createdTenant.id}`,
          {}
        );
        if (linkErr) {
          toast({
            title: "Tenant created",
            description:
              linkErr.message?.includes("no landlord")
                ? "Tenant was created, but this property has no landlord assigned yet — link the tenant from the Parties tab once a landlord is set."
                : "Tenant was created but could not be linked to the property automatically. Please link it from the Parties tab.",
            variant: "destructive",
          });
        }
      }

      toast({ title: "Success", description: "Tenant created successfully!" });
      onClose();
      form.reset();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to create tenant", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" /> Add New Tenant
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <BasicInfo
            watch={watch}
            register={form.register}
            errors={form.formState.errors}
            setValue={form.setValue}
            clearErrors={form.clearErrors}
          />

          <div className="flex justify-end pt-6">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Submit <Check className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}