"use client";

import { useEffect, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, type Product } from "@/lib/api";

/** Dedicated cover: card + gallery-main image, uploaded separately from the gallery. */
export function ThumbnailManager({ product, onChange }: { product: Product; onChange: () => Promise<void> }) {
  const [uploading, setUploading] = useState(false);
  const [thumb, setThumb] = useState<string | null>(product.thumbnailSecureUrl ?? null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setThumb(product.thumbnailSecureUrl ?? null), [product]);

  const upload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const sig = await api<{ uploadUrl: string; apiKey: string; timestamp: number; folder: string; signature: string }>(
        "/api/uploads/signature",
        { method: "POST", body: {} },
      );
      const form = new FormData();
      form.append("file", file);
      form.append("api_key", sig.apiKey);
      form.append("timestamp", String(sig.timestamp));
      form.append("folder", sig.folder);
      form.append("signature", sig.signature);
      const up = (await (await fetch(sig.uploadUrl, { method: "POST", body: form })).json()) as {
        public_id: string;
        secure_url: string;
      };
      if (!up.secure_url) throw new Error("Cloudinary upload failed");
      await api(`/api/products/${product.id}/thumbnail`, {
        method: "POST",
        body: { publicId: up.public_id, secureUrl: up.secure_url },
      });
      await onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Thumbnail upload failed");
    } finally {
      setUploading(false);
    }
  };

  const remove = async () => {
    await api(`/api/products/${product.id}/thumbnail`, { method: "DELETE" });
    await onChange();
  };

  return (
    <div>
      <h2 className="text-sm font-semibold">Thumbnail (cover)</h2>
      <p className="text-xs text-muted-foreground">Shown on cards and as the gallery default. Falls back to the first gallery image when empty.</p>
      <div className="mt-2 flex items-center gap-3">
        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-md border bg-muted">
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumb} alt="Thumbnail" className="h-full w-full object-cover" />
          ) : (
            <span className="px-2 text-center text-xs text-muted-foreground">No thumbnail</span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-primary hover:underline">
            <ImagePlus className="size-4" />
            {uploading ? "Uploading…" : thumb ? "Replace" : "Upload"}
            <Input
              type="file"
              accept="image/*"
              disabled={uploading}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) upload(f);
                e.target.value = "";
              }}
            />
          </label>
          {thumb && (
            <Button variant="ghost" size="sm" className="h-auto justify-start p-0 text-destructive" onClick={remove}>
              <Trash2 className="size-3.5" /> Remove
            </Button>
          )}
        </div>
      </div>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
