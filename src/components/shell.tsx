"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAdmin } from "@/components/admin-provider";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/overview", label: "Overview" },
  { href: "/products", label: "Products" },
  { href: "/categories", label: "Categories" },
  { href: "/orders", label: "Orders" },
  { href: "/coupons", label: "Coupons" },
  { href: "/shipping", label: "Shipping" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAdmin();
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-56 shrink-0 flex-col border-r bg-card p-4 sm:flex">
        <div className="px-2 text-lg font-bold">
          Mike<span className="text-emerald-600">.</span>{" "}
          <span className="text-xs font-normal text-muted-foreground">admin</span>
        </div>
        <nav className="mt-6 flex flex-col gap-1">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm",
                pathname === n.href || pathname.startsWith(n.href + "/")
                  ? "bg-accent font-medium"
                  : "text-muted-foreground hover:bg-accent/60",
              )}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto px-2 pt-6 text-xs text-muted-foreground">
          <div className="truncate">{user?.email}</div>
          <Button variant="ghost" size="sm" className="mt-1 h-auto p-0" onClick={logout}>
            Logout
          </Button>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <div className="flex gap-1 overflow-x-auto border-b p-2 sm:hidden">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm whitespace-nowrap",
                pathname === n.href ? "bg-accent font-medium" : "text-muted-foreground",
              )}
            >
              {n.label}
            </Link>
          ))}
        </div>
        <main className="mx-auto max-w-6xl p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
