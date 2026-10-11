"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RequireAdmin } from "@/components/admin-provider";
import { Shell } from "@/components/shell";
import { ProductForm, formFromProduct } from "@/components/product-form";
import { ImagesManager } from "@/components/product-images";
import { VariantsManager } from "@/components/product-variants";
import { api, type Category, type Product } from "@/lib/api";

export default function ManageClient({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [saved, setSaved] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const load = useCallback(async () => {
    const r = await api<{ product: Product }>(`/api/products/${id}`);
    setProduct(r.product);
  }, [id]);

  useEffect(() => {
    load().catch(() => {});
    api<{ categories: Category[] }>("/api/categories").then((r) => setCategories(r.categories)).catch(() => {});
  }, [load]);

  if (!product) {
    return (
      <RequireAdmin>
        <Shell>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-4 h-64 w-full max-w-3xl" />
        </Shell>
      </RequireAdmin>
    );
  }

  return (
    <RequireAdmin>
      <Shell>
        <div className="mb-2 text-sm text-muted-foreground">
          <Link href="/products" className="hover:underline">← Products</Link>
        </div>
        <h1 className="text-2xl font-bold">{product.name}</h1>
        <p className="text-sm text-muted-foreground">/{product.slug}</p>

        <Card className="mt-4 max-w-3xl">
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent>
            <ProductForm
              key={`${product.id}-${formKey}`}
              initial={formFromProduct(product)}
              categories={categories}
              submitLabel="Save changes"
              onSubmit={async (body) => {
                try {
                  await api(`/api/products/${product.id}`, { method: "PUT", body });
                  await load();
                  setFormKey((k) => k + 1);
                  setSaved(true);
                  setTimeout(() => setSaved(false), 2000);
                  return null;
                } catch (err) {
                  return err instanceof Error ? err.message : "Save failed";
                }
              }}
            />
            {saved && <p className="mt-2 text-sm text-emerald-700">Saved ✓</p>}
          </CardContent>
        </Card>

        <Card className="mt-4 max-w-3xl">
          <CardContent className="pt-6">
            <ImagesManager product={product} onChange={load} />
          </CardContent>
        </Card>

        <Card className="mt-4 max-w-3xl">
          <CardContent className="pt-6">
            <VariantsManager product={product} onChange={load} />
          </CardContent>
        </Card>
      </Shell>
    </RequireAdmin>
  );
}
