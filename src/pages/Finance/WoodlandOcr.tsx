import { useRef, useState } from "react";
import { FileSearch, Loader2, Upload } from "lucide-react";
import axios from "axios";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AssistantChat from "@/components/AssistantChat";
import { Button } from "@/components/ui/button";
import { getAccessToken } from "@/helper/tokenManager";

const API_URL = import.meta.env.VITE_API_URL;

export default function WoodlandOcr() {
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState("");
  const [ocrData, setOcrData] = useState<unknown>(null);
  const [processing, setProcessing] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const processDocument = async () => {
    if (!file) return;
    setProcessing(true);
    setSummary("");
    try {
      const token = await getAccessToken();
      const formData = new FormData();
      formData.append("file", file);
      const response = await axios.post(`${API_URL}transaction/extract`, formData, {
        timeout: 300000,
        headers: { Authorization: `Bearer ${token}` },
      });
      setOcrData(response.data?.ocrData);
      setSummary(response.data?.summary || "Document extracted successfully.");
    } catch (error) {
      setSummary(error instanceof Error ? error.message : "Document processing failed.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-[1400px] space-y-6">
        <div>
          <p className="text-sm text-muted-foreground">Finance / Woodland OCR</p>
          <h1 className="text-2xl font-semibold">Woodland OCR & AI Assistant</h1>
          <p className="text-sm text-muted-foreground">Extract documents, summarize transactions, search context, and chat with the selected AI model.</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
          <section className="surface space-y-5 p-6">
            <div className="flex items-center gap-2"><FileSearch className="h-5 w-5 text-primary" /><h2 className="font-semibold">Document intelligence</h2></div>
            <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-8 text-center">
              <input ref={fileInput} type="file" accept=".pdf,image/*" className="hidden" onChange={(event) => setFile(event.target.files?.[0] || null)} />
              <Button variant="outline" onClick={() => fileInput.current?.click()}><Upload className="mr-2 h-4 w-4" />{file?.name || "Choose PDF or image"}</Button>
              <p className="mt-3 text-sm text-muted-foreground">Woodland OCR will extract transaction data and generate a review summary.</p>
              <Button className="mt-4" disabled={!file || processing} onClick={processDocument}>{processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Process document</Button>
            </div>
            {summary && <div className="whitespace-pre-wrap rounded-lg border bg-muted/30 p-4 text-sm">{summary}</div>}
            {ocrData && <details><summary className="cursor-pointer text-sm font-medium">View OCR response</summary><pre className="mt-2 max-h-80 overflow-auto rounded bg-muted p-3 text-xs">{JSON.stringify(ocrData, null, 2)}</pre></details>}
          </section>
          {/* The tool-calling assistant: it reads the live database through
              the API server's tools and streams its answer, replacing the old
              panel that sent the question with no context at all. */}
          <aside className="min-h-[560px]">
            <AssistantChat />
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
}
