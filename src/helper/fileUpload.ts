// Uploads go browser → S3 directly with presigned URLs; the backend only
// hands out the URLs and records the file (StoredFile). Small files are one
// PUT, large ones a parallel multipart upload with per-part retries.
import { post } from "./api";
import { partyPost, PartyKind } from "./partyAuth";

export type FileCategory =
  | "photograph"
  | "floor-plan"
  | "property-attachment"
  | "feature-map"
  | "compliance"
  | "property-document"
  | "transaction-document"
  | "occupancy-document"
  | "job-media"
  | "job-invoice"
  | "vendor-document"
  | "contractor-logo"
  | "agreement"
  | "ocr";

export type FileEntityType = "property" | "transaction" | "occupancy" | "jobType" | "vendor" | "contractor" | "ocr";

export interface StoredFileRef {
  id: string;
  name: string;
  contentType: string;
  size: number;
}

export interface UploadOptions {
  category: FileCategory;
  entityType: FileEntityType;
  entityId?: string;
  propertyId?: string;
  onProgress?: (fraction: number) => void;
  signal?: AbortSignal;
  /** Portal callers (landlord/occupier/contractor) use their own token. */
  party?: PartyKind;
}

type StartResponse =
  | { fileId: string; mode: "single"; url: string }
  | { fileId: string; mode: "multipart"; partSize: number; parts: { partNumber: number; url: string }[] };

const PARALLEL_PARTS = 4;
const PART_RETRIES = 3;

async function callApi<T>(path: string, body: object, party?: PartyKind): Promise<T> {
  if (party) return partyPost<T>(party, path, body);
  const res = await post<T>(path, body);
  if (res.error || res.data == null) throw new Error(res.error?.message || "Request failed");
  return res.data;
}

// XHR (not fetch) so upload progress is reported.
function putBlob(url: string, body: Blob, contentType: string | null, onBytes: (loaded: number) => void, signal?: AbortSignal) {
  return new Promise<string | null>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    if (contentType) xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = (e) => onBytes(e.loaded);
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve(xhr.getResponseHeader("ETag")) : reject(new Error(`Upload failed (${xhr.status})`)));
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.onabort = () => reject(new DOMException("Upload cancelled", "AbortError"));
    signal?.addEventListener("abort", () => xhr.abort(), { once: true });
    xhr.send(body);
  });
}

export async function uploadFile(file: File, opts: UploadOptions): Promise<StoredFileRef> {
  const contentType = file.type || "application/octet-stream";
  const start = await callApi<StartResponse>(
    "files/uploads",
    {
      fileName: file.name,
      contentType,
      size: file.size,
      category: opts.category,
      entityType: opts.entityType,
      entityId: opts.entityId,
      propertyId: opts.propertyId,
    },
    opts.party,
  );

  const report = (loaded: number) => opts.onProgress?.(Math.min(1, loaded / file.size));
  try {
    if (start.mode === "single") {
      await putBlob(start.url, file, contentType, report, opts.signal);
      return await callApi<StoredFileRef>(`files/uploads/${start.fileId}/complete`, {}, opts.party);
    }

    const loadedByPart = new Map<number, number>();
    const tick = () => report([...loadedByPart.values()].reduce((a, b) => a + b, 0));
    const done: { partNumber: number; etag: string }[] = [];
    const queue = [...start.parts];

    const worker = async () => {
      for (let part = queue.shift(); part; part = queue.shift()) {
        const from = (part.partNumber - 1) * start.partSize;
        const blob = file.slice(from, Math.min(from + start.partSize, file.size));
        for (let attempt = 1; ; attempt++) {
          try {
            // Part URLs are signed without Content-Type, so none is sent.
            const etag = await putBlob(part.url, blob, null, (n) => { loadedByPart.set(part!.partNumber, n); tick(); }, opts.signal);
            if (!etag) throw new Error("S3 did not return an ETag (check bucket CORS ExposeHeaders)");
            done.push({ partNumber: part.partNumber, etag });
            break;
          } catch (err) {
            if (opts.signal?.aborted || attempt >= PART_RETRIES) throw err;
            loadedByPart.set(part.partNumber, 0);
            await new Promise((r) => setTimeout(r, 500 * 2 ** attempt));
          }
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(PARALLEL_PARTS, start.parts.length) }, worker));
    return await callApi<StoredFileRef>(`files/uploads/${start.fileId}/complete`, { parts: done }, opts.party);
  } catch (err) {
    callApi(`files/uploads/${start.fileId}/abort`, {}, opts.party).catch(() => undefined);
    throw err;
  }
}

// A picked File is uploaded at most once per page: OCR and the later save
// share the same StoredFile instead of sending the bytes twice.
const uploadedOnce = new WeakMap<File, Promise<StoredFileRef>>();

export function uploadFileOnce(file: File, opts: UploadOptions): Promise<StoredFileRef> {
  let pending = uploadedOnce.get(file);
  if (!pending) {
    pending = uploadFile(file, opts);
    pending.catch(() => uploadedOnce.delete(file));
    uploadedOnce.set(file, pending);
  }
  return pending;
}

export async function uploadFiles(files: File[], opts: UploadOptions): Promise<StoredFileRef[]> {
  const total = files.reduce((a, f) => a + f.size, 0) || 1;
  const loaded = files.map(() => 0);
  const out: StoredFileRef[] = [];
  for (let i = 0; i < files.length; i++) {
    out.push(
      await uploadFile(files[i], {
        ...opts,
        onProgress: (f) => {
          loaded[i] = f * files[i].size;
          opts.onProgress?.(loaded.reduce((a, b) => a + b, 0) / total);
        },
      }),
    );
  }
  return out;
}

export interface SignedFile {
  url: string;
  name: string;
  contentType: string;
  size: number;
  expiresAt: string;
}

// Short-lived (5 min) download links. Missing ids = not found / not allowed.
export async function fetchFileUrls(ids: string[], opts: { download?: boolean; party?: PartyKind } = {}) {
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return {} as Record<string, SignedFile>;
  return callApi<Record<string, SignedFile>>("files/urls", { ids: unique, download: !!opts.download }, opts.party);
}

// Opens or saves a file under its original name using a fresh signed link.
export async function openStoredFile(id: string, opts: { download?: boolean; party?: PartyKind } = {}) {
  const urls = await fetchFileUrls([id], opts);
  const f = urls[id];
  if (!f) throw new Error("File not available");
  window.open(f.url, "_blank", "noopener");
}
