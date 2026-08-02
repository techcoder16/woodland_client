import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import LoadingBar from "react-top-loading-bar";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { patch } from "@/helper/api";
import InputField from "@/utils/InputField";

const formSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  company: z.string().optional(),
  specialty: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  town: z.string().optional(),
  postCode: z.string().optional(),
  country: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const buildContractorDefaults = (contractor: any) => {
  if (!contractor) return {};
  return {
    id: contractor.id ?? "",
    name: contractor.name || "",
    company: contractor.company || "",
    specialty: contractor.specialty || "",
    phone: contractor.phone || "",
    email: contractor.email || "",
    addressLine1: contractor.addressLine1 || "",
    addressLine2: contractor.addressLine2 || "",
    town: contractor.town || "",
    postCode: contractor.postCode || "",
    country: contractor.country || "",
  };
};

const EditContractor = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const contractor = location.state?.contractor;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onSubmit",
    defaultValues: buildContractorDefaults(contractor) as any,
  });

  const { toast } = useToast();
  const { register, setValue } = form;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);

  const onSubmit = async (data: FormData) => {
    setProgress(30);
    setIsSubmitting(true);

    try {
      const { id, ...payload } = data;
      const { data: apiData, error }: any = await patch(`contractor/update/${id}`, payload);
      setProgress(60);

      if (error && error.message) {
        toast({
          title: "Error",
          description: error.message || "Failed to update contractor.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: apiData?.message || "Contractor updated successfully!",
      });
      setProgress(100);
      navigate("/contractors");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update contractor.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const errors = form.formState.errors;

  return (
    <DashboardLayout>
      {isSubmitting && (
        <div className="fixed inset-0 h-full w-full bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="text-white text-lg font-semibold">Processing...</div>
        </div>
      )}

      <div className="bg-background">
        <LoadingBar color="hsl(350, 74%, 45%)" progress={progress} onLoaderFinished={() => setProgress(0)} />

        <div className="max-w-3xl mx-auto">
          <h1 className="hero-stat text-3xl mb-8">Edit Contractor</h1>

          <Card className="p-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Name" name="name" register={register} setValue={setValue} error={errors.name?.message} />
                <InputField label="Company" name="company" register={register} setValue={setValue} error={errors.company?.message} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Specialty" name="specialty" register={register} setValue={setValue} error={errors.specialty?.message} />
                <InputField label="Phone" name="phone" register={register} setValue={setValue} error={errors.phone?.message} />
              </div>
              <InputField label="Email" name="email" register={register} setValue={setValue} error={errors.email?.message} />
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Address Line 1" name="addressLine1" register={register} setValue={setValue} error={errors.addressLine1?.message} />
                <InputField label="Address Line 2" name="addressLine2" register={register} setValue={setValue} error={errors.addressLine2?.message} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <InputField label="Town" name="town" register={register} setValue={setValue} error={errors.town?.message} />
                <InputField label="Post Code" name="postCode" register={register} setValue={setValue} error={errors.postCode?.message} />
                <InputField label="Country" name="country" register={register} setValue={setValue} error={errors.country?.message} />
              </div>

              <div className="flex justify-end pt-6">
                <Button type="submit" disabled={isSubmitting}>
                  Save <Check className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EditContractor;
