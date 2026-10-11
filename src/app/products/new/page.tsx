"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RequireAdmin } from "@/components/admin-provider";
import { Shell } from "@/components/shell";
import { EMPTY_FORM, ProductForm } from "@/components/product-form";
import { api, type Category } from "@/lib/api";

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    api<{ categories: Category[] }>("/api/categories").then((r) => setCategories(r.categories)).catch(() => {});
  }, []);

  return (
    <RequireAdmin>
      <Shell>
        <div className="mb-4 text-sm text-muted-foreground">
          <Link href="/products" className="hover:underline">← Products</Link>
        </div>
        <h1 className="text-2xl font-bold">New product</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create the basics first — gallery and variants unlock on the manage page.
        </p>
        <div className="mt-4">
          <ProductForm
            initial={EMPTY_FORM}
            categories={categories}
            submitLabel="Create product"
            onSubmit={async (body) => {
              try {
                const r = await api<{ product: { id: string } }>("/api/products", { method: "POST", body });
                router.push(`/products/${r.product.id}`);
                return null;
              } catch (err) {
                return err instanceof Error ? err.message : "Create failed";
              }
            }}
          />
        </div>
      </Shell>
    </RequireAdmin>
  );
}
