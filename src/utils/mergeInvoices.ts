// Joins several stored PDFs (or images) into one PDF and downloads it.
// Used on a landlord payment to download every invoice deducted on it at once.
import { PDFDocument } from "pdf-lib";
import { fetchFileUrls } from "@/helper/fileUpload";

export async function downloadMergedInvoices(fileIds: string[], fileName: string): Promise<number> {
  const ids = [...new Set(fileIds.filter(Boolean))];
  if (!ids.length) return 0;
  const urls = await fetchFileUrls(ids);
  const out = await PDFDocument.create();
  let added = 0;
  for (const id of ids) {
    const signed = urls[id];
    if (!signed) continue;
    const res = await fetch(signed.url);
    if (!res.ok) continue;
    const bytes = new Uint8Array(await res.arrayBuffer());
    const type = signed.contentType || res.headers.get("content-type") || "";
    try {
      if (type.includes("pdf")) {
        const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const pages = await out.copyPages(src, src.getPageIndices());
        pages.forEach((p) => out.addPage(p));
        added += 1;
      } else if (type.startsWith("image/")) {
        const img = type.includes("png") ? await out.embedPng(bytes) : await out.embedJpg(bytes);
        const page = out.addPage([595, 842]); // A4 in points
        const scale = Math.min(555 / img.width, 802 / img.height, 1);
        page.drawImage(img, { x: 20, y: 822 - img.height * scale, width: img.width * scale, height: img.height * scale });
        added += 1;
      }
    } catch {
      // Skip a file that is not a readable PDF/image rather than failing the whole download.
    }
  }
  if (!added) return 0;
  const blob = new Blob([await out.save()], { type: "application/pdf" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
  return added;
}
