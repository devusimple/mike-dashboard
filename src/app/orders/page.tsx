"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RequireAdmin } from "@/components/admin-provider";
import { Shell } from "@/components/shell";
import { api, type Order, type OrderEvent, type OrderItem } from "@/lib/api";
import { taka } from "@/lib/format";

const STATUSES = ["all", "pending", "paid", "shipped", "delivered", "cancelled"] as const;
const SETTABLE = ["pending", "paid", "shipped", "delivered", "cancelled"] as const;

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<(typeof STATUSES)[number]>("pending");
  const [detail, setDetail] = useState<{ order: Order; items: OrderItem[]; events: OrderEvent[] } | null>(null);
  const [carrier, setCarrier] = useState("");
  const [tracking, setTracking] = useState("");
  const [note, setNote] = useState("");

  const load = () => api<{ orders: Order[] }>("/api/orders?all=1&limit=100").then((r) => setOrders(r.orders));
  useEffect(() => {
    load().catch(() => {});
  }, []);

  const setStatus = async (id: string, status: Order["status"]) => {
    await api(`/api/orders/${id}/status`, { method: "PATCH", body: { status } });
    await load();
    if (detail && detail.order.id === id) {
      const fresh = await api<{ order: Order; items: OrderItem[]; events: OrderEvent[] }>(`/api/orders/${id}`);
      setDetail(fresh);
    }
  };

  const open = async (id: string) => {
    const fresh = await api<{ order: Order; items: OrderItem[]; events: OrderEvent[] }>(`/api/orders/${id}`);
    setDetail(fresh);
    setCarrier(fresh.order.carrier ?? "");
    setTracking(fresh.order.trackingNumber ?? "");
    setNote("");
  };

  const saveTracking = async () => {
    if (!detail) return;
    await api(`/api/orders/${detail.order.id}/status`, {
      method: "PATCH",
      body: {
        status: detail.order.status,
        carrier: carrier || undefined,
        trackingNumber: tracking || undefined,
        note: note || undefined,
      },
    });
    await load();
    await open(detail.order.id);
  };

  const shown = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <RequireAdmin>
      <Shell>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Orders ({shown.length})</h1>
          <Select value={filter} onValueChange={(v: unknown) => setFilter(String(v) as typeof filter)}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Card className="mt-4">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Set status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shown.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>
                      <button className="font-medium hover:underline" onClick={() => open(o.id)}>
                        {o.id.slice(0, 8)}
                      </button>
                      <div className="text-xs text-muted-foreground">
                        {[o.couponCode, o.shippingZone].filter(Boolean).join(" · ") || "—"}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{new Date(o.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="font-semibold">{taka(o.totalCents)}</TableCell>
                    <TableCell><StatusBadge status={o.status} /></TableCell>
                    <TableCell className="text-right">
                      <Select value={o.status} onValueChange={(v: unknown) => setStatus(o.id, String(v) as Order["status"])}>
                        <SelectTrigger className="ml-auto w-32"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {SETTABLE.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Order {detail?.order.id.slice(0, 8)}</DialogTitle>
            </DialogHeader>
            {detail && (
              <div className="space-y-1 text-sm">
                {detail.items.map((i) => (
                  <div key={i.id} className="flex justify-between">
                    <span>{i.productName}{i.variantName ? ` (${i.variantName})` : ""} × {i.qty}</span>
                    <span>{taka(i.unitPriceCents * i.qty)}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t pt-2"><span>Subtotal</span><span>{taka(detail.order.subtotalCents)}</span></div>
                {detail.order.discountCents > 0 && (
                  <div className="flex justify-between text-emerald-700"><span>Discount</span><span>−{taka(detail.order.discountCents)}</span></div>
                )}
                {detail.order.shippingCents > 0 && (
                  <div className="flex justify-between"><span>Shipping</span><span>{taka(detail.order.shippingCents)}</span></div>
                )}
                <div className="flex justify-between font-bold"><span>Total (COD)</span><span>{taka(detail.order.totalCents)}</span></div>
                <div className="border-t pt-2">
                  <div className="font-medium">Tracking</div>
                  <div className="mt-1 grid grid-cols-2 gap-2">
                    <Input placeholder="Courier" value={carrier} onChange={(e) => setCarrier(e.target.value)} />
                    <Input placeholder="Tracking #" value={tracking} onChange={(e) => setTracking(e.target.value)} />
                  </div>
                  <Input placeholder="Note for timeline (optional)" value={note} onChange={(e) => setNote(e.target.value)} className="mt-2" />
                  <Button size="sm" className="mt-2" onClick={saveTracking}>Save tracking</Button>
                  {detail.events.length > 0 && (
                    <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                      {detail.events.map((e) => (
                        <li key={e.id}>
                          {new Date(e.createdAt).toLocaleString()} — {e.fromStatus ? `${e.fromStatus} → ` : ""}{e.toStatus}
                          {e.note ? ` · ${e.note}` : ""}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </Shell>
    </RequireAdmin>
  );
}

export function StatusBadge({ status }: { status: Order["status"] }) {
  const map: Record<Order["status"], "default" | "secondary" | "outline" | "destructive"> = {
    pending: "secondary",
    paid: "default",
    shipped: "outline",
    delivered: "default",
    cancelled: "destructive",
  };
  return <Badge variant={map[status]}>{status}</Badge>;
}
