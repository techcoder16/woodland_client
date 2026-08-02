import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import LoadingBar from "react-top-loading-bar";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { post } from "@/helper/api";
import InputField from "@/utils/InputField";
import FileUploadField from "@/utils/FileUploadField";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  specialty: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  logo: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const AddContractor = () => {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onSubmit",
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  const { register, setValue, watch } = form;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);

  const onSubmit = async (data: FormData) => {
    setProgress(30);
    setIsSubmitting(true);

    try {
      const { data: apiData, error }: any = await post("contractor/create", data);
      setProgress(60);

      if (error && error.message) {
        toast({
          title: "Error",
          description: error.message || "Failed to create contractor.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: apiData?.message || "Contractor created successfully!",
      });
      setProgress(100);
      navigate("/contractors");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create contractor.",
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
          <h1 className="hero-stat text-3xl mb-8">Add New Contractor</h1>

          <Card className="p-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Name" name="name" register={register} setValue={setValue} error={errors.name?.message} placeholder="e.g., John Smith" />
                <InputField label="Specialty" name="specialty" register={register} setValue={setValue} error={errors.specialty?.message} placeholder="e.g., Plumbing, Electrical" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Phone" name="phone" register={register} setValue={setValue} error={errors.phone?.message} />
                <InputField label="Email" name="email" register={register} setValue={setValue} error={errors.email?.message} />
              </div>
              <InputField label="Address" name="address" register={register} setValue={setValue} error={errors.address?.message} />
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

export default AddContractor;
