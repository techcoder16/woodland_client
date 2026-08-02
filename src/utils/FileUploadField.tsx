import { UploadCloud, X } from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";
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
  const [isDragging, setIsDragging] = useState(false);

  const { onChange: formOnChange, ref, ...inputProps } = register(name);

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

  const addFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    try {
      const base64Arr = await convertFilesToBase64(files);
      if (multiple) {
        const merged = [...previews, ...base64Arr];
        setValue(name, merged, { shouldValidate: true, shouldDirty: true });
        setPreviews(merged);
      } else {
        setValue(name, base64Arr[0], { shouldValidate: true, shouldDirty: true });
        setPreviews([base64Arr[0]]);
      }
    } catch (error) {
      console.error("Error converting files:", error);
    }
  };

  // Handle file input change.
  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await addFiles(e.target.files ?? []);
    e.target.value = "";
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        addFiles(files);
      }
    },
    [previews, multiple, name]
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLDivElement>) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const files: File[] = [];
      for (const item of Array.from(items)) {
        if (item.kind === "file") {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }
      if (files.length > 0) {
        e.preventDefault();
        addFiles(files);
      }
    },
    [previews, multiple, name]
  );

  const removeAt = (index: number) => {
    const updated = previews.filter((_, i) => i !== index);
    setPreviews(updated);
    setValue(name, multiple ? updated : (updated[0] ?? ""), { shouldValidate: true, shouldDirty: true });
  };

  // Use a stable variable for the file value.
  const fileValue = watch(name);

  useEffect(() => {
    if (fileValue) {
      if (Array.isArray(fileValue)) {
        setPreviews(fileValue);
      } else if (typeof fileValue === "string") {
        setPreviews([fileValue]);
      }
    } else {
      setPreviews([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileValue]);

  // Trigger the hidden file input.
  const triggerFileInput = () => {
    const input = document.getElementById(`${name}Input`) as HTMLInputElement;
    input?.click();
  };

  return (
    <div>
      {label && <label className="block text-muted-foreground mb-2">{label}</label>}
      <div
        className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
          isDragging ? "border-primary bg-primary/5" : ""
        }`}
        onClick={triggerFileInput}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onPaste={handlePaste}
        tabIndex={0}
      >
        <UploadCloud className="h-10 w-10 text-muted-foreground mb-2" />
        <p className="mb-1 font-medium">Drag and drop images here, paste, or click to upload</p>
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
            <div key={index} className="relative group">
              {accept.includes("image") ? (
                <img
                  src={src}
                  alt={`Preview ${index}`}
                  className="object-cover rounded-md shadow-sm w-full h-32"
                />
              ) : (
                <embed src={src} type={accept} className="w-full h-64" />
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeAt(index);
                }}
                className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove image"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      {error && <p className="text-destructive text-sm mt-1">{error}</p>}
    </div>
  );
};

export default FileUploadField;
