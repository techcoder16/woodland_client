import FileUploadField from "@/utils/FileUploadField";
import ImportantCertificates from "./ImportantCertificates";
import { DraftComplianceDoc } from "./ComplianceDraftStep";

interface DocumentsCertificatesProps {
  register: any;
  watch: any;
  setValue: any;
  errors: any;
  /** Set when editing an existing property; new uploads are linked on save. */
  propertyId?: string;
  /** Certificate drafts, staged until the property row exists. */
  certificateDrafts?: DraftComplianceDoc[];
  onCertificateDraftsChange?: (docs: DraftComplianceDoc[]) => void;
}

const DocumentsCertificates = ({
  register,
  watch,
  setValue,
  errors,
  propertyId,
  certificateDrafts,
  onCertificateDraftsChange,
}: DocumentsCertificatesProps) => {
  return (
    <div className="w-full">
      <div className="p-4 w-full">
        <div className="text-lg font-medium flex justify-start underline p-5">Photographs & Floor Plans</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-3">
          <FileUploadField
            label="Photograph"
            name="photographFileId"
            accept="image/*"
            multiple={false}
            register={register}
            setValue={setValue}
            watch={watch}
            error={errors?.photographFileId?.message?.toString()}
            upload={{ category: "photograph", entityType: "property", entityId: propertyId, propertyId }}
          />
          <FileUploadField
            label="Floor Plan"
            name="floorPlanFileId"
            accept="image/*,.pdf"
            multiple={false}
            register={register}
            setValue={setValue}
            watch={watch}
            error={errors?.floorPlanFileId?.message?.toString()}
            upload={{ category: "floor-plan", entityType: "property", entityId: propertyId, propertyId }}
          />
        </div>
      </div>

      {certificateDrafts && onCertificateDraftsChange && (
        <ImportantCertificates drafts={certificateDrafts} onDraftsChange={onCertificateDraftsChange} />
      )}
    </div>
  );
};

export default DocumentsCertificates;
