"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RequireAdmin } from "@/components/admin-provider";
import { Shell } from "@/components/shell";
import { EMPTY_FORM, ProductForm, Steps } from "@/components/product-form";
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
        <Steps current={1} />
        <div className="mt-4">
          <ProductForm
            initial={EMPTY_FORM}
            categories={categories}
            submitLabel="Create & continue to media"
            backHref="/products"
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
