import React, { useState } from "react";

const Attachments = ({ register, clearErrors, setValue, errors }: any) => {
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [fileObjects, setFileObjects] = useState<File[]>([]); // To manage the actual file objects

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/")
    );

    if (files.length > 0) {
      const imagePreviews = files.map((file) => URL.createObjectURL(file));
      setPreviewImages((prev) => [...prev, ...imagePreviews]);
      setFileObjects((prev) => [...prev, ...files]);

      // Update form state using setValue
      setValue("attachments", [...fileObjects, ...files], { shouldValidate: true });
      clearErrors("attachments"); // Clear any existing validation errors
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []).filter((file) =>
      file.type.startsWith("image/")
    );

    if (files.length > 0) {
      const imagePreviews = files.map((file) => URL.createObjectURL(file));
      setPreviewImages((prev) => [...prev, ...imagePreviews]);
      setFileObjects((prev) => [...prev, ...files]);

      // Update form state using setValue
      setValue("attachments", [...fileObjects, ...files], { shouldValidate: true });
      clearErrors("attachments"); // Clear any existing validation errors
    }
  };

  const handleRemoveImage = (index: number) => {
    // Remove the selected image from both preview and file objects
    const updatedPreviews = previewImages.filter((_, i) => i !== index);
    const updatedFiles = fileObjects.filter((_, i) => i !== index);

    setPreviewImages(updatedPreviews);
    setFileObjects(updatedFiles);

    // Update form state
    setValue("attachments", updatedFiles, { shouldValidate: true });
  };

  const handleFileInputClick = () => {
    const fileInput = document.getElementById("fileInput");
    if (fileInput) fileInput.click();
  };

  return (
    <div>
      <h2 className="text-lg font-medium text-gray-600 mb-4">Attachments</h2>
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 text-center"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={handleFileInputClick}
      >
        <p className="text-gray-500">Drag and drop your images here</p>
        <p className="text-sm text-gray-400">or click to browse</p>

        <input
          id="fileInput"
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          {...register("attachments")} // Register the field
          onChange={handleFileInputChange} // Custom change handler
        />
      </div>

      {previewImages.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {previewImages.map((src, index) => (
            <div key={index} className="relative">
              <img
                src={src}
                alt={`Preview ${index}`}
                className="object-cover rounded-md shadow-sm"
              />
              {/* Close button */}
              <button
                type="button"
                className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-md"
                onClick={() => handleRemoveImage(index)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {errors.attachments && (
        <p className="text-red-500 text-sm mt-2">
          {errors.attachments.message?.toString()}
        </p>
      )}
    </div>
  );
};

export default Attachments;
