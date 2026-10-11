"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, type Product } from "@/lib/api";

export function ImagesManager({ product, onChange }: { product: Product; onChange: () => Promise<void> }) {
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState(product.images ?? []);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setImages(product.images ?? []), [product]);

  const refresh = async () => {
    const fresh = await api<{ product: Product }>(`/api/products/${product.id}`);
    setImages(fresh.product.images ?? []);
    await onChange();
  };

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
        width: number;
        height: number;
      };
      if (!up.secure_url) throw new Error("Cloudinary upload failed");
      await api(`/api/products/${product.id}/images`, {
        method: "POST",
        body: { publicId: up.public_id, secureUrl: up.secure_url, width: up.width, height: up.height },
      });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const setPositions = async (ids: string[]) => {
    await Promise.all(ids.map((id, i) => api(`/api/products/${product.id}/images/${id}`, { method: "PATCH", body: { position: i } })));
    await refresh();
  };

  return (
    <div>
      <h2 className="text-sm font-semibold">Gallery ({images.length}) — extra photos, ★ = first shown</h2>
      {images.length === 0 && <p className="mt-1 text-sm text-muted-foreground">No images yet — upload the product thumbnail first.</p>}
      <div className="mt-2 flex flex-wrap gap-2">
        {images.map((img, idx) => (
          <div key={img.id} className="relative h-24 w-24 overflow-hidden rounded-md border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.secureUrl} alt="" className="h-full w-full object-cover" />
            {idx === 0 && <span className="absolute left-0 top-0 bg-emerald-600 px-1 text-xs text-white">★ cover</span>}
            <button
              onClick={async () => {
                await api(`/api/products/${product.id}/images/${img.id}`, { method: "DELETE" });
                await refresh();
              }}
              className="absolute right-0 top-0 bg-black/60 px-1 text-xs text-white"
              title="Remove (DB record only)"
            >
              ✕
            </button>
            <div className="absolute bottom-0 left-0 right-0 flex justify-between bg-black/60 px-1 text-xs text-white">
              <button onClick={() => {
                const ids = images.map((x) => x.id);
                const [m] = ids.splice(idx, 1);
                ids.splice(Math.max(0, idx - 1), 0, m);
                setPositions(ids);
              }} title="Move left">‹</button>
              <button onClick={() => setPositions([img.id, ...images.filter((x) => x.id !== img.id).map((x) => x.id)])} title="Set as cover">★</button>
              <button onClick={() => {
                const ids = images.map((x) => x.id);
                const [m] = ids.splice(idx, 1);
                ids.splice(Math.min(ids.length, idx + 1), 0, m);
                setPositions(ids);
              }} title="Move right">›</button>
            </div>
          </div>
        ))}
      </div>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      <Input
        type="file"
        accept="image/*"
        multiple
        disabled={uploading}
        className="mt-2 max-w-sm"
        onChange={async (e) => {
          const files = [...(e.target.files ?? [])];
          for (const f of files) await upload(f);
          e.target.value = "";
        }}
      />
      {uploading && <p className="mt-1 text-sm text-muted-foreground">Uploading…</p>}
    </div>
  );
}
