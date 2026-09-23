import FileUploadField from "@/utils/FileUploadField";

interface DocumentsCertificatesProps {
  register: any;
  watch: any;
  setValue: any;
  errors: any;
}

const DocumentsCertificates = ({ register, watch, setValue, errors }: DocumentsCertificatesProps) => {
  return (
    <div className="w-full">
      <div className="p-4 w-full">
        <div className="text-lg font-medium flex justify-start underline p-5">Photographs & Floor Plans</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-3">
          <FileUploadField
            label="Photograph"
            name="photographs"
            accept="image/*,.pdf"
            multiple={false}
            register={register}
            setValue={setValue}
            watch={watch}
            error={errors?.photographs?.message?.toString()}
          />
          <FileUploadField
            label="Floor Plan"
            name="floorPlans"
            accept="image/*,.pdf"
            multiple={false}
            register={register}
            setValue={setValue}
            watch={watch}
            error={errors?.floorPlans?.message?.toString()}
          />
        </div>
      </div>

    </div>
  );
};

export default DocumentsCertificates;
