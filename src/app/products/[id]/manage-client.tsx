"use client";

import { use, useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RequireAdmin } from "@/components/admin-provider";
import { Shell } from "@/components/shell";
import { ProductForm, Steps, formFromProduct } from "@/components/product-form";
import { ImagesManager } from "@/components/product-images";
import { ThumbnailManager } from "@/components/product-thumbnail";
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
        <Steps current={2} />
        <div className="mt-4">
          <ProductForm
            key={`${product.id}-${formKey}`}
            initial={formFromProduct(product)}
            categories={categories}
            submitLabel="Save changes"
            backHref="/products"
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
        </div>

        <Card className="mt-4 max-w-3xl">
          <CardContent className="pt-6">
            <ThumbnailManager product={product} onChange={load} />
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
