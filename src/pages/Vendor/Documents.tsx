import FileUploadField from "@/utils/FileUploadField";

interface DocumentsProps {
  register: any;
  watch: any;
  setValue: any;
  errors: any;
  /** Set when editing; new uploads are linked to this landlord on save. */
  vendorId?: string;
}

const Documents = ({ register, watch, setValue, errors, vendorId }: DocumentsProps) => {
  return (
    <div className="w-full">
      <div className="p-4 w-full">
        <div className="text-lg font-medium flex justify-start underline p-5">Documents</div>
        <div className="flex flex-col gap-6 px-3">
          <FileUploadField
            label="Photo ID"
            name="photoIdFileId"
            accept="image/*,.pdf"
            multiple={false}
            upload={{ category: "vendor-document", entityType: "vendor", entityId: vendorId }}
            register={register}
            setValue={setValue}
            watch={watch}
            error={errors?.photoIdFileId?.message?.toString()}
          />
          <FileUploadField
            label="Proof of Relationship"
            name="proofOfRelationshipFileId"
            accept="image/*,.pdf"
            multiple={false}
            upload={{ category: "vendor-document", entityType: "vendor", entityId: vendorId }}
            register={register}
            setValue={setValue}
            watch={watch}
            error={errors?.proofOfRelationshipFileId?.message?.toString()}
          />
          <FileUploadField
            label="Proof of Ownership"
            name="proofOfOwnershipFileId"
            accept="image/*,.pdf"
            multiple={false}
            upload={{ category: "vendor-document", entityType: "vendor", entityId: vendorId }}
            register={register}
            setValue={setValue}
            watch={watch}
            error={errors?.proofOfOwnershipFileId?.message?.toString()}
          />
        </div>
      </div>
    </div>
  );
};

export default Documents;
