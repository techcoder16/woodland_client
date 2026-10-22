import { ReactNode } from "react";
import { useFileUrls } from "@/hooks/useFileUrls";
import { PartyKind } from "@/helper/partyAuth";

interface StoredImageProps {
  fileId?: string | null;
  alt?: string;
  className?: string;
  /** Portal pages pass their party so the link is signed with their token. */
  party?: PartyKind;
  /** Shown when there is no file, or it isn't an image (e.g. a PDF floor plan). */
  fallback?: ReactNode;
}

// An <img> for a StoredFile in private S3, via a short-lived signed link.
export default function StoredImage({ fileId, alt = "", className, party, fallback = null }: StoredImageProps) {
  const urls = useFileUrls([fileId], party);
  const file = fileId ? urls[fileId] : undefined;
  if (!file || !file.contentType.startsWith("image/")) return <>{fallback}</>;
  return <img src={file.url} alt={alt} className={className} />;
}
