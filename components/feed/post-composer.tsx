"use client";

import { useState } from "react";
import { Image, BarChart3, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FilterChipsAnimated } from "@/components/ui/filter-chips";
import { uploadFile } from "@/lib/api/client";
import { useToast } from "@/components/ui/toast";

const CATEGORIES = [
  { id: "GENERAL", label: "General" },
  { id: "NEIGHBORHOOD", label: "Neighborhood" },
  { id: "SAFETY", label: "Safety" },
  { id: "EVENTS", label: "Events" },
];

export function PostComposer({ onPost }: { onPost: (body: Record<string, unknown>) => Promise<unknown> }) {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("GENERAL");
  const [mode, setMode] = useState<"text" | "poll">("text");
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadFile(file);
      setMediaUrls((prev) => [...prev, res.url]);
      toast("Media uploaded", "success");
    } catch {
      toast("Upload failed", "error");
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!content.trim() && mode === "text" && !mediaUrls.length) return;
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        content: content.trim() || (mode === "poll" ? pollQuestion : "Shared media"),
        category,
        mediaUrls: mediaUrls.length ? mediaUrls : undefined,
      };

      if (mode === "poll") {
        body.type = "POLL";
        body.pollData = {
          question: pollQuestion,
          options: pollOptions.filter(Boolean),
        };
      }

      await onPost(body);
      setContent("");
      setPollQuestion("");
      setPollOptions(["", ""]);
      setMediaUrls([]);
      setMode("text");
      toast("Post published", "success");
    } catch {
      toast("Failed to publish", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
      <Textarea
        placeholder="Share an update with your neighbors..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        className="mb-3 resize-none border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
      />

      {mode === "poll" && (
        <div className="mb-3 space-y-2 rounded-xl border border-[var(--border)] p-3">
          <input
            className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
            placeholder="Poll question"
            value={pollQuestion}
            onChange={(e) => setPollQuestion(e.target.value)}
          />
          {pollOptions.map((opt, i) => (
            <input
              key={i}
              className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
              placeholder={`Option ${i + 1}`}
              value={opt}
              onChange={(e) => {
                const next = [...pollOptions];
                next[i] = e.target.value;
                setPollOptions(next);
              }}
            />
          ))}
          {pollOptions.length < 6 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPollOptions((o) => [...o, ""])}
            >
              Add option
            </Button>
          )}
        </div>
      )}

      {mediaUrls.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {mediaUrls.map((url) => (
            <img key={url} src={url} alt="" className="h-20 w-20 rounded-lg object-cover" />
          ))}
        </div>
      )}

      <FilterChipsAnimated
        options={CATEGORIES}
        value={category}
        onChange={setCategory}
        className="mb-3"
      />

      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1">
          <label className="inline-flex cursor-pointer items-center">
            <input type="file" accept="image/*,video/*" className="hidden" onChange={handleUpload} />
            <Button variant="ghost" size="sm" type="button" disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Image className="h-4 w-4" />}
            </Button>
          </label>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMode(mode === "poll" ? "text" : "poll")}
            className={mode === "poll" ? "text-[var(--accent)]" : ""}
          >
            <BarChart3 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" disabled title="Location — Phase 4">
            <MapPin className="h-4 w-4" />
          </Button>
        </div>
        <Button size="sm" onClick={submit} disabled={submitting}>
          {submitting ? "Posting..." : "Post"}
        </Button>
      </div>
    </div>
  );
}
