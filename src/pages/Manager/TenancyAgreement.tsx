// src/components/TenancyAgreement.tsx
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import InputField from "@/utils/InputField";
import TextAreaField from "@/utils/TextAreaField";
import RichTextEditor from "@/utils/RichTextEditor";

import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { fetchTenancyAgreement, upsertTenancyAgreement } from "@/redux/dataStore/tenancyAgreementSlice";
import { fetchPropertyParties } from "@/redux/dataStore/partySlice";
import { fetchVendors } from "@/redux/dataStore/vendorSlice";
import { fetchtenants } from "@/redux/dataStore/tenantSlice";
import SelectedField from "@/utils/SelectedField";
import { PDFViewer } from "@react-pdf/renderer";
import { Section21NoticePDF, TenancyAgreementPDF } from "@/components/pdf/TenancyPDF";
import { Dialog, DialogContent, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAppSelector } from "@/redux/reduxHooks";

// Define the form schema for Tenancy Agreement
const tenancyAgreementSchema = z.object({
  propertyId: z.string().min(1, "Property ID is required"),
 
  details: z.string().min(1, "Details are required"),
  housingAct: z.string().min(1, "Housing Act is required"),
  LetterType: z.string().min(1, "Letter Type is required"),
  TermsandCondition: z.string().min(1, "Terms and Condition are required"),
  Guaranteer: z.string().min(1, "Guarantor is required"),
  Address1: z.string().min(1, "Address1 is required"),
  Address2: z.string().optional(),
  HideLandlordAdress: z.boolean(),

  witness: z.string().optional(),
});





type TenancyAgreementFormData = z.infer<typeof tenancyAgreementSchema>;

const TenancyAgreement: React.FC<{ propertyId: string; property?: any }> = ({ propertyId, property }) => {
  const dispatch = useDispatch<any>();
  const { tenancyAgreement } = useAppSelector((state) => state.tenancyAgreement);
  const { rents } = useAppSelector((state) => state.rent);
  const { propertyParties }: any = useAppSelector((state: any) => state.parties);
  const { vendors }: any = useAppSelector((state: any) => state.vendors);
  const { tenants: allTenants }: any = useAppSelector((state: any) => state.tenants);
  const [pdfType, setPdfType] = React.useState<"section21" | "tenancy" | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    reset,
    formState: { errors },
  } = useForm<TenancyAgreementFormData>({
    resolver: zodResolver(tenancyAgreementSchema),
    defaultValues: {
      propertyId,
      tenantId: "",
      details: "",
      housingAct: "",
      LetterType: "",
      TermsandCondition: "",
      Guaranteer: "",
      Address1: "",
      Address2: "",
      HideLandlordAdress: false,
      signedDate: "",
    },
  });

  useEffect(() => {
    if (tenancyAgreement) {
      reset(tenancyAgreement);
    }
  }, [tenancyAgreement, reset]);

  useEffect(() => {
    dispatch(fetchTenancyAgreement({ propertyId }));
    dispatch(fetchPropertyParties(propertyId));
    dispatch(fetchVendors({ page: 1, search: "" }));
    dispatch(fetchtenants({ page: 1, search: "" }));
  }, [dispatch, propertyId]);

  const partyData = (propertyParties as any)?.data ?? propertyParties;
  const pdfLandlord = Array.isArray(vendors)
    ? vendors.find((v: any) => v.id === partyData?.VendorId) ?? null
    : null;
  const firstTenantId = Array.isArray(partyData?.tenants) ? partyData.tenants[0]?.id : undefined;
  const pdfTenant = Array.isArray(allTenants)
    ? allTenants.find((t: any) => t.id === firstTenantId) ?? null
    : null;

