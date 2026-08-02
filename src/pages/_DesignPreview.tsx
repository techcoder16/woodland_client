import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserPlus, ArrowLeft, ArrowRight, Check } from "lucide-react";
import BasicInfo from "./Tenant/BasicInfo";

export default function DesignPreview() {
  const [open, setOpen] = useState(false);
  const form = useForm();

  return (
    <div className="p-10 space-y-10 bg-background min-h-screen">
      <div className="flex flex-wrap gap-3 items-center">
        <Button>Default</Button>
        <Button variant="destructive">Delete</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
        <Button size="sm">Small</Button>
        <Button size="lg">Large</Button>
      </div>

      <Button onClick={() => setOpen(true)}>Open Dialog Preview</Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" /> Add New Tenant
            </DialogTitle>
          </DialogHeader>
          <form>
            <BasicInfo
              watch={form.watch}
              register={form.register}
              errors={form.formState.errors}
              setValue={form.setValue}
              clearErrors={form.clearErrors}
            />
            <div className="flex justify-between pt-6">
              <Button type="button" variant="outline" disabled>
                <ArrowLeft className="mr-2 h-4 w-4" /> Previous
              </Button>
              <Button type="button">
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
