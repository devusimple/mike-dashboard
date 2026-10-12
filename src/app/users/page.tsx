"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RequireAdmin, useAdmin } from "@/components/admin-provider";
import { Shell } from "@/components/shell";
import { api, type User } from "@/lib/api";

export default function UsersPage() {
  const { user: me } = useAdmin();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const load = async (p = page, q = search) => {
    const params = new URLSearchParams({ page: String(p), limit: "20" });
    if (q.trim()) params.set("search", q.trim());
    const r = await api<{ users: User[]; total: number }>(`/api/users?${params}`);
    setUsers(r.users);
    setTotal(r.total);
  };

  useEffect(() => {
    load(1, "").catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    load(1, search).catch(() => {});
  };

  const update = async (u: User, patch: { role?: "customer" | "admin"; disabled?: boolean }) => {
    await api(`/api/users/${u.id}`, { method: "PATCH", body: patch });
    await load();
  };

  return (
    <RequireAdmin>
      <Shell>
        <h1 className="text-2xl font-bold">Users ({total})</h1>
        <form onSubmit={submitSearch} className="mt-4 flex max-w-md gap-2">
          <Input placeholder="Search name or email…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Button type="submit" variant="secondary">Search</Button>
        </form>
        <Card className="mt-4">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => {
                  const self = me?.id === u.id;
                  return (
                    <TableRow key={u.id} className={u.disabled ? "opacity-60" : undefined}>
                      <TableCell>
                        <div className="font-medium">{u.name}{self && <span className="text-xs text-muted-foreground"> (you)</span>}</div>
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={u.role}
                          disabled={self}
                          onValueChange={(v: unknown) => update(u, { role: String(v) as "customer" | "admin" })}
                        >
                          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="customer">customer</SelectItem>
                            <SelectItem value="admin">admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {u.disabled ? <Badge variant="destructive">disabled</Badge> : <Badge>active</Badge>}
                          {!u.emailVerified && <Badge variant="secondary">unverified</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={self}
                          title={self ? "You cannot change yourself" : undefined}
                          onClick={() => update(u, { disabled: !u.disabled })}
                        >
                          {u.disabled ? "Enable" : "Disable"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">No users found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <span>Page {page}</span>
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => { const p = page - 1; setPage(p); load(p); }}>
            Prev
          </Button>
          <Button variant="outline" size="sm" disabled={users.length < 20} onClick={() => { const p = page + 1; setPage(p); load(p); }}>
            Next
          </Button>
        </div>
      </Shell>
    </RequireAdmin>
  );
}
