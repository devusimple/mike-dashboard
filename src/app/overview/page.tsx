"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RequireAdmin } from "@/components/admin-provider";
import { Shell } from "@/components/shell";
import { api, type Order, type Product } from "@/lib/api";
import { taka } from "@/lib/format";

export default function OverviewPage() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    api<{ products: Product[] }>("/api/products?all=1&limit=100")
      .then((r) => setProducts(r.products))
      .catch(() => setProducts([]));
    api<{ orders: Order[] }>("/api/orders?all=1&limit=100")
      .then((r) => setOrders(r.orders))
      .catch(() => setOrders([]));
  }, []);

  const pending = (orders ?? []).filter((o) => o.status === "pending");
  const revenue = (orders ?? [])
    .filter((o) => o.status !== "cancelled")
    .reduce((n, o) => n + o.totalCents, 0);
  const lowStock = (products ?? []).filter((p) => p.isActive && p.stock < 5 && (p.variants?.length ?? 0) === 0);

  return (
    <RequireAdmin>
      <Shell>
        <h1 className="text-2xl font-bold">Overview</h1>
        <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="Products" value={products?.length} to="/products" />
          <Stat label="Pending orders" value={pending.length} to="/orders" />
          <Stat label="Total orders" value={orders?.length} to="/orders" />
          <Stat label="Revenue (excl. cancelled)" value={revenue != null ? taka(revenue) : undefined} />
        </div>
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Low stock (no variants, under 5)</CardTitle>
          </CardHeader>
          <CardContent>
            {products === null ? (
              <Skeleton className="h-8 w-full" />
            ) : lowStock.length === 0 ? (
              <p className="text-sm text-muted-foreground">All good.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {lowStock.map((p) => (
                  <li key={p.id}>
                    <Link href="/products" className="hover:underline">
                      {p.name}
                    </Link>{" "}
                    — {p.stock} left
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </Shell>
    </RequireAdmin>
  );
}

function Stat({ label, value, to }: { label: string; value: number | string | undefined; to?: string }) {
  const inner = (
    <>
      <div className="text-2xl font-bold">{value ?? "…"}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </>
  );
  return (
    <Card>
      <CardContent className="pt-6">
        {to ? <Link href={to}>{inner}</Link> : inner}
      </CardContent>
    </Card>
  );
}
