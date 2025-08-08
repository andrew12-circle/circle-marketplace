import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { SafeHTML } from "@/utils/htmlSanitizer";
import { supabase } from "@/integrations/supabase/client";

export type FunnelRenderMode = "safe_html" | "sandboxed_html" | "external_iframe" | "live_fetch";

interface FunnelRendererProps {
  funnelContent?: {
    customHtml?: string;
    useCustomHtml?: boolean;
    renderMode?: FunnelRenderMode;
    externalUrl?: string;
    allowSameOrigin?: boolean;
  } | null;
  serviceTitle: string;
  onClose: () => void;
}

export const FunnelRenderer = ({ funnelContent, serviceTitle, onClose }: FunnelRendererProps) => {
  const mode: FunnelRenderMode | undefined = funnelContent?.renderMode || (funnelContent?.useCustomHtml ? "sandboxed_html" : undefined);
  const [fetchedHtml, setFetchedHtml] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch live content when using live_fetch mode
  useEffect(() => {
    const fetchLive = async () => {
      if (mode !== "live_fetch" || !funnelContent?.externalUrl) return;
      setIsLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase.functions.invoke("live-content-proxy", {
          body: { url: funnelContent.externalUrl },
        });
        if (error) throw error;
        const html = (data as any)?.html || "";
        setFetchedHtml(html);
      } catch (e: any) {
        console.error("live-content-proxy error", e);
        setError(e?.message || "Failed to load content");
      } finally {
        setIsLoading(false);
      }
    };
    fetchLive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, funnelContent?.externalUrl]);

  const iframeSandbox = useMemo(() => {
    // Minimal permissive sandbox; keep parent safe
    const base = ["allow-scripts", "allow-forms", "allow-popups"];
    if (funnelContent?.allowSameOrigin && mode === "external_iframe") {
      base.push("allow-same-origin");
    }
    return base.join(" ");
  }, [funnelContent?.allowSameOrigin, mode]);

  // Render by mode
  if (!mode) return null;

  return (
    <div className="relative h-full">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 z-50 h-10 w-10 rounded-full bg-background/60 backdrop-blur hover:bg-background/80"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }}
        aria-label="Close funnel"
      >
        <X className="h-6 w-6" />
      </Button>

      {mode === "safe_html" && funnelContent?.customHtml && (
        <div className="p-0">
          <SafeHTML html={funnelContent.customHtml} className="w-full" />
        </div>
      )}

      {mode === "sandboxed_html" && funnelContent?.customHtml && (
          <iframe
            srcDoc={funnelContent.customHtml}
            className="w-full h-full border-0"
            title={`Custom Funnel - ${serviceTitle}`}
            sandbox="allow-scripts allow-forms allow-popups"
          />
      )}

      {mode === "external_iframe" && funnelContent?.externalUrl && (
          <iframe
            src={funnelContent.externalUrl}
            className="w-full h-full border-0"
            title={`External Funnel - ${serviceTitle}`}
            sandbox={iframeSandbox}
          />
      )}

      {mode === "live_fetch" && (
        <div className="w-full h-full">
          {isLoading && (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-muted-foreground">Loading live content…</span>
            </div>
          )}
          {error && (
            <div className="w-full h-full flex items-center justify-center p-6 text-center">
              <div>
                <p className="font-medium">Unable to load content</p>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
              </div>
            </div>
          )}
          {!isLoading && !error && fetchedHtml && (
            <iframe
              srcDoc={fetchedHtml}
              className="w-full h-full border-0"
              title={`Live Funnel - ${serviceTitle}`}
              sandbox="allow-scripts allow-forms allow-popups"
            />
          )}
        </div>
      )}
    </div>
  );
};
