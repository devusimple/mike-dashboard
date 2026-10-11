"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, type Product, type ProductVariant } from "@/lib/api";

export function VariantsManager({ product, onChange }: { product: Product; onChange: () => Promise<void> }) {
  const [variants, setVariants] = useState<ProductVariant[]>(product.variants ?? []);
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [sku, setSku] = useState("");
  const [priceTaka, setPriceTaka] = useState("");
  const [stock, setStock] = useState("0");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setVariants(product.variants ?? []), [product]);

  const refresh = async () => {
    const fresh = await api<{ product: Product }>(`/api/products/${product.id}`);
    setVariants(fresh.product.variants ?? []);
    await onChange();
  };

  const add = async () => {
    if (!name.trim()) return;
    setError(null);
    try {
      await api(`/api/products/${product.id}/variants`, {
        method: "POST",
        body: {
          name: name.trim(),
          value: value.trim() || undefined,
          sku: sku || undefined,
          priceCents: priceTaka ? Math.round(Number(priceTaka) * 100) : null,
          stock: Number(stock) || 0,
        },
      });
      setName("");
      setValue("");
      setSku("");
      setPriceTaka("");
      setStock("0");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Variant create failed");
    }
  };

  const save = async (v: ProductVariant, patch: Record<string, unknown>) => {
    setError(null);
    try {
      await api(`/api/products/${product.id}/variants/${v.id}`, { method: "PUT", body: patch });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Variant save failed");
    }
  };

  return (
    <div>
      <h2 className="text-sm font-semibold">Options / variants ({variants.length})</h2>
      <p className="text-xs text-muted-foreground">
        Empty price inherits the base price. When variants exist, shoppers must pick one and stock is per-variant.
      </p>
      <div className="mt-2 space-y-1">
        {variants.map((v) => (
          <VariantRow key={v.id} variant={v} onSave={(patch) => save(v, patch)} onDelete={async () => {
            if (!confirm(`Delete variant "${v.name}"? Its cart lines are removed; order history is kept.`)) return;
            await api(`/api/products/${product.id}/variants/${v.id}`, { method: "DELETE" });
            await refresh();
          }} />
        ))}
        {variants.length === 0 && (
          <p className="text-sm text-muted-foreground">No variants — the base price and stock apply to all orders.</p>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Input placeholder="Option (e.g. Size)" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="Value (e.g. L)" value={value} onChange={(e) => setValue(e.target.value)} />
        <Input placeholder="SKU" value={sku} onChange={(e) => setSku(e.target.value)} />
        <Input type="number" min={0} step="0.01" placeholder="Price ৳ (empty = base)" value={priceTaka} onChange={(e) => setPriceTaka(e.target.value)} />
        <Input type="number" min={0} placeholder="Stock" value={stock} onChange={(e) => setStock(e.target.value)} />
        <Button onClick={add}>Add option</Button>
      </div>
    </div>
  );
}

function VariantRow({
  variant,
  onSave,
  onDelete,
}: {
  variant: ProductVariant;
  onSave: (patch: Record<string, unknown>) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [name, setName] = useState(variant.name);
  const [value, setValue] = useState(variant.value ?? "");
  const [priceTaka, setPriceTaka] = useState(variant.priceCents != null ? String(variant.priceCents / 100) : "");
  const [stock, setStock] = useState(String(variant.stock));
  const dirty =
    name !== variant.name ||
    (value.trim() || null) !== variant.value ||
    (priceTaka === "" ? null : Math.round(Number(priceTaka) * 100)) !== variant.priceCents ||
    Number(stock) !== variant.stock;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md bg-muted/60 p-2 text-sm">
      <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8 w-28" title="Option name" />
      <Input value={value} onChange={(e) => setValue(e.target.value)} className="h-8 w-20" title="Value" placeholder="Value" />
      <Input
        value={priceTaka}
        onChange={(e) => setPriceTaka(e.target.value)}
        placeholder="৳ base"
        type="number"
        min={0}
        step="0.01"
        className="h-8 w-28"
        title="Price override"
      />
      <Input value={stock} onChange={(e) => setStock(e.target.value)} type="number" min={0} className="h-8 w-20" title="Stock" />
      <span className="text-xs text-muted-foreground">{variant.sku ?? "no sku"}</span>
      <button
        onClick={() => onSave({ isActive: !variant.isActive })}
        className={variant.isActive ? "text-muted-foreground hover:underline" : "text-amber-700 hover:underline"}
      >
        {variant.isActive ? "active" : "hidden"}
      </button>
      {dirty && (
        <Button
          size="sm"
          onClick={() =>
            onSave({
              name,
              value: value.trim() || null,
              priceCents: priceTaka === "" ? null : Math.round(Number(priceTaka) * 100),
              stock: Number(stock) || 0,
            })
          }
        >
          Save
        </Button>
      )}
      <Button variant="ghost" size="sm" className="text-destructive" onClick={onDelete}>
        Delete
      </Button>
    </div>
  );
}
