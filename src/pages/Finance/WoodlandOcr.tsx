import { useEffect, useRef, useState } from "react";
import { Bot, FileSearch, Loader2, Send, Upload } from "lucide-react";
import axios from "axios";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getAccessToken } from "@/helper/tokenManager";

const API_URL = import.meta.env.VITE_API_URL;

export default function WoodlandOcr() {
  const [file, setFile] = useState<File | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [summary, setSummary] = useState("");
  const [ocrData, setOcrData] = useState<unknown>(null);
  const [models, setModels] = useState<string[]>([]);
  const [model, setModel] = useState("");
  const [processing, setProcessing] = useState(false);
  const [chatting, setChatting] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getAccessToken()
      .then((token) => fetch(`${API_URL}transaction/ai/models`, { headers: { Authorization: `Bearer ${token}` } }))
      .then((response) => response.json())
      .then((data) => {
        setModels(data.models || []);
        setModel(data.models?.[0] || "");
      })
      .catch(() => setModels([]));
  }, []);

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

  const askAssistant = async () => {
    if (!question.trim()) return;
    setChatting(true);
    setAnswer("");
    try {
      const token = await getAccessToken();
      const response = await fetch(`${API_URL}transaction/ai/stream`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ question, model: model || undefined }),
      });
      if (!response.ok || !response.body) throw new Error("The assistant stream could not be started.");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let completeAnswer = "";
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        buffer += decoder.decode(chunk.value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ") || line.slice(6) === "[DONE]") continue;
          const data = JSON.parse(line.slice(6)) as { token?: string };
          completeAnswer += data.token || "";
          setAnswer(completeAnswer);
        }
      }
      setQuestion("");
    } catch (error) {
      setAnswer(error instanceof Error ? error.message : "The assistant could not answer.");
    } finally {
      setChatting(false);
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
          <aside className="surface flex min-h-[560px] flex-col p-5">
            <div className="flex items-center gap-2 border-b pb-4"><Bot className="h-5 w-5 text-primary" /><div><h2 className="font-semibold">Woodland Assistant</h2><p className="text-xs text-muted-foreground">Backend context and RAG enabled</p></div></div>
            <div className="flex-1 space-y-3 py-4">{answer ? <div className="whitespace-pre-wrap rounded-lg bg-muted p-3 text-sm">{answer}</div> : <p className="text-sm text-muted-foreground">Ask about transactions, properties, expenses, or extracted documents.</p>}</div>
            <Label className="mb-1 text-xs">AI model</Label>
            <Select value={model} onValueChange={setModel}><SelectTrigger><SelectValue placeholder="Select model" /></SelectTrigger><SelectContent>{models.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
            <div className="mt-3 flex gap-2"><Textarea value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask Woodland..." className="min-h-16" /><Button size="icon" onClick={askAssistant} disabled={chatting}>{chatting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</Button></div>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
}
