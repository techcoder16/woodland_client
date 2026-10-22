import { useFileUrls } from "@/hooks/useFileUrls";
import { PartyKind } from "@/helper/partyAuth";

interface StoredFilePreviewProps {
  fileId: string;
  alt?: string;
  /** Applied to the <img> or the PDF <embed>. */
  className?: string;
  party?: PartyKind;
  /** Images open full size in a new tab when clicked. */
  clickToOpen?: boolean;
}

// Inline preview of a StoredFile: images as <img>, PDFs embedded, anything
// else as a link. Uses a short-lived signed S3 link.
export default function StoredFilePreview({ fileId, alt = "", className, party, clickToOpen }: StoredFilePreviewProps) {
  const urls = useFileUrls([fileId], party);
  const file = urls[fileId];
  if (!file) return <div className={`${className ?? ""} animate-pulse bg-muted`} />;
  if (file.contentType === "application/pdf") return <embed src={file.url} type="application/pdf" className={className} />;
  if (file.contentType.startsWith("image/")) {
    return (
      <img
        src={file.url}
        alt={alt}
        className={`${className ?? ""}${clickToOpen ? " cursor-pointer" : ""}`}
        onClick={clickToOpen ? () => window.open(file.url, "_blank", "noopener") : undefined}
      />
    );
  }
  return (
    <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline">
      {file.name}
    </a>
  );
}
