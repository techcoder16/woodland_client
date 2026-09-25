import { useEffect, useRef, useState } from "react";
import { Bot, Loader2, Send, User, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAccessToken } from "@/helper/tokenManager";

const API_URL = import.meta.env.VITE_API_URL;

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  /** Tool activity shown under an assistant turn, newest last. */
  steps?: string[];
  /** What the assistant is doing right now; cleared once text arrives. */
  status?: string;
};

/**
 * Minimal renderer for the markdown the assistant actually produces: bold,
 * bullet lists and pipe tables. Enough to stop answers reading as raw
 * asterisks and pipes, without pulling in a markdown dependency.
 */
function RichText({ text }: { text: string }) {
  const bold = (line: string) =>
    line.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={index}>{part.slice(2, -2)}</strong>
      ) : (
        <span key={index}>{part}</span>
      ),
    );

  const blocks: JSX.Element[] = [];
  const lines = text.split("\n");
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    // A pipe table: header, separator, then rows.
    const isTableRow = (value: string) => value.trim().startsWith("|") && value.trim().endsWith("|");
    const isSeparator = (value: string) => /^\s*\|[\s:|-]+\|\s*$/.test(value);

    if (isTableRow(line) && index + 1 < lines.length && isSeparator(lines[index + 1])) {
      const cells = (value: string) =>
        value.trim().slice(1, -1).split("|").map((cell) => cell.trim());
      const header = cells(line);
      const rows: string[][] = [];
      index += 2;
      while (index < lines.length && isTableRow(lines[index])) {
        rows.push(cells(lines[index]));
        index += 1;
      }

      blocks.push(
        <div key={blocks.length} className="my-2 overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                {header.map((cell, cellIndex) => (
                  <th key={cellIndex} className="border-b px-2 py-1 text-left font-medium">{bold(cell)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="border-b border-border/50 px-2 py-1 align-top">{bold(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    if (bullet) {
      blocks.push(
        <div key={blocks.length} className="flex gap-2">
          <span className="select-none text-muted-foreground">•</span>
          <span>{bold(bullet[1])}</span>
        </div>,
      );
      index += 1;
      continue;
    }

    blocks.push(
      <div key={blocks.length} className={line.trim() ? "" : "h-2"}>
        {bold(line)}
      </div>,
    );
    index += 1;
  }

  return <div className="space-y-0.5">{blocks}</div>;
}

const SUGGESTIONS = [
  "Which certificates are expiring in the next 30 days?",
  "How many properties do we manage?",
  "Which properties have expired gas certificates?",
  "What data is missing across our landlords?",
];

/**
 * Chat panel backed by the tool-calling assistant on the API server.
 *
 * Reads the SSE stream from data-audit/assistant, so tool progress appears
 * while the model works and the answer types out rather than arriving as one
 * block after a long silence.
 */
export default function AssistantChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;

    // History excludes the turn being sent; the server appends it itself.
    const history = messages.map(({ role, content }) => ({ role, content }));

    setMessages((current) => [...current, { role: "user", content: trimmed }, { role: "assistant", content: "", steps: [] }]);
    setQuestion("");
    setBusy(true);

    /** Rewrites the trailing assistant turn as the stream arrives. */
    const patchLast = (patch: (message: ChatMessage) => ChatMessage) =>
      setMessages((current) =>
        current.map((message, index) => (index === current.length - 1 ? patch(message) : message)),
      );

    try {
      const token = await getAccessToken();
      const response = await fetch(`${API_URL}data-audit/assistant`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ question: trimmed, history }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`The assistant is unavailable (HTTP ${response.status}).`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        // Keep the trailing partial line for the next chunk.
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine.startsWith("data:")) continue;

          let event: any;
          try {
            event = JSON.parse(trimmedLine.slice(5).trim());
          } catch {
            continue;
          }

          if (event.type === "token") {
            // The first token replaces the status line with real text.
            patchLast((message) => ({ ...message, content: message.content + event.value, status: undefined }));
          } else if (event.type === "status") {
            patchLast((message) => ({ ...message, status: event.message }));
          } else if (event.type === "tool" && event.status === "running") {
            patchLast((message) => ({
              ...message,
              status: event.detail || event.name,
              steps: [...(message.steps ?? []), event.detail || event.name],
            }));
          } else if (event.type === "error") {
            patchLast((message) => ({ ...message, content: message.content || `⚠️ ${event.message}`, status: undefined }));
          }
        }
      }

      patchLast((message) => ({
        ...message,
        content: message.content || "No answer was returned. Please try rephrasing the question.",
      }));
    } catch (error: any) {
      patchLast((message) => ({
        ...message,
        content: `⚠️ ${error?.message || "The assistant could not answer. Check that the API server is running."}`,
      }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-full flex-col rounded-lg border bg-card">
      <div className="flex items-center gap-2 border-b p-3">
        <Bot className="h-5 w-5 text-primary" />
        <div>
          <p className="font-medium leading-tight">Woodland Assistant</p>
          <p className="text-xs text-muted-foreground">Answers from your live property data</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4" style={{ minHeight: "22rem" }}>
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Ask about properties, tenants, landlords, certificates or payments.</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => send(suggestion)}
                  className="rounded-full border px-3 py-1.5 text-xs text-muted-foreground transition hover:bg-muted"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div key={index} className={`flex gap-3 ${message.role === "user" ? "justify-end" : ""}`}>
            {message.role === "assistant" && (
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Bot className="h-4 w-4 text-primary" />
              </div>
            )}

            <div className={`max-w-[80%] space-y-1.5 ${message.role === "user" ? "order-first" : ""}`}>
              {(message.steps ?? []).length > 0 && (
                <div className="space-y-1">
                  {message.steps!.map((step, stepIndex) => (
                    <p key={stepIndex} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Wrench className="h-3 w-3" />
                      {step}
                    </p>
                  ))}
                </div>
              )}

              {/* While nothing has been written yet, the bubble shows what the
                  assistant is doing so the wait is never silent. */}
              {message.role === "assistant" && !message.content ? (
                <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {message.status || (busy && index === messages.length - 1 ? "Thinking…" : "")}
                </div>
              ) : (
                <div
                  className={`rounded-lg px-3 py-2 text-sm ${
                    message.role === "user"
                      ? "whitespace-pre-wrap bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {message.role === "assistant" ? <RichText text={message.content} /> : message.content}
                </div>
              )}
            </div>

            {message.role === "user" && (
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2 border-t p-3">
        <Input
          value={question}
          placeholder="Ask about your properties…"
          disabled={busy}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              send(question);
            }
          }}
        />
        <Button onClick={() => send(question)} disabled={busy || !question.trim()}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
