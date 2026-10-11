"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Category, Product } from "@/lib/api";

export interface ProductFormValues {
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

export const EMPTY_FORM: ProductFormValues = {
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

export function formFromProduct(p: Product): ProductFormValues {
  return {
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
  };
}

export function formToBody(form: ProductFormValues) {
  return {
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
}

export function ProductForm({
  initial,
  categories,
  submitLabel,
  onSubmit,
}: {
  initial: ProductFormValues;
  categories: Category[];
  submitLabel: string;
  onSubmit: (body: ReturnType<typeof formToBody>) => Promise<string | null>;
}) {
  const [form, setForm] = useState<ProductFormValues>(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (patch: Partial<ProductFormValues>) => setForm((f) => ({ ...f, ...patch }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      setError(await onSubmit(formToBody(form)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid max-w-3xl gap-3 sm:grid-cols-2">
      <div><Label>Name</Label><Input required value={form.name} onChange={(e) => set({ name: e.target.value })} /></div>
      <div><Label>SKU (optional)</Label><Input value={form.sku} onChange={(e) => set({ sku: e.target.value })} /></div>
      <div><Label>Price (৳)</Label><Input required type="number" min={0} step="0.01" value={form.priceTaka} onChange={(e) => set({ priceTaka: e.target.value })} /></div>
      <div><Label>Compare ৳ (optional)</Label><Input type="number" min={0} step="0.01" value={form.compareTaka} onChange={(e) => set({ compareTaka: e.target.value })} /></div>
      <div><Label>Stock (base, used when no variants)</Label><Input type="number" min={0} value={form.stock} onChange={(e) => set({ stock: e.target.value })} /></div>
      <div><Label>Brand (optional)</Label><Input value={form.brand} onChange={(e) => set({ brand: e.target.value })} /></div>
      <div className="sm:col-span-2"><Label>Category</Label>
        <Select value={form.categoryId || "none"} onValueChange={(v: unknown) => set({ categoryId: v === "none" ? "" : String(v) })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No category</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="sm:col-span-2"><Label>Tags (comma separated)</Label><Input value={form.tagsText} onChange={(e) => set({ tagsText: e.target.value })} /></div>
      <div className="sm:col-span-2"><Label>Description</Label><Textarea rows={3} value={form.description} onChange={(e) => set({ description: e.target.value })} /></div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={(e) => set({ isActive: e.target.checked })} /> Visible in shop</label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.featured} onChange={(e) => set({ featured: e.target.checked })} /> Featured (homepage shelf)</label>
      {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
      <div className="sm:col-span-2"><Button type="submit" disabled={busy}>{busy ? "Saving…" : submitLabel}</Button></div>
    </form>
  );
}
