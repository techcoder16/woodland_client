import { UploadCloud } from "lucide-react";
import React, { useState, useEffect } from "react";
import { UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form";

interface FileUploadFieldProps {
  label?: string;
  name: string;
  accept: string;
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  watch: UseFormWatch<any>;
  error?: string;
  multiple?: boolean;
}

const FileUploadField: React.FC<FileUploadFieldProps> = ({
  label,
  name,
  accept,
  register,
  setValue,
  watch,
  error,
  multiple = true,
}) => {
  const [previews, setPreviews] = useState<string[]>([]);

  // Destructure to remove the default "value" property.
  const { onChange: formOnChange, value: _value, ref, ...inputProps } = register(name);

  // Helper: Convert files to base64 array.
  const convertFilesToBase64 = (files: FileList | File[]) =>
    Promise.all(
      Array.from(files).map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (err) => reject(err);
          })
      )
    );

  // Handle file input change.
  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      try {
        const base64Arr = await convertFilesToBase64(files);
        console.log("Base64 conversion result:", base64Arr);
        // Always use an array when multiple is true.
        const newValue = multiple ? base64Arr : base64Arr[0];
        setValue(name, newValue, { shouldValidate: true, shouldDirty: true });
        setPreviews(multiple ? base64Arr : [base64Arr[0]]);
      } catch (error) {
        console.error("Error converting files:", error);
      }
    }
  };

  // Use a stable variable for the file value.
  const fileValue = watch(name);

  useEffect(() => {
    if (fileValue) {
      if (Array.isArray(fileValue)) {
        
        setPreviews(fileValue);
      } else if (typeof fileValue === "string") {
            setValue(name, [fileValue], { shouldValidate: true, shouldDirty: true });
        setPreviews([fileValue]);
      }
    }
  }, [fileValue]);

  // Trigger the hidden file input.
  const triggerFileInput = () => {
    const input = document.getElementById(`${name}Input`) as HTMLInputElement;
    input?.click();
  };

  return (
    <div>
      {label && <label className="block text-gray-700 mb-2">{label}</label>}
      <div
        className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center"
        onClick={triggerFileInput}
      >
      <UploadCloud className="h-10 w-10 text-muted-foreground mb-2" />
                      <p className="mb-1 font-medium">Drag and drop images here or click to upload</p>
                      <p className="text-sm text-muted-foreground mb-3">Support for JPG, PNG, WebP up to 10MB each</p>


        <input
          id={`${name}Input`}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={handleChange} // Only using your custom handler.
          ref={ref}
          {...inputProps}
        />
      </div>
      {previews.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {previews.map((src, index) => (
            <div key={index}>
              {accept.includes("image") ? (
                <img
                  src={src}
                  alt={`Preview ${index}`}
                  className="object-cover rounded-md shadow-sm"
                />
              ) : (
                <embed src={src} type={accept} className="w-full h-64" />
              )}
            </div>
          ))}
        </div>
      )}
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default FileUploadField;
