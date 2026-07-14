import FileUploadField from "@/utils/FileUploadField";

interface DocumentsProps {
  register: any;
  watch: any;
  setValue: any;
  errors: any;
}

const Documents = ({ register, watch, setValue, errors }: DocumentsProps) => {
  return (
    <div className="w-full">
      <div className="p-4 w-full">
        <div className="text-lg font-medium flex justify-start underline p-5">Documents</div>
        <div className="flex flex-col gap-6 px-3">
          <FileUploadField
            label="Photo ID"
            name="photoId"
            accept="image/*,.pdf"
            multiple={false}
            register={register}
            setValue={setValue}
            watch={watch}
            error={errors?.photoId?.message?.toString()}
          />
          <FileUploadField
            label="Proof of Relationship"
            name="proofOfRelationship"
            accept="image/*,.pdf"
            multiple={false}
            register={register}
            setValue={setValue}
            watch={watch}
            error={errors?.proofOfRelationship?.message?.toString()}
          />
          <FileUploadField
            label="Proof of Ownership"
            name="proofOfOwnership"
            accept="image/*,.pdf"
            multiple={false}
            register={register}
            setValue={setValue}
            watch={watch}
            error={errors?.proofOfOwnership?.message?.toString()}
          />
        </div>
      </div>
    </div>
  );
};

export default Documents;
