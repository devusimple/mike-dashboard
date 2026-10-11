"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { RequireAdmin } from "@/components/admin-provider";
import { Shell } from "@/components/shell";
import { api, type Category, type Product, type ProductVariant } from "@/lib/api";
import { taka } from "@/lib/format";

interface Form {
  name: string;
  description: string;
  priceTaka: string;
  compareTaka: string;
  sku: string;
  stock: string;
  categoryId: string;
  isActive: boolean;
  brand: string;
  featured: boolean;
  tagsText: string;
}

const EMPTY: Form = {
  name: "",
  description: "",
  priceTaka: "",
  compareTaka: "",
  sku: "",
  stock: "0",
  categoryId: "",
  isActive: true,
  brand: "",
  featured: false,
  tagsText: "",
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const r = await api<{ products: Product[] }>("/api/products?all=1&limit=100");
    setProducts(r.products);
  };
  useEffect(() => {
    load().catch(() => {});
    api<{ categories: Category[] }>("/api/categories").then((r) => setCategories(r.categories)).catch(() => {});
  }, []);

  const startCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setError(null);
    setOpen(true);
  };
  const startEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description,
      priceTaka: String(p.priceCents / 100),
      compareTaka: p.comparePriceCents ? String(p.comparePriceCents / 100) : "",
      sku: p.sku ?? "",
      stock: String(p.stock),
      categoryId: p.categoryId ?? "",
      isActive: p.isActive,
      brand: p.brand ?? "",
      featured: p.featured,
      tagsText: (p.tags ?? []).map((t) => t.name).join(", "),
    });
    setError(null);
    setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const body = {
      name: form.name,
      description: form.description,
      priceCents: Math.round(Number(form.priceTaka) * 100),
      comparePriceCents: form.compareTaka ? Math.round(Number(form.compareTaka) * 100) : undefined,
      sku: form.sku || undefined,
      stock: Number(form.stock) || 0,
      categoryId: form.categoryId || undefined,
      isActive: form.isActive,
      brand: form.brand || undefined,
      featured: form.featured,
      tags: form.tagsText.split(",").map((t) => t.trim()).filter(Boolean),
    };
    try {
      if (editing) {
        await api(`/api/products/${editing.id}`, { method: "PUT", body });
      } else {
        await api("/api/products", { method: "POST", body });
      }
      setOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  };

  const remove = async (p: Product) => {
    if (!confirm(`Delete "${p.name}" and its images, variants, reviews?`)) return;
    await api(`/api/products/${p.id}`, { method: "DELETE" });
    await load();
  };

  return (
    <RequireAdmin>
      <Shell>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Products ({products.length})</h1>
          <Button onClick={startCreate}>New product</Button>
        </div>
        <Card className="mt-4">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {p.brand ? `${p.brand} · ` : ""}
                        {p.variants?.length ? `${p.variants.length} variants · ` : ""}
                        ★ {p.ratingAvg.toFixed(1)} ({p.ratingCount})
                      </div>
                    </TableCell>
                    <TableCell>{taka(p.priceCents)}</TableCell>
                    <TableCell>{p.stock}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {!p.isActive && <Badge variant="secondary">hidden</Badge>}
                        {p.featured && <Badge>featured</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => startEdit(p)}>
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => remove(p)}>
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit product" : "New product"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-1"><Label>Name</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>SKU</Label><Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></div>
              <div><Label>Price (৳)</Label><Input required type="number" min={0} step="0.01" value={form.priceTaka} onChange={(e) => setForm({ ...form, priceTaka: e.target.value })} /></div>
              <div><Label>Compare ৳</Label><Input type="number" min={0} step="0.01" value={form.compareTaka} onChange={(e) => setForm({ ...form, compareTaka: e.target.value })} /></div>
              <div><Label>Stock</Label><Input type="number" min={0} value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div>
              <div><Label>Brand</Label><Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} /></div>
              <div className="sm:col-span-2"><Label>Category</Label>
                <Select value={form.categoryId || "none"} onValueChange={(v: unknown) => setForm({ ...form, categoryId: v === "none" ? "" : String(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No category</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2"><Label>Tags (comma separated)</Label><Input value={form.tagsText} onChange={(e) => setForm({ ...form, tagsText: e.target.value })} /></div>
              <div className="sm:col-span-2"><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Visible</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> Featured</label>
              {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
              <div className="sm:col-span-2"><Button type="submit">{editing ? "Save changes" : "Create"}</Button></div>
            </form>
            {editing && (
              <>
                <ImagesManager product={editing} onChange={load} />
                <VariantsManager product={editing} onChange={load} />
              </>
            )}
          </DialogContent>
        </Dialog>
      </Shell>
    </RequireAdmin>
  );
}

function ImagesManager({ product, onChange }: { product: Product; onChange: () => Promise<void> }) {
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState(product.images ?? []);

  useEffect(() => setImages(product.images ?? []), [product]);

  const refresh = async () => {
    const fresh = await api<{ product: Product }>(`/api/products/${product.id}`);
    setImages(fresh.product.images ?? []);
    await onChange();
  };

  const upload = async (file: File) => {
    setUploading(true);
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
      await api(`/api/products/${product.id}/images`, {
        method: "POST",
        body: { publicId: up.public_id, secureUrl: up.secure_url, width: up.width, height: up.height },
      });
      await refresh();
    } finally {
      setUploading(false);
    }
  };

  const setPosition = async (ids: string[]) => {
    await Promise.all(ids.map((id, i) => api(`/api/products/${product.id}/images/${id}`, { method: "PATCH", body: { position: i } })));
    await refresh();
  };

  return (
    <div className="border-t pt-3">
      <div className="text-sm font-semibold">Images — first is cover</div>
      <div className="mt-2 flex flex-wrap gap-2">
        {images.map((img, idx) => (
          <div key={img.id} className="relative h-20 w-20 overflow-hidden rounded-md border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.secureUrl} alt="" className="h-full w-full object-cover" />
            {idx === 0 && <span className="absolute left-0 top-0 bg-emerald-600 px-1 text-xs text-white">★</span>}
            <div className="absolute bottom-0 flex w-full justify-between bg-black/60 px-1 text-xs text-white">
              <button onClick={() => {
                const ids = images.map((x) => x.id);
                const [m] = ids.splice(idx, 1);
                ids.splice(Math.max(0, idx - 1), 0, m);
                setPosition(ids);
              }}>‹</button>
              <button onClick={() => {
                const ids = images.filter((x) => x.id !== img.id).map((x) => x.id);
                setPosition([img.id, ...ids]);
              }}>★</button>
              <button onClick={() => {
                const ids = images.map((x) => x.id);
                const [m] = ids.splice(idx, 1);
                ids.splice(Math.min(ids.length, idx + 1), 0, m);
                setPosition(ids);
              }}>›</button>
              <button
                onClick={async () => {
                  await api(`/api/products/${product.id}/images/${img.id}`, { method: "DELETE" });
                  await refresh();
                }}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
      <Input
        type="file"
        accept="image/*"
        disabled={uploading}
        className="mt-2"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function VariantsManager({ product, onChange }: { product: Product; onChange: () => Promise<void> }) {
  const [variants, setVariants] = useState<ProductVariant[]>(product.variants ?? []);
  const [name, setName] = useState("");
  const [stock, setStock] = useState("0");

  useEffect(() => setVariants(product.variants ?? []), [product]);

  const refresh = async () => {
    const fresh = await api<{ product: Product }>(`/api/products/${product.id}`);
    setVariants(fresh.product.variants ?? []);
    await onChange();
  };

  const add = async () => {
    if (!name.trim()) return;
    await api(`/api/products/${product.id}/variants`, {
      method: "POST",
      body: { name: name.trim(), stock: Number(stock) || 0 },
    });
    setName("");
    setStock("0");
    await refresh();
  };

  return (
    <div className="border-t pt-3">
      <div className="text-sm font-semibold">Variants ({variants.length})</div>
      <div className="mt-2 space-y-1">
        {variants.map((v) => (
          <div key={v.id} className="flex items-center gap-2 rounded-md bg-muted/60 p-2 text-sm">
            <span className="font-medium">{v.name}</span>
            <span className="text-muted-foreground">{v.sku ?? "no sku"}</span>
            <Input
              type="number"
              min={0}
              value={v.stock}
              className="ml-auto h-8 w-20"
              onChange={async (e) => {
                await api(`/api/products/${product.id}/variants/${v.id}`, {
                  method: "PUT",
                  body: { stock: Number(e.target.value) || 0 },
                });
                await refresh();
              }}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await api(`/api/products/${product.id}/variants/${v.id}`, {
                  method: "PUT",
                  body: { isActive: !v.isActive },
                });
                await refresh();
              }}
            >
              {v.isActive ? "active" : "hidden"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={async () => {
                if (!confirm(`Delete variant "${v.name}"?`)) return;
                await api(`/api/products/${product.id}/variants/${v.id}`, { method: "DELETE" });
                await refresh();
              }}
            >
              Delete
            </Button>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <Input placeholder="Name (e.g. Black / L)" value={name} onChange={(e) => setName(e.target.value)} />
        <Input type="number" min={0} placeholder="Stock" value={stock} onChange={(e) => setStock(e.target.value)} className="w-24" />
        <Button onClick={add}>Add</Button>
      </div>
    </div>
  );
}
