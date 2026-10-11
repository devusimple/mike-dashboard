"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RequireAdmin } from "@/components/admin-provider";
import { Shell } from "@/components/shell";
import { api, type ShippingZone } from "@/lib/api";
import { taka } from "@/lib/format";

export default function ShippingPage() {
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [name, setName] = useState("");
  const [charge, setCharge] = useState("");
  const [free, setFree] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = () =>
    api<{ zones: ShippingZone[] }>("/api/shipping-zones/all").then((r) =>
      setZones(r.zones.sort((a, b) => a.position - b.position)),
    );
  useEffect(() => {
    load().catch(() => {});
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await api("/api/shipping-zones", {
        method: "POST",
        body: {
          name,
          chargeCents: Math.round(Number(charge) * 100),
          freeAboveCents: free ? Math.round(Number(free) * 100) : null,
        },
      });
      setName("");
      setCharge("");
      setFree("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    }
  };

  return (
    <RequireAdmin>
      <Shell>
        <h1 className="text-2xl font-bold">Shipping zones</h1>
        <p className="text-sm text-muted-foreground">Orders snapshot the charge — edits never rewrite history.</p>
        <form onSubmit={create} className="mt-4 grid max-w-2xl grid-cols-2 gap-2 sm:grid-cols-4">
          <Input required placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input required type="number" min={0} step="0.01" placeholder="Charge ৳" value={charge} onChange={(e) => setCharge(e.target.value)} />
          <Input type="number" min={0} step="0.01" placeholder="Free over ৳" value={free} onChange={(e) => setFree(e.target.value)} />
          <Button type="submit">Add</Button>
        </form>
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        <Card className="mt-4 max-w-3xl">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Zone</TableHead>
                  <TableHead>Charge</TableHead>
                  <TableHead>Free over</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {zones.map((z) => (
                  <TableRow key={z.id}>
                    <TableCell className="font-medium">{z.name}</TableCell>
                    <TableCell>{taka(z.chargeCents)}</TableCell>
                    <TableCell>{z.freeAboveCents != null ? taka(z.freeAboveCents) : "—"}</TableCell>
                    <TableCell>{z.active ? "active" : "disabled"}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          await api(`/api/shipping-zones/${z.id}`, { method: "PUT", body: { active: !z.active } });
                          await load();
                        }}
                      >
                        {z.active ? "Disable" : "Enable"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={async () => {
                          if (!confirm(`Delete "${z.name}"?`)) return;
                          await api(`/api/shipping-zones/${z.id}`, { method: "DELETE" });
                          await load();
                        }}
                      >
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
