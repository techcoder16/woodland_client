import { Loader2, UploadCloud, X } from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";
import { UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { renderLabel } from "./FieldLabel";
import ConfirmDialog from "@/components/ConfirmDialog";
import { toast } from "sonner";
import { uploadFile, UploadOptions } from "@/helper/fileUpload";
import { useFileUrls } from "@/hooks/useFileUrls";

interface FileUploadFieldProps {
  label?: string;
  name: string;
  accept: string;
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  watch: UseFormWatch<any>;
  error?: string;
  multiple?: boolean;
  /**
   * When set, files go straight to S3 and the form value is the StoredFile id
   * (or an array of ids when `multiple`) — send it as the matching `...FileId`
   * field. Without it the value is a base64 data: URI (legacy fields only).
   */
  upload?: Omit<UploadOptions, "onProgress" | "signal">;
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
  upload,
}) => {
  const [values, setValues] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [pendingRemoveIndex, setPendingRemoveIndex] = useState<number | null>(null);

  const { onChange: formOnChange, ref, ...inputProps } = register(name);
  const urls = useFileUrls(upload ? values : []);

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

  const toValues = async (files: File[]) => {
    if (!upload) return convertFilesToBase64(files);
    setUploading((n) => n + files.length);
    const out: string[] = [];
    for (const file of files) {
      try {
        out.push((await uploadFile(file, upload)).id);
      } catch (err: any) {
        toast.error(`${file.name}: ${err?.message || "upload failed"}`);
      } finally {
        setUploading((n) => n - 1);
      }
    }
    return out;
  };

  const addFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    try {
      const added = await toValues(multiple ? list : list.slice(0, 1));
      if (!added.length) return;
      const next = multiple ? [...values, ...added] : [added[0]];
      setValue(name, multiple ? next : next[0], { shouldValidate: true, shouldDirty: true });
      setValues(next);
    } catch (error) {
      console.error("Error adding files:", error);
    }
  };

  // Handle file input change.
  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    await addFiles(files);
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
    [values, multiple, name, upload]
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
    [values, multiple, name, upload]
  );

  const removeAt = (index: number) => {
    const updated = values.filter((_, i) => i !== index);
    setValues(updated);
    setValue(name, multiple ? updated : (updated[0] ?? ""), { shouldValidate: true, shouldDirty: true });
  };

  // Use a stable variable for the file value.
  const fileValue = watch(name);

  useEffect(() => {
    if (Array.isArray(fileValue)) {
      setValues(fileValue.filter((v) => typeof v === "string" && v));
    } else if (typeof fileValue === "string" && fileValue) {
      setValues([fileValue]);
    } else {
      setValues([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileValue]);

  // Trigger the hidden file input.
  const triggerFileInput = () => {
    const input = document.getElementById(`${name}Input`) as HTMLInputElement;
    input?.click();
  };

  // Resolves a stored value to something displayable: data: URIs as-is,
  // StoredFile ids through their signed link.
  const previewOf = (value: string) => {
    if (value.startsWith("data:")) return { src: value, type: value.slice(5, value.indexOf(";")), name: "" };
    const f = urls[value];
    return f ? { src: f.url, type: f.contentType, name: f.name } : null;
  };

  return (
    <div>
      {label && <label className="block text-muted-foreground mb-2">{renderLabel(label)}</label>}
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
        {uploading > 0 ? (
          <Loader2 className="h-10 w-10 text-muted-foreground mb-2 animate-spin" />
        ) : (
          <UploadCloud className="h-10 w-10 text-muted-foreground mb-2" />
        )}
        <p className="mb-1 font-medium">
          {uploading > 0 ? "Uploading…" : "Drag and drop files here, paste, or click to upload"}
        </p>
        <p className="text-sm text-muted-foreground mb-3">Images or PDF</p>

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
      {values.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {values.map((value, index) => {
            const p = previewOf(value);
            return (
              <div key={value + index} className="relative group">
                {!p ? (
                  <div className="w-full h-32 rounded-md border border-dashed flex items-center justify-center text-xs text-muted-foreground p-2 text-center">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : p.type === "application/pdf" ? (
                  <embed src={p.src} type="application/pdf" className="w-full h-64" />
                ) : p.type.startsWith("image/") ? (
                  <img src={p.src} alt={p.name} className="object-cover rounded-md shadow-sm w-full h-32" />
                ) : (
                  <a
                    href={p.src}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="w-full h-32 rounded-md border border-dashed flex items-center justify-center text-xs text-primary underline p-2 text-center"
                  >
                    {p.name || "File attached"}
                  </a>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPendingRemoveIndex(index);
                  }}
                  className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove file"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
      <ConfirmDialog
        open={pendingRemoveIndex !== null}
        onOpenChange={(open) => !open && setPendingRemoveIndex(null)}
        title="Remove this file?"
        description="This will remove the file from the form. This can't be undone once you save."
        confirmLabel="Remove"
        onConfirm={() => {
          if (pendingRemoveIndex !== null) removeAt(pendingRemoveIndex);
        }}
      />
      {error && <p className="text-destructive text-sm mt-1">{error}</p>}
    </div>
  );
};

export default FileUploadField;
