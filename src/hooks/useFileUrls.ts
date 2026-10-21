import { useEffect, useMemo, useState } from "react";
import { fetchFileUrls, SignedFile } from "@/helper/fileUpload";
import { PartyKind } from "@/helper/partyAuth";

// Signed S3 links for the given StoredFile ids, fetched when the page opens
// and refreshed shortly before they expire (links last 5 minutes).
export function useFileUrls(ids: (string | null | undefined)[], party?: PartyKind) {
  const key = useMemo(() => [...new Set(ids.filter(Boolean) as string[])].sort().join(","), [ids]);
  const [urls, setUrls] = useState<Record<string, SignedFile>>({});

  useEffect(() => {
    if (!key) {
      setUrls({});
      return;
    }
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const load = async () => {
      try {
        const res = await fetchFileUrls(key.split(","), { party });
        if (cancelled) return;
        setUrls(res);
        timer = setTimeout(load, 4 * 60 * 1000);
      } catch {
        if (!cancelled) setUrls({});
      }
    };
    load();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [key, party]);

  return urls;
}