console.log(errors)

  const onSubmit = async (data: any) => {
    try {
      await dispatch(upsertTenancyAgreement(data)).unwrap();
      toast.success("Tenancy Agreement updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update Tenancy Agreement");
    }
  };

  const handlePreview = (type: "section21" | "tenancy") => setPdfType(type);

  return (
    <Card className="shadow">
      <CardHeader>
        <CardTitle>Tenancy Agreement</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Hidden Property ID */}
          <input type="hidden" {...register("propertyId")} />


          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <SelectedField
            label="Housing Act"
            name="housingAct"
            register={register}
            error={errors.housingAct?.message}
            watch={watch}
            setValue={setValue}
            options={[
              {value:"act1",label : "For Letting furnished dwelling house on an assured shorthold tenancy under Part 1 of the Housing Act 1988 as Amemded in 1996"

              }
              ,{
                                value:"act2",label :"For Letting un-furnished dwelling house on an assured shorthold tenancy under Part 1 of the Housing Act 1988 as Amemded in 1996"

              }
            ]}
          />
          <SelectedField
            label="Letter Type"
            name="LetterType"
            register={register}
            error={errors.LetterType?.message}
            options={[
              {
                label: "Private",
                value: "private"
              },

                {
                label: "Partial",
                value: "Partial"
              },
                   {
                label: "Commercial",
                value: "Commercial"
              }


            ]}
            setValue={setValue} watch={watch}          />
       
            </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

      
          <InputField
            label="Guarantor"
            name="Guaranteer"
            register={register}
            error={errors.Guaranteer?.message}
            placeholder="Enter guarantor"
            setValue={setValue}
          />

              <TextAreaField
            label="Details"
            name="details"
            register={register}
            error={errors.details?.message}
            placeholder="Enter Details"
          />

          </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <InputField
            label="Address 1"
            name="Address1"
            register={register}
            error={errors.Address1?.message}
            placeholder="Enter Address 1"
            setValue={setValue}
          />
          <InputField
            label="Address 2"
            name="Address2"
            register={register}
            error={errors.Address2?.message}
            placeholder="Enter Address 2 (optional)"
            setValue={setValue}
          />
          </div>


                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">



 <InputField
              label="Witness"
              name="witness"
              type="text"
              register={register}
              error={errors.witness?.message}
              setValue={setValue}
            />
              <InputField
              label="Hide Landlord Address"
              name="HideLandlordAdress"
              type="checkbox"
              register={register}
              error={errors.HideLandlordAdress?.message}
              setValue={setValue}
            />

</div>
    <RichTextEditor
            label="Terms and Conditions"
            value={watch("TermsandCondition") || ""}
            onChange={(html) => setValue("TermsandCondition", html)}
            error={errors.TermsandCondition?.message}
            placeholder="Enter terms and conditions"
          />

            
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => handlePreview("section21")}>
              Section 21 Notice
            </Button>
            <Button type="button" variant="outline" onClick={() => handlePreview("tenancy")}>
              Tenancy Agreement
            </Button>
            <Button type="submit">Update Tenancy Agreement</Button>
          </div>
        </form>
      </CardContent>
      {/* PDF Dialogs */}
      <Dialog open={!!pdfType} onOpenChange={(o) => !o && setPdfType(null)}>
        <DialogContent className="sm:max-w-5xl h-[90vh] w-full">
          <DialogTitle className="text-lg font-semibold">
            {pdfType === "section21" ? "Section 21 Notice" : "Tenancy Agreement"}
          </DialogTitle>
          <div className="w-full h-[78vh] border rounded-md overflow-hidden">
            <PDFViewer width="100%" height="100%" showToolbar={false}>
              {pdfType === "section21"
                ? <Section21NoticePDF data={getValues()} property={property} landlord={pdfLandlord} tenant={pdfTenant} />
                : <TenancyAgreementPDF data={getValues()} property={property} rentData={rents} landlord={pdfLandlord} tenant={pdfTenant} />
              }
            </PDFViewer>
          </div>
          <DialogFooter className="pt-2 flex justify-end">
            <Button variant="outline" onClick={() => setPdfType(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default TenancyAgreement;
