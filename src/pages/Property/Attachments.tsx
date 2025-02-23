import React, { useEffect, useState } from "react";

const Attachments = ({ register, clearErrors, setValue, errors, watch }: any) => {
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [fileBase64, setFileBase64] = useState<string[]>([]);

  const attachments = watch("attachments");

  useEffect(() => {
    if (attachments && attachments.length > 0) {
      console.log(typeof attachments);

      // Object.keys(attachments).map((e)=>{

      //  attachments[e].name
      // })

    

      setPreviewImages(attachments);
    }
  }, [attachments]);

  // Function to convert files to base64
  const convertToBase64 = (files: FileList | File[]) => {
    return Promise.all(
      Array.from(files).map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
          })
      )
    );
  };

  const handleFiles = async (files: File[]) => {
    if (files.length > 0) {
      const base64Files = await convertToBase64(files);
      setPreviewImages((prev) => [...prev, ...base64Files]);
      setFileBase64((prev) => [...prev, ...base64Files]);

      // Update form state using setValue
      setValue("attachments", [...fileBase64, ...base64Files], { shouldValidate: true });
      clearErrors("attachments");
    }
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/")
    );

    await handleFiles(files);
  };

  const handleFileInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []).filter((file) =>
      file.type.startsWith("image/")
    );

    await handleFiles(files);
  };

  const handleRemoveImage = (index: number) => {
    const updatedPreviews = previewImages.filter((_, i) => i !== index);
    const updatedFiles = fileBase64.filter((_, i) => i !== index);

    setPreviewImages(updatedPreviews);
    setFileBase64(updatedFiles);

    // Update form state
    setValue("attachments", updatedFiles, { shouldValidate: true });
  };  

  const handleFileInputClick = () => {
    const fileInput = document.getElementById("fileInput") as HTMLInputElement;
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
