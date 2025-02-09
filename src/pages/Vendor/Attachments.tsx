import React, { useEffect, useState } from "react";

const Attachments = ({ register, clearErrors, setValue, errors, watch }: any) => {
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [fileObjects, setFileObjects] = useState<File[]>([]);

  // Watch for the attachments field value from react-hook-form
  const attachments = watch("attachments");

  // When the attachments change (or when the component mounts), update local state
  useEffect(() => {
    if (attachments && attachments.length > 0) {
      // Create preview URLs for each File object in attachments.
      const previews = attachments.map((file: File) => URL.createObjectURL(file));
      setPreviewImages(previews);
      setFileObjects(attachments);
      
      // Optional cleanup: revoke created URLs when attachments change or component unmounts.
      return () => {
        previews.forEach(url => URL.revokeObjectURL(url));
      };
    }
  }, [attachments]);

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
      clearErrors("attachments");
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
      clearErrors("attachments");
    }
  };

  const handleRemoveImage = (index: number) => {
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
          onChange={handleFileInputChange}
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
