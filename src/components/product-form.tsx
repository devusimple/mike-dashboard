"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Boxes,
  Check,
  DollarSign,
  Factory,
  Layers,
  Loader2,
  Package,
  Star,
  Tags,
} from "lucide-react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
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

export function Steps({ current }: { current: 1 | 2 }) {
  const steps = ["Details", "Media & variants"];
  return (
    <div className="mb-6 flex items-center gap-2 text-sm">
      {steps.map((label, i) => {
        const n = i + 1;
        const active = n === current;
        const done = n < current;
        return (
          <div key={label} className="flex items-center gap-2">
            <span
              className={`flex size-6 items-center justify-center rounded-full text-xs font-semibold ${
                active ? "bg-primary text-primary-foreground" : done ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"
              }`}
            >
              {n}
            </span>
            <span className={active ? "font-medium" : "text-muted-foreground"}>{label}</span>
            {n < steps.length && <span className="mx-1 h-px w-8 bg-border" />}
          </div>
        );
      })}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function ProductForm({
  initial,
  categories,
  submitLabel,
  backHref,
  onSubmit,
}: {
  initial: ProductFormValues;
  categories: Category[];
  submitLabel: string;
  backHref?: string;
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
    <form onSubmit={submit}>
      <div className="mb-4 flex items-center gap-3">
        {backHref && (
          <Link href={backHref} aria-label="Back" className={buttonVariants({ variant: "ghost", size: "icon" })}>
            <ArrowLeft className="size-4" />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-bold">{form.name || "New product"}</h1>
          <p className="text-sm text-muted-foreground">Fill in the details, then continue to media and variants.</p>
        </div>
        <Button type="submit" disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
          {busy ? "Saving…" : submitLabel}
        </Button>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="size-4 text-muted-foreground" /> Basic info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Product name">
                <Input required placeholder="e.g. Classic Black Tee" value={form.name} onChange={(e) => set({ name: e.target.value })} />
              </Field>
              <Field label="Description">
                <Textarea rows={4} placeholder="Fabric, fit, care instructions…" value={form.description} onChange={(e) => set({ description: e.target.value })} />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <DollarSign className="size-4 text-muted-foreground" /> Pricing & inventory
              </CardTitle>
              <CardDescription>Variant prices override the base price; variant stock replaces base stock when options exist.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <Field label="Price (৳)">
                <Input required type="number" min={0} step="0.01" value={form.priceTaka} onChange={(e) => set({ priceTaka: e.target.value })} />
              </Field>
              <Field label="Compare price (৳)" hint="Strikethrough MRP">
                <Input type="number" min={0} step="0.01" value={form.compareTaka} onChange={(e) => set({ compareTaka: e.target.value })} />
              </Field>
              <Field label="Base stock" hint="Used only when no variants">
                <Input type="number" min={0} value={form.stock} onChange={(e) => set({ stock: e.target.value })} />
              </Field>
              <div className="sm:col-span-3">
                <Field label="SKU (optional)" hint="Unique code for your records">
                  <Input value={form.sku} onChange={(e) => set({ sku: e.target.value })} />
                </Field>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Boxes className="size-4 text-muted-foreground" /> Visibility
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm">Visible in shop</span>
                <Switch checked={form.isActive} onCheckedChange={(v) => set({ isActive: v })} />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-sm">
                  <Star className="size-3.5 text-amber-500" /> Featured shelf
                </span>
                <Switch checked={form.featured} onCheckedChange={(v) => set({ featured: v })} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Layers className="size-4 text-muted-foreground" /> Organization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Category">
                <Select value={form.categoryId || "none"} onValueChange={(v: unknown) => set({ categoryId: v === "none" ? "" : String(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No category</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Brand">
                <div className="relative">
                  <Factory className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                  <Input className="pl-8" placeholder="e.g. Aarong" value={form.brand} onChange={(e) => set({ brand: e.target.value })} />
                </div>
              </Field>
              <Field label="Tags" hint="Comma separated — powers shop filters">
                <div className="relative">
                  <Tags className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                  <Input className="pl-8" placeholder="cotton, summer" value={form.tagsText} onChange={(e) => set({ tagsText: e.target.value })} />
                </div>
              </Field>
            </CardContent>
          </Card>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
    </form>
  );
}
