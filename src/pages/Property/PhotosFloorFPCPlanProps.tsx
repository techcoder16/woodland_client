import { useEffect } from "react";
import { useWatch } from "react-hook-form";
import InputField from "../../utils/InputField";
import FileUploadField from "../../utils/FileUploadField";
import EPCRatingSelect from "../../utils/EPCRatingSelect";
import TextAreaField from "@/utils/TextAreaField";

interface PhotosFloorFPCPlanProps {
  register: any;
  control: any;
  watch: any;
  clearErrors: any;
  setValue: any;
  errors: any;
  type?: string;
  unregister: any;
}

const PhotosFloorFPCPlan = ({
  register,
  control,
  watch,
  clearErrors,
  setValue,
  unregister,
  errors,
}: PhotosFloorFPCPlanProps) => {
  const epcChartOption = useWatch({ control, name: "epcChartOption" }) || "ratings";
  const epcReportOption = useWatch({ control, name: "epcReportOption" }) || "uploadReport";
  const showOnWebsite = useWatch({ control, name: "showOnWebsite" }) ?? false;

  useEffect(() => {
    if (epcChartOption === "ratings") {
      unregister("epcChartFile");
    } else {
      unregister(["currentEERating", "potentialEERating"]);
    }
  }, [epcChartOption]);

  useEffect(() => {
    if (epcReportOption === "uploadReport") {
      clearErrors("epcReportURL");
      unregister("epcReportURL");
    } else {
      unregister("epcReportFile");
    }
  }, [epcReportOption]);

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800 border-b border-gray-300 pb-2 mb-4">
        Photos, Floor Plans, and EPC/Home Report
      </h2>

      {/* Photographs Section */}
      <div className="mb-6">
        <h3 className="text-xl font-medium mb-2">Photographs</h3>
        <FileUploadField
          label="Upload Photographs"
          name="photographs"
          accept="image/*"
          register={register}
          setValue={setValue}
          watch={watch}
          error={errors.photographs?.message}
          multiple={true}
        />
      </div>

      {/* Floor Plans Section */}
      <div className="mb-6">
        <h3 className="text-xl font-medium mb-2">Floor Plans</h3>
        <FileUploadField
          label="Upload Floor Plans (Images or PDF)"
          name="floorPlans"
          accept="image/*,application/pdf"
          register={register}
          setValue={setValue}
          watch={watch}
          error={errors.floorPlans?.message}
          multiple={true}
        />
      </div>

      {/* EPC/Home Report Section */}
      <div className="mb-6">
        <h3 className="text-xl font-medium mb-2">EPC/Home Report</h3>

        {/* EPC Chart Option */}
        <div className="mb-4">
          <p className="mb-2 font-medium text-gray-700">EPC Chart Option</p>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="ratings"
                {...register("epcChartOption")}
                className="mr-2"
              />
              Provide Ratings
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="upload"
                {...register("epcChartOption")}
                className="mr-2"
              />
              Upload EPC Chart (.jpg)
            </label>
          </div>
        </div>
        {epcChartOption === "ratings" && (
          <div className="mb-4">
            <div className="flex space-x-4">
              <EPCRatingSelect
                label="Current Energy Efficiency Rating"
                name="currentEERating"
                watch={watch}
                register={register}
                error={errors.currentEERating?.message?.toString()}
              />
              <EPCRatingSelect
                label="Potential Energy Efficiency Rating"
                name="potentialEERating"
                watch={watch}
                register={register}
                error={errors.potentialEERating?.message?.toString()}
              />
            </div>
          </div>
        )}
        {epcChartOption === "upload" && (
          <div className="mb-4">
            <FileUploadField
              label="Upload EPC Chart (.jpg)"
              name="epcChartFile"
              accept="image/jpeg"
              register={register}
              setValue={setValue}
              watch={watch}
              error={errors.epcChartFile?.message}
              multiple={false}
            />
          </div>
        )}

        {/* EPC/Home Report Option */}
        <div className="mb-4">
          <p className="mb-2 font-medium text-gray-700">EPC/Home Report Option</p>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="uploadReport"
                {...register("epcReportOption")}
                className="mr-2"
              />
              Upload EPC/Home Report (PDF file only)
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="urlReport"
                {...register("epcReportOption")}
                className="mr-2"
              />
              Enter EPC/Home Report URL
            </label>
          </div>
        </div>
        {epcReportOption === "uploadReport" && (
          <div className="mb-4">
            <FileUploadField
              label="Upload EPC/Home Report (PDF)"
              name="epcReportFile"
              accept="application/pdf"
              register={register}
              setValue={setValue}
              watch={watch}
              error={errors.epcReportFile?.message}
              multiple={true}
            />
          </div>
        )}
        {epcReportOption === "urlReport" && (
          <div className="mb-4">
            <InputField
              label="Enter EPC/Home Report URL"
              name="epcReportURL"
              setValue={setValue}
              register={register}
              error={errors.epcReportURL?.message?.toString()}
            />
          </div>
        )}
      </div>

      {/* Video Tour Section */}
      <div className="mb-6">
        <h3 className="text-xl font-medium mb-2">Video Tour</h3>
        <TextAreaField
          placeholder="Video Tour Description"
          label="Video Tour Description"
          name="videoTourDescription"
          register={register}
          error={errors.videoTourDescription?.message?.toString()}
        />
        <div className="flex items-center mt-2">
          <input
            type="checkbox"
            id="showOnWebsite"
            {...register("showOnWebsite")}
            checked={showOnWebsite}
            onChange={(e) => {
              setValue("showOnWebsite", e.target.checked, { shouldDirty: true });
            }}
            className="form-checkbox h-5 w-5"
          />
          <label htmlFor="showOnWebsite" className="ml-2 text-gray-700 font-medium">
            Show on website
          </label>
        </div>
      </div>
    </div>
  );
};

export default PhotosFloorFPCPlan;
