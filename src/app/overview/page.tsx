"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { RequireAdmin } from "@/components/admin-provider";
import { Shell } from "@/components/shell";
import { StatusBadge } from "../orders/page";
import { api, type Order, type Product } from "@/lib/api";
import { taka } from "@/lib/format";

const DAYS = 14;

const revenueConfig = {
  revenue: { label: "Revenue (৳)", color: "var(--chart-1)" },
  orders: { label: "Orders", color: "var(--chart-2)" },
} satisfies ChartConfig;

const STATUS_COLORS: Record<Order["status"], string> = {
  pending: "var(--chart-4)",
  paid: "var(--chart-1)",
  shipped: "var(--chart-2)",
  delivered: "var(--chart-2)",
  cancelled: "var(--chart-5)",
};

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export default function OverviewPage() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [orders, setOrders] = useState<Order[] | null>(null);
  // Prerender-safe "today": computed on the client after mount.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => setNow(Date.now()), []);

  useEffect(() => {
    api<{ products: Product[] }>("/api/products?all=1&limit=100")
      .then((r) => setProducts(r.products))
      .catch(() => setProducts([]));
    api<{ orders: Order[] }>("/api/orders?all=1&limit=100")
      .then((r) => setOrders(r.orders))
      .catch(() => setOrders([]));
  }, []);

  const valid = useMemo(() => (orders ?? []).filter((o) => o.status !== "cancelled"), [orders]);
  const revenue = useMemo(() => valid.reduce((n, o) => n + o.totalCents, 0), [valid]);
  const pending = useMemo(() => (orders ?? []).filter((o) => o.status === "pending").length, [orders]);
  const avg = valid.length ? Math.round(revenue / valid.length) : 0;

  const series = useMemo(() => {
    const buckets = new Map<string, { label: string; revenue: number; orders: number }>();
    if (now === null) return [];
    const today = new Date(now);
    for (let i = DAYS - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      buckets.set(dayKey(d), {
        label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        revenue: 0,
        orders: 0,
      });
    }
    for (const o of valid) {
      const b = buckets.get(dayKey(new Date(o.createdAt)));
      if (b) {
        b.revenue += o.totalCents / 100;
        b.orders += 1;
      }
    }
    return [...buckets.values()];
  }, [valid, now]);

  const byStatus = useMemo(() => {
    const counts = new Map<Order["status"], number>();
    for (const o of orders ?? []) counts.set(o.status, (counts.get(o.status) ?? 0) + 1);
    return (["pending", "paid", "shipped", "cancelled"] as const)
      .map((s) => ({ status: s, count: counts.get(s) ?? 0, fill: STATUS_COLORS[s] }))
      .filter((x) => x.count > 0);
  }, [orders]);

  const recent = useMemo(
    () =>
      [...(orders ?? [])]
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
        .slice(0, 5),
    [orders],
  );

  const lowStock = (products ?? []).filter((p) => p.isActive && p.stock < 5 && (p.variants?.length ?? 0) === 0);
  const loaded = products !== null && orders !== null && now !== null;

  return (
    <RequireAdmin>
      <Shell>
        <h1 className="text-2xl font-bold">Overview</h1>

        <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Kpi label="Revenue (excl. cancelled)" value={loaded ? taka(revenue) : undefined} />
          <Kpi label="Orders" value={loaded ? String(orders?.length ?? 0) : undefined} to="/orders" />
          <Kpi label="Pending" value={loaded ? String(pending) : undefined} to="/orders" />
          <Kpi label="Avg order" value={loaded ? taka(avg) : undefined} />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Revenue — last {DAYS} days</CardTitle>
            </CardHeader>
            <CardContent>
              {!loaded ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <ChartContainer config={revenueConfig} className="h-64 w-full">
                  <BarChart data={series} margin={{ left: -12 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
                    <YAxis tickLine={false} axisLine={false} tickFormatter={(v: number) => `৳${v}`} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Orders by status</CardTitle>
            </CardHeader>
            <CardContent>
              {!loaded ? (
                <Skeleton className="h-64 w-full" />
              ) : byStatus.length === 0 ? (
                <p className="text-sm text-muted-foreground">No orders yet.</p>
              ) : (
                <>
                  <ChartContainer config={{}} className="mx-auto h-48 w-full max-w-64">
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent nameKey="status" hideLabel />} />
                      <Pie data={byStatus} dataKey="count" nameKey="status" innerRadius={52} outerRadius={80} strokeWidth={2}>
                        {byStatus.map((x) => (
                          <Cell key={x.status} fill={x.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                  <ul className="mt-2 space-y-1 text-sm">
                    {byStatus.map((x) => (
                      <li key={x.status} className="flex items-center gap-2">
                        <span className="size-2.5 rounded-full" style={{ background: x.fill }} />
                        <span className="capitalize">{x.status}</span>
                        <span className="ml-auto font-medium">{x.count}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent orders</CardTitle>
            </CardHeader>
            <CardContent>
              {!loaded ? (
                <Skeleton className="h-24 w-full" />
              ) : recent.length === 0 ? (
                <p className="text-sm text-muted-foreground">No orders yet.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {recent.map((o) => (
                    <li key={o.id} className="flex items-center gap-2">
                      <Link href="/orders" className="font-medium hover:underline">
                        #{o.id.slice(0, 8)}
                      </Link>
                      <StatusBadge status={o.status} />
                      <span className="ml-auto font-semibold">{taka(o.totalCents)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Low stock (under 5, no variants)</CardTitle>
            </CardHeader>
            <CardContent>
              {!loaded ? (
                <Skeleton className="h-24 w-full" />
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
        </div>
      </Shell>
    </RequireAdmin>
  );
}

function Kpi({ label, value, to }: { label: string; value: string | undefined; to?: string }) {
  const inner = (
    <>
      <div className="text-2xl font-bold">{value ?? "…"}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </>
  );
  return (
    <Card>
      <CardContent className="pt-6">{to ? <Link href={to}>{inner}</Link> : inner}</CardContent>
    </Card>
  );
}
