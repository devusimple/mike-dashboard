"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RequireAdmin } from "@/components/admin-provider";
import { Shell } from "@/components/shell";
import { api, type Coupon } from "@/lib/api";

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [code, setCode] = useState("");
  const [percent, setPercent] = useState("10");
  const [error, setError] = useState<string | null>(null);

  const load = () => api<{ coupons: Coupon[] }>("/api/coupons").then((r) => setCoupons(r.coupons));
  useEffect(() => {
    load().catch(() => {});
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await api("/api/coupons", { method: "POST", body: { code, percentOff: Number(percent) } });
      setCode("");
      setPercent("10");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    }
  };

  return (
    <RequireAdmin>
      <Shell>
        <h1 className="text-2xl font-bold">Coupons</h1>
        <form onSubmit={create} className="mt-4 flex max-w-md gap-2">
          <Input required placeholder="CODE" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className="uppercase" />
          <Input required type="number" min={1} max={90} placeholder="%" value={percent} onChange={(e) => setPercent(e.target.value)} className="w-24" />
          <Button type="submit">Add</Button>
        </form>
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        <Card className="mt-4 max-w-2xl">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Off</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((c) => (
                  <TableRow key={c.code}>
                    <TableCell className="font-mono font-semibold">{c.code}</TableCell>
                    <TableCell>{c.percentOff}%</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={async () => {
                          if (!confirm(`Delete ${c.code}?`)) return;
                          await api(`/api/coupons/${c.code}`, { method: "DELETE" });
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
