import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, Loader2 } from "lucide-react";

interface QualityOption {
  quality: string; // e.g., "1080p"
  url: string;     // direct m3u8 variant URL
}

interface DownloadButtonProps {
  tmdbID: string;
  title: string;
  source?: "vidsrc" | "vidlink";
  apiBase?: string;
}

export function DownloadButton({
  tmdbID,
  title,
  source = "vidsrc",
  apiBase = import.meta.env.VITE_API_BASE || "",
}: DownloadButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [qualities, setQualities] = useState<QualityOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  const normalizedId = tmdbID?.startsWith("tt") ? tmdbID.slice(2) : tmdbID;

  const fetchQualities = useCallback(async () => {
    if (!normalizedId) return;
    setLoading(true);
    setError(null);
    try {
      const url = `${apiBase}/api/video-links?source=${source}&id=${encodeURIComponent(
        normalizedId
      )}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Bad response: ${res.status}`);
      const data = (await res.json()) as QualityOption[];
      if (!Array.isArray(data) || data.length === 0) {
        setError("No quality streams found.");
        setQualities([]);
      } else {
        setQualities(data);
      }
    } catch (err) {
      console.error("DownloadButton fetchQualities error:", err);
      setError("Failed to load qualities.");
    } finally {
      setLoading(false);
    }
  }, [apiBase, normalizedId, source]);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && !fetchedRef.current) {
      fetchedRef.current = true;
      fetchQualities();
    }
  };

  const handleDownload = async (m3u8Url: string, quality: string) => {
    try {
      const safeName = `${title}-${quality}`.replace(/[^\w\-]+/g, "_");
      window.open(
        `${apiBase}/api/download?url=${encodeURIComponent(
          m3u8Url
        )}&filename=${encodeURIComponent(safeName + ".mp4")}`,
        "_blank"
      );
    } catch (err) {
      console.error("Download error:", err);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2"
          disabled={!normalizedId}
          title={normalizedId ? "Download" : "Missing ID"}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Download
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {error && (
          <DropdownMenuItem disabled className="text-red-500">
            {error}
          </DropdownMenuItem>
        )}

        {!error && !loading && qualities.length === 0 && (
          <DropdownMenuItem disabled>No options.</DropdownMenuItem>
        )}

        {!error &&
          !loading &&
          qualities.map((q) => (
            <DropdownMenuItem
              key={q.quality}
              onClick={() => handleDownload(q.url, q.quality)}
            >
              {q.quality}
            </DropdownMenuItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
