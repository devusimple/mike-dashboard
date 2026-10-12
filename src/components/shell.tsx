"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FolderTree,
  LayoutDashboard,
  LogOut,
  Package,
  ClipboardList,
  TicketPercent,
  Truck,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAdmin } from "@/components/admin-provider";
import { api, type Order } from "@/lib/api";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

const SECTIONS: { title: string; items: Omit<NavItem, "badge">[] }[] = [
  {
    title: "Manage",
    items: [
      { href: "/overview", label: "Overview", icon: LayoutDashboard },
      { href: "/products", label: "Products", icon: Package },
      { href: "/categories", label: "Categories", icon: FolderTree },
      { href: "/users", label: "Users", icon: Users },
    ],
  },
  {
    title: "Sales",
    items: [
      { href: "/orders", label: "Orders", icon: ClipboardList },
      { href: "/coupons", label: "Coupons", icon: TicketPercent },
      { href: "/shipping", label: "Shipping", icon: Truck },
    ],
  },
];

function usePendingCount(enabled: boolean): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    api<{ orders: Order[] }>("/api/orders?all=1&limit=100")
      .then((r) => setCount(r.orders.filter((o) => o.status === "pending").length))
      .catch(() => {});
  }, [enabled]);
  return count;
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm",
        active ? "bg-accent font-medium" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="truncate">{item.label}</span>
      {item.badge != null && item.badge > 0 && (
        <Badge variant="destructive" className="ml-auto h-5 min-w-5 justify-center px-1 text-[11px]">
          {item.badge > 99 ? "99+" : item.badge}
        </Badge>
      )}
    </Link>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAdmin();
  const pending = usePendingCount(!!user);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const withBadges = (href: string) => (href === "/orders" ? pending : undefined);
  const flat = SECTIONS.flatMap((s) => s.items);

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r bg-card p-4 sm:flex">
        <div className="px-2 text-lg font-bold">
          Mike<span className="text-emerald-600">.</span>{" "}
          <span className="text-xs font-normal text-muted-foreground">admin</span>
        </div>
        <nav className="mt-6 flex flex-col gap-4">
          {SECTIONS.map((s) => (
            <div key={s.title}>
              <div className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {s.title}
              </div>
              <div className="flex flex-col gap-0.5">
                {s.items.map((item) => (
                  <NavLink key={item.href} item={{ ...item, badge: withBadges(item.href) }} active={isActive(item.href)} />
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="mt-auto px-2 pt-6">
          <div className="truncate text-xs text-muted-foreground">{user?.email}</div>
          <Button variant="ghost" size="sm" className="mt-1 h-auto justify-start p-0 text-xs" onClick={logout}>
            <LogOut className="mr-1 size-3.5" /> Logout
          </Button>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <div className="sticky top-0 z-10 flex gap-1 overflow-x-auto border-b bg-background/95 p-2 backdrop-blur sm:hidden">
          {flat.map((item) => {
            const Icon = item.icon;
            const badge = withBadges(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-sm whitespace-nowrap",
                  isActive(item.href) ? "bg-accent font-medium" : "text-muted-foreground",
                )}
              >
                <Icon className="size-4" />
                {item.label}
                {badge != null && badge > 0 && (
                  <Badge variant="destructive" className="h-5 min-w-5 justify-center px-1 text-[11px]">
                    {badge > 99 ? "99+" : badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </div>
        <main className="mx-auto max-w-6xl p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
