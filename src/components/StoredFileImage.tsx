import React from "react";
import { useFileUrls } from "@/hooks/useFileUrls";
import { PartyKind } from "@/helper/partyAuth";

interface StoredFileImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> {
  fileId?: string | null;
  party?: PartyKind;
  fallback?: React.ReactNode;
}

// <img> for a StoredFile id. PDFs (e.g. a floor plan) render as an embed.
const StoredFileImage: React.FC<StoredFileImageProps> = ({ fileId, party, fallback = null, ...img }) => {
  const urls = useFileUrls([fileId], party);
  const file = fileId ? urls[fileId] : undefined;
  if (!file) return <>{fallback}</>;
  if (file.contentType === "application/pdf") {
    return <embed src={file.url} type="application/pdf" className={img.className} />;
  }
  return <img {...img} src={file.url} alt={img.alt ?? file.name} />;
};

export default StoredFileImage;
