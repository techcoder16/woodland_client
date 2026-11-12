import InputField from "@/utils/InputField";
import SelectField from "@/utils/SelectedField";
import TextAreaField from "@/utils/TextAreaField";
import { DateField } from "@/utils/DateField";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Loader2, Save, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { generateManagementAgreementPdf, buildManagementAgreementPdfFile } from "@/helper/generateManagementAgreement";
import { get, post } from "@/helper/api";
import { uploadFileOnce } from "@/helper/fileUpload";

interface ManagementAgreementStepProps {
  register: any;
  watch: any;
  setValue: any;
  clearErrors: any;
  errors: any;
  vendorName?: string;
  /** Known when editing an existing property. */
  propertyId?: string;
  /** Resolves the property id, saving the property as a draft first if it does not exist yet. */
  ensurePropertyId?: () => Promise<string | null>;
}

const PAYABLE_TIMING_OPTIONS = [
  { value: "advance", label: "In Advance" },
  { value: "arrears", label: "In Arrears" },
];

const PAYABLE_IN_ADVANCE_OPTIONS = [
  { value: "1_week", label: "1 Week" },
  { value: "1_month", label: "1 Month" },
  { value: "6_months", label: "6 Months" },
  { value: "1_year", label: "1 Year" },
];

const ManagementAgreementStep = ({ register, watch, setValue, clearErrors, errors, vendorName, propertyId, ensurePropertyId }: ManagementAgreementStepProps) => {
  const [saving, setSaving] = useState<"DRAFT" | "PUBLISHED" | null>(null);
  const [agreementStatus, setAgreementStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!propertyId) return;
    get<{ data: any[] }>(`property-management/documents/${propertyId}`).then(({ data }) => {
      const doc = (data?.data || []).find((d: any) => d.kind === "MANAGEMENT_AGREEMENT");
      setAgreementStatus(doc?.status ?? null);
    });
  }, [propertyId]);

  const agreementData = () => ({
    addressLine1: watch("addressLine1"),
    addressLine2: watch("addressLine2"),
    town: watch("town"),
    postCode: watch("postCode"),
    managementDate: watch("managementDate"),
    rentEffectiveDate: watch("rentEffectiveDate"),
    rentPerMonth: watch("rentPerMonth"),
    rentPayableInAdvance: watch("rentPayableInAdvance"),
    rentPayableTiming: watch("rentPayableTiming"),
    rentalTerms: watch("rentalTerms"),
    termMonths: watch("termMonths"),
    vendorName,
  });

  // Renders the agreement to a PDF, stores it on the property's Documents tab
  // and marks it DRAFT or PUBLISHED. Saving again replaces the same document.
  const saveAgreement = async (status: "DRAFT" | "PUBLISHED") => {
    setSaving(status);
    try {
      const id = propertyId || (ensurePropertyId ? await ensurePropertyId() : null);
      if (!id) throw new Error("Save the property first (fill in the landlord and address).");
      const file = await buildManagementAgreementPdfFile(agreementData());
      const { id: fileId } = await uploadFileOnce(file, { category: "property-document", entityType: "property", propertyId: id });
      const { error } = await post("property-management/documents", {
        propertyId: id,
        title: "Management Agreement",
        fileId,
        kind: "MANAGEMENT_AGREEMENT",
        status,
        documentDate: new Date().toISOString(),
      });
      if (error) throw new Error(error.message);
      setAgreementStatus(status);
      toast.success(status === "DRAFT" ? "Agreement saved as draft in Documents." : "Agreement published to Documents.");
    } catch (error: any) {
      toast.error(error?.message || "Failed to save the agreement.");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="w-full">
      <div className="p-4 w-full">
        <div className="text-lg font-medium flex justify-start underline p-5">Management Agreement</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DateField
            label="Management Date"
            value={watch("managementDate") || ""}
            onChange={(date) => {
              setValue("managementDate", date.toISOString());
              clearErrors("managementDate");
            }}
            error={errors?.managementDate?.message?.toString()}
          />

          <DateField
            label="Rent Effective Date"
            value={watch("rentEffectiveDate") || ""}
            onChange={(date) => {
              setValue("rentEffectiveDate", date.toISOString());
              clearErrors("rentEffectiveDate");
            }}
            error={errors?.rentEffectiveDate?.message?.toString()}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Rent Per Month (£)"
            name="rentPerMonth"
            register={register}
            setValue={setValue}
            error={errors?.rentPerMonth?.message?.toString()}
          />

          <SelectField
            label="Rent Payable"
            name="rentPayableTiming"
            options={PAYABLE_TIMING_OPTIONS}
            register={register}
            setValue={setValue}
            watch={watch}
            error={errors?.rentPayableTiming?.message?.toString()}
            onChange={(value) => {
              setValue("rentPayableTiming", value);
              clearErrors("rentPayableTiming");
            }}
          />

          <SelectField
            label="Property Rent Due"
            name="rentPayableInAdvance"
            options={PAYABLE_IN_ADVANCE_OPTIONS}
            register={register}
            setValue={setValue}
            watch={watch}
            error={errors?.rentPayableInAdvance?.message?.toString()}
            onChange={(value) => {
              setValue("rentPayableInAdvance", value);
              clearErrors("rentPayableInAdvance");
            }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Term (Months)"
            name="termMonths"
            register={register}
            setValue={setValue}
            error={errors?.termMonths?.message?.toString()}
          />
        </div>

        <TextAreaField
          label="Terms"
          name="rentalTerms"
          register={register}
          error={errors?.rentalTerms?.message?.toString()}
        />

        <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
          {agreementStatus && (
            <Badge className={agreementStatus === "DRAFT" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}>
              {agreementStatus === "DRAFT" ? "Draft saved" : "Published"}
            </Badge>
          )}
          <Button type="button" variant="outline" onClick={() => generateManagementAgreementPdf(agreementData())}>
            <FileText className="mr-2 h-4 w-4" />
            Generate PDF
          </Button>
          <Button type="button" variant="outline" disabled={!!saving} onClick={() => saveAgreement("DRAFT")}>
            {saving === "DRAFT" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save as Draft
          </Button>
          <Button type="button" disabled={!!saving} onClick={() => saveAgreement("PUBLISHED")}>
            {saving === "PUBLISHED" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Publish Agreement
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ManagementAgreementStep;
