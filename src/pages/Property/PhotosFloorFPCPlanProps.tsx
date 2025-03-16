import React, { useEffect } from "react";
import InputField from "../../utils/InputField";
import FileUploadField from "../../utils/FileUploadField"; // adjust the path as needed
import SelectField from "../../utils/SelectedField";
import TextAreaField from "@/utils/TextAreaField";

interface PhotosFloorFPCPlanProps {
  register: any;
  watch: any;
  clearErrors: any;
  setValue: any;
  errors: any;
  type?: string;
  unregister:any;
}

const PhotosFloorFPCPlan = ({
  register,
  watch,
  clearErrors,
  setValue,
  unregister,
  errors,
}: PhotosFloorFPCPlanProps) => {
  // Use watch with default values
  const epcChartOption = watch("epcChartOption", "ratings");
  const epcReportOption = watch("epcReportOption", "uploadReport");

  // Ensure default values are set if the watched value is empty
  console.log(epcChartOption,epcReportOption)
  useEffect(() => {
    if (!watch("epcChartOption")) {
      setValue("epcChartOption", "ratings", { shouldValidate: true });
    }
    if (!watch("epcReportOption")) {
      setValue("epcReportOption", "uploadReport", { shouldValidate: true });
    }
  }, [setValue, watch]);

  useEffect(() => {
    if (epcChartOption === "ratings") {
      // Clear file upload error and reset file field
      unregister("epcChartFile");
   
    } else if (epcChartOption === "upload") {
      // Clear rating errors and reset rating fields
      unregister(["currentEERating", "potentialEERating"]);

    }
  }, [epcChartOption]);
  
  useEffect(() => {
    console.log(epcReportOption)
    if (epcReportOption === "uploadReport") {
      clearErrors("epcReportURL");
      unregister(['epcReportURL']); // Unregister unnecessary fields


    } else if (epcReportOption === "urlReport") {
      
      unregister(['epcReportFile']); // Unregister unnecessary fields
      

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
                defaultChecked={epcChartOption === "ratings"}
              />
              Provide Ratings
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="upload"
                {...register("epcChartOption")}
                className="mr-2"
                defaultChecked={epcChartOption === "upload"}
              />
              Upload EPC Chart (.jpg)
            </label>
          </div>
        </div>
        {epcChartOption === "ratings" && (
          <div className="mb-4">
            <div className="flex space-x-4">
              <SelectField
                label="Current Energy Efficiency Rating"
                name="currentEERating"
                watch={watch}
                setValue={setValue}
                options={Array.from({ length: 101 }, (_, i) => ({
                  value: i.toString(),
                  label: i.toString(),
                }))}
                register={register}
                error={errors.currentEERating?.message?.toString()}
                onChange={(value: string) => {
                  setValue("currentEERating", value, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                  clearErrors("currentEERating");
                }}
              />
              <SelectField
                label="Potential Energy Efficiency Rating"
                name="potentialEERating"
                watch={watch}
                setValue={setValue}
                options={Array.from({ length: 101 }, (_, i) => ({
                  value: i.toString(),
                  label: i.toString(),
                }))}
                register={register}
                error={errors.potentialEERating?.message?.toString()}
                onChange={(value: string) => {
                  setValue("potentialEERating", value, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                  clearErrors("potentialEERating");
                }}
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
                defaultChecked={epcReportOption === "uploadReport"}
              />
              Upload EPC/Home Report (PDF file only)
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="urlReport"
                {...register("epcReportOption")}
                className="mr-2"
                defaultChecked={epcReportOption === "urlReport"}
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
          label="videoTourDescription"
          name = "videoTourDescription"
          register={register}
          error={errors.videoTourDescription?.message?.toString()}
        />
        {errors.videoTourDescription && (
          <p className="text-red-500 text-sm mt-1">{errors.videoTourDescription.message}</p>
        )}
        <div className="flex items-center mt-2">
          <input
            type="checkbox"
            id="showOnWebsite"
            {...register("showOnWebsite")}
            className="form-checkbox h-5 w-5 "
          />
          <label htmlFor="showOnWebsite" className="ml-2 text-gray-700 font-medium">
            Show on website
          </label>
        </div>
      </div>
    </div>
  );
};

export default React.memo(PhotosFloorFPCPlan);
