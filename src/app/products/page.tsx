"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RequireAdmin } from "@/components/admin-provider";
import { Shell } from "@/components/shell";
import { api, type Product } from "@/lib/api";
import { taka } from "@/lib/format";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);

  const load = () => api<{ products: Product[] }>("/api/products?all=1&limit=100").then((r) => setProducts(r.products));
  useEffect(() => {
    load().catch(() => {});
  }, []);

  const remove = async (p: Product) => {
    if (!confirm(`Delete "${p.name}" plus its images, variants, and reviews? Order history is kept.`)) return;
    await api(`/api/products/${p.id}`, { method: "DELETE" });
    await load();
  };

  return (
    <RequireAdmin>
      <Shell>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Products ({products.length})</h1>
          <Link href="/products/new" className={buttonVariants()}>New product</Link>
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
                      <Link href={`/products/${p.id}`} className="font-medium hover:underline">
                        {p.name}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        {[p.brand, p.variants?.length ? `${p.variants.length} variants` : null, `${p.images?.length ?? 0} images`, `★ ${p.ratingAvg.toFixed(1)} (${p.ratingCount})`]
                          .filter(Boolean)
                          .join(" · ")}
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
                      <Link href={`/products/${p.id}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                        Manage
                      </Link>
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
      </Shell>
    </RequireAdmin>
  );
}
