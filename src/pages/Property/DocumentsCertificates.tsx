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
            label="Photographs"
            name="photographs"
            accept="image/*"
            multiple={true}
            register={register}
            setValue={setValue}
            watch={watch}
            error={errors?.photographs?.message?.toString()}
          />
          <FileUploadField
            label="Floor Plans"
            name="floorPlans"
            accept="image/*"
            multiple={true}
            register={register}
            setValue={setValue}
            watch={watch}
            error={errors?.floorPlans?.message?.toString()}
          />
        </div>
      </div>

      <div className="p-4 w-full">
        <div className="text-lg font-medium flex justify-start underline p-5">Certificates</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-3">
          <FileUploadField
            label="EPC"
            name="epcCertificate"
            accept="image/*,.pdf"
            multiple={false}
            register={register}
            setValue={setValue}
            watch={watch}
            error={errors?.epcCertificate?.message?.toString()}
          />
          <FileUploadField
            label="Gas Certificate"
            name="gasCertificate"
            accept="image/*,.pdf"
            multiple={false}
            register={register}
            setValue={setValue}
            watch={watch}
            error={errors?.gasCertificate?.message?.toString()}
          />
          <FileUploadField
            label="Electricity Certificate"
            name="electricityCertificate"
            accept="image/*,.pdf"
            multiple={false}
            register={register}
            setValue={setValue}
            watch={watch}
            error={errors?.electricityCertificate?.message?.toString()}
          />
          <FileUploadField
            label="Fire Risk Assessment (FRA)"
            name="fireRiskAssessment"
            accept="image/*,.pdf"
            multiple={false}
            register={register}
            setValue={setValue}
            watch={watch}
            error={errors?.fireRiskAssessment?.message?.toString()}
          />
          <FileUploadField
            label="Insurance"
            name="insuranceCertificate"
            accept="image/*,.pdf"
            multiple={false}
            register={register}
            setValue={setValue}
            watch={watch}
            error={errors?.insuranceCertificate?.message?.toString()}
          />
          <FileUploadField
            label="Emergency Lighting Certificate"
            name="emergencyLightingCertificate"
            accept="image/*,.pdf"
            multiple={false}
            register={register}
            setValue={setValue}
            watch={watch}
            error={errors?.emergencyLightingCertificate?.message?.toString()}
          />
          <FileUploadField
            label="Property License"
            name="propertyLicense"
            accept="image/*,.pdf"
            multiple={false}
            register={register}
            setValue={setValue}
            watch={watch}
            error={errors?.propertyLicense?.message?.toString()}
          />
        </div>
      </div>
    </div>
  );
};

export default DocumentsCertificates;
