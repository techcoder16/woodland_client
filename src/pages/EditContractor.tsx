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
import FileUploadField from "@/utils/FileUploadField";
import AddressSearchField from "@/components/AddressSearchField";

const formSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  specialty: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  town: z.string().optional(),
  postCode: z.string().optional(),
  country: z.string().optional(),
  logo: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const buildContractorDefaults = (contractor: any) => {
  if (!contractor) return {};
  return {
    id: contractor.id ?? "",
    name: contractor.name || "",
    specialty: contractor.specialty || "",
    phone: contractor.phone || "",
    email: contractor.email || "",
    address: contractor.address || "",
    addressLine1: contractor.addressLine1 || "",
    addressLine2: contractor.addressLine2 || "",
    town: contractor.town || "",
    postCode: contractor.postCode || "",
    country: contractor.country || "",
    logo: contractor.logo || "",
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
  const { register, setValue, watch } = form;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);

  const onSubmit = async (data: FormData) => {
    setProgress(30);
    setIsSubmitting(true);

    try {
      // Email is the contractor's login — never sent on update, even though
      // the backend independently strips it too.
      const { id, email, ...payload } = data;
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
        <LoadingBar color="hsl(0, 81%, 43%)" progress={progress} onLoaderFinished={() => setProgress(0)} />

        <div className="max-w-2xl mx-auto">
          <h1 className="hero-stat text-3xl mb-8">Edit Contractor</h1>

          <Card className="p-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Name" name="name" register={register} setValue={setValue} error={errors.name?.message} />
                <InputField label="Specialty" name="specialty" register={register} setValue={setValue} error={errors.specialty?.message} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Phone" name="phone" register={register} setValue={setValue} error={errors.phone?.message} />
                <div className="space-y-1.5">
                  <label className="text-muted-foreground font-medium text-sm">Email</label>
                  <div className="text-sm py-2">{watch("email")}</div>
                  <p className="text-xs text-muted-foreground">Email is the contractor's login and can't be changed here.</p>
                </div>
              </div>
              <div className="space-y-4">
                <AddressSearchField
                  onSelect={(address) => {
                    if (address.addressLine1) setValue("addressLine1", address.addressLine1);
                    if (address.addressLine2) setValue("addressLine2", address.addressLine2);
                    if (address.town) setValue("town", address.town);
                    if (address.postCode) setValue("postCode", address.postCode);
                    setValue("country", "GB");
                  }}
                />
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Post Code" name="postCode" register={register} setValue={setValue} error={errors.postCode?.message} />
                  <InputField label="Address Line 1" name="addressLine1" register={register} setValue={setValue} error={errors.addressLine1?.message} />
                  <InputField label="Address Line 2" name="addressLine2" register={register} setValue={setValue} error={errors.addressLine2?.message} />
                  <InputField label="Town" name="town" register={register} setValue={setValue} error={errors.town?.message} />
                  <InputField label="Country" name="country" register={register} setValue={setValue} error={errors.country?.message} />
                </div>
              </div>
              <FileUploadField
                label="Logo"
                name="logo"
                accept="image/*"
                multiple={false}
                register={register}
                setValue={setValue}
                watch={watch}
                error={errors.logo?.message}
              />

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
