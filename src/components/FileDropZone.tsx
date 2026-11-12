import { useRef, useState } from "react";
import { FileText, Upload, X } from "lucide-react";
import { toast } from "sonner";

interface FileDropZoneProps {
  file?: File | null | undefined;
  onFile?: (file: File | null) => void;
  /** When set, the zone accepts several files at once and reports them all here. */
  onFiles?: (files: File[]) => void;
  /** Comma separated extensions, e.g. ".pdf,.jpg,.png". */
  accept?: string;
  disabled?: boolean;
  hint?: string;
}

const matchesAccept = (file: File, accept?: string) => {
  if (!accept) return true;
  const name = file.name.toLowerCase();
  return accept
    .split(",")
    .map((a) => a.trim().toLowerCase())
    .filter(Boolean)
    .some((a) => (a.startsWith(".") ? name.endsWith(a) : a.endsWith("/*") ? file.type.startsWith(a.slice(0, -1)) : file.type === a));
};

/**
 * Click-or-drag-and-drop single file picker. Uses an enter/leave counter so
 * the highlight doesn't flicker when the drag crosses child elements, and
 * rejects files that don't match `accept` with a toast.
 */
export default function FileDropZone({
  file,
  onFile,
  onFiles,
  accept = ".pdf,.jpg,.jpeg,.png,.gif",
  disabled,
  hint = "PDF or image",
}: FileDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const depth = useRef(0);
  const [dragging, setDragging] = useState(false);

  const take = (files: FileList | File[] | null | undefined) => {
    if (onFiles) {
      const all = files ? Array.from(files) : [];
      const ok = all.filter((f) => matchesAccept(f, accept));
      const bad = all.filter((f) => !matchesAccept(f, accept));
      if (bad.length) toast.error(`${bad.map((f) => f.name).join(", ")} ${bad.length > 1 ? "aren't" : "isn't"} a supported file type (${hint}).`);
      if (ok.length) onFiles(ok);
      return;
    }
    const first = files && Array.from(files)[0];
    if (!first) return;
    if (!matchesAccept(first, accept)) {
      toast.error(`${first.name} isn't a supported file type (${hint}).`);
      return;
    }
    onFile?.(first);
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        if (disabled) return;
        depth.current += 1;
        setDragging(true);
      }}
      onDragOver={(e) => {
        e.preventDefault(); // required, otherwise the browser never fires onDrop
        if (e.dataTransfer) e.dataTransfer.dropEffect = disabled ? "none" : "copy";
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        depth.current = Math.max(0, depth.current - 1);
        if (depth.current === 0) setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        depth.current = 0;
        setDragging(false);
        if (!disabled) take(e.dataTransfer?.files);
      }}
      className={`flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed p-5 text-center transition-colors ${
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-primary/60"
      } ${dragging ? "border-primary bg-primary/5" : "border-border"}`}
    >
      <input
        ref={inputRef}
        type="file"
        multiple={!!onFiles}
        accept={accept}
        className="hidden"
        onChange={(e) => {
          take(e.target.files);
          e.target.value = "";
        }}
      />
      {!onFiles && file ? (
        <div className="flex max-w-full items-center gap-2 text-sm">
          <FileText className="h-4 w-4 shrink-0 text-primary" />
          <span className="truncate" title={file.name}>{file.name}</span>
          <button
            type="button"
            aria-label="Remove file"
            className="rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              onFile?.(null);
            }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <>
          <Upload className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm font-medium">{dragging ? (onFiles ? "Drop the files here" : "Drop the file here") : onFiles ? "Drag and drop files here (several at once), or click to choose" : "Drag and drop a file here, or click to choose"}</p>
        </>
      )}
      <p className="text-xs text-muted-foreground">{onFiles ? hint : file ? "Drop another file to replace it" : hint}</p>
    </div>
  );
}
