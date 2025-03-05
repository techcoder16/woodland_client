import React from 'react';
import InputField from '../../utils/InputField';
import SelectField from '../../utils/SelectedField';
import TextAreaField from '@/utils/TextAreaField';

interface PhotosFloorFPCPlanProps {
  register: any;
  watch: any;
  clearErrors: any;
  setValue: any;
  errors: any;
  type?: string;
}

/**
 * A reusable file upload UI that shows a drag-and-drop area
 * and a "Browse Files" button. It uses the react-hook-form register.
 *
 * @param fieldName - The name of the field (e.g. "photographs" or "floorPlans")
 * @param accept - The accepted file types (e.g. "image/*" or "image/*,application/pdf")
 * @param registerFn - The register function from react-hook-form.
 */
const FileUploadUI = ({
  fieldName,
  accept,
  registerFn,
}: {
  fieldName: string;
  accept: string;
  registerFn: any;
}) => {
  // These handlers provide a better UX.
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    // You can extend this to process the dropped files.
  };

  const handleFileInputClick = () => {
    const input = document.getElementById(`${fieldName}Input`);
    input?.click();
  };

  return (
    <div className="space-y-4">
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 text-center cursor-pointer hover:bg-gray-100 transition-colors"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={handleFileInputClick}
      >
        <p className="text-gray-500">Drag and drop your files here</p>
        <p className="text-sm text-gray-400">or click to browse</p>
        <input
          id={`${fieldName}Input`}
          type="file"
          accept={accept}
          multiple
          className="hidden"
          {...registerFn(fieldName)}
        />
      </div>
      <button
        type="button"
        onClick={handleFileInputClick}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
      >
        Browse Files
      </button>
    </div>
  );
};

const PhotosFloorFPCPlan = ({ register, watch, clearErrors, setValue, errors, type }: PhotosFloorFPCPlanProps) => {
  // Generate options 0-100 for energy efficiency ratings
  const energyRatingOptions = Array.from({ length: 101 }, (_, i) => ({
    value: i.toString(),
    label: i.toString(),
  }));

  // Watch the EPC chart and EPC report option radio values
  const epcChartOption = watch("epcChartOption");
  const epcReportOption = watch("epcReportOption");

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6 space-y-8">
      {/* Photographs Section */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-800 border-b border-gray-300 pb-2 mb-4">Photographs</h2>
        <FileUploadUI
          fieldName="photographs"
          accept="image/*"
          registerFn={register}
        />
        {errors.photographs && <p className="text-red-500 text-sm mt-1">{errors.photographs.message}</p>}
      </div>

      {/* Floor Plans Section */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-800 border-b border-gray-300 pb-2 mb-4">Floor Plans</h2>
        <FileUploadUI
          fieldName="floorPlans"
          accept="image/*,application/pdf"
          registerFn={register}
        />
        {errors.floorPlans && <p className="text-red-500 text-sm mt-1">{errors.floorPlans.message}</p>}
      </div>

      {/* EPC/Home Report Section */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-800 border-b border-gray-300 pb-2 mb-4">EPC/Home Report</h2>
        
        {/* EPC Chart Option */}
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">EPC Chart Option</label>
          <div className="flex space-x-6 mb-4">
            <label className="flex items-center space-x-2">
              <input type="radio" value="ratings" {...register("epcChartOption")} className="form-radio text-blue-600" />
              <span className="text-gray-700">Provide Ratings</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="radio" value="upload" {...register("epcChartOption")} className="form-radio text-blue-600" />
              <span className="text-gray-700">Upload EPC Chart (.jpg)</span>
            </label>
          </div>
          {epcChartOption === "ratings" && (
            <div className="space-y-4">
              <SelectField
                label="Current Energy Efficiency Rating"
                name="currentEERating"
                watch={watch}
                setValue={setValue}
                options={energyRatingOptions}
                register={register}
                error={errors.currentEERating?.message?.toString()}
                onChange={(value: string) => {
                  setValue("currentEERating", value);
                  clearErrors("currentEERating");
                }}
              />
              <SelectField
                label="Potential Energy Efficiency Rating"
                name="potentialEERating"
                watch={watch}
                setValue={setValue}
                options={energyRatingOptions}
                register={register}
                error={errors.potentialEERating?.message?.toString()}
                onChange={(value: string) => {
                  setValue("potentialEERating", value);
                  clearErrors("potentialEERating");
                }}
              />
            </div>
          )}
          {epcChartOption === "upload" && (
            <div className="mt-4">
              <label className="block text-gray-700 font-medium mb-1">Upload EPC Chart (.jpg)</label>
              <input 
                type="file" 
                accept="image/jpeg" 
                {...register("epcChartFile")} 
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
              {errors.epcChartFile && <p className="text-red-500 text-sm mt-1">{errors.epcChartFile.message}</p>}
            </div>
          )}
        </div>

        {/* EPC/Home Report Option */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">EPC/Home Report Option</label>
          <div className="flex space-x-6 mb-4">
            <label className="flex items-center space-x-2">
              <input type="radio" value="uploadReport" {...register("epcReportOption")} className="form-radio text-blue-600" />
              <span className="text-gray-700">Upload EPC/Home Report (PDF file only)</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="radio" value="urlReport" {...register("epcReportOption")} className="form-radio text-blue-600" />
              <span className="text-gray-700">Enter EPC/Home Report URL</span>
            </label>
          </div>
          {epcReportOption === "uploadReport" && (
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-1">Upload EPC/Home Report (PDF)</label>
              <input 
                type="file" 
                accept="application/pdf" 
                {...register("epcReportFile")} 
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
              {errors.epcReportFile && <p className="text-red-500 text-sm mt-1">{errors.epcReportFile.message}</p>}
            </div>
          )}
          {epcReportOption === "urlReport" && (
            <div className="mb-4">
              <InputField
                setValue={setValue}
                label="Enter EPC/Home Report URL"
                name="epcReportURL"
                register={register}
                error={errors.epcReportURL?.message?.toString()}
              />
            </div>
          )}
        </div>
      </div>

      {/* Video Tour Section */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-800 border-b border-gray-300 pb-2 mb-4">Video Tour</h2>
        <div className="mb-4">
          <TextAreaField
            label="Video Tour Description"
            name="videoTourDescription"
            register={register}
            error={errors.videoTourDescription?.message?.toString()}
          />
        </div>
        <div className="flex items-center">
          <input 
            type="checkbox" 
            id="showOnWebsite" 
            {...register("showOnWebsite")} 
            className="form-checkbox h-5 w-5 text-blue-600" 
          />
          <label htmlFor="showOnWebsite" className="ml-2 text-gray-700 font-medium">Show on website</label>
        </div>
      </div>
    </div>
  );
};

export default PhotosFloorFPCPlan;
