/** Typed admin client for the mike API (same contract as the storefront). */

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "https://mike.meeet-signaling-server.workers.dev";

const ACCESS_KEY = "mike.admin.accessToken";
const REFRESH_KEY = "mike.admin.refreshToken";

export const tokenStore = {
  get access(): string | null {
    return typeof window === "undefined" ? null : localStorage.getItem(ACCESS_KEY);
  },
  get refresh(): string | null {
    return typeof window === "undefined" ? null : localStorage.getItem(REFRESH_KEY);
  },
  set(pair: { accessToken: string; refreshToken: string }) {
    localStorage.setItem(ACCESS_KEY, pair.accessToken);
    localStorage.setItem(REFRESH_KEY, pair.refreshToken);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function api<T>(
  path: string,
  opts: { method?: string; body?: unknown; auth?: boolean } = {},
): Promise<T> {
  const { method = "GET", body, auth = true } = opts;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth && tokenStore.access) headers.Authorization = `Bearer ${tokenStore.access}`;

  let res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && auth && tokenStore.refresh) {
    const rotated = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: tokenStore.refresh }),
    });
    if (rotated.ok) {
      const pair = (await rotated.json()) as { accessToken: string; refreshToken: string };
      tokenStore.set(pair);
      headers.Authorization = `Bearer ${pair.accessToken}`;
      res = await fetch(`${API_BASE}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
    } else {
      tokenStore.clear();
    }
  }

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
    throw new ApiError(res.status, err.error ?? err.message ?? `Request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: "customer" | "admin";
  emailVerified: boolean;
}
export interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
}
export interface ProductImage {
  id: string;
  secureUrl: string;
  cloudinaryPublicId: string;
  width: number | null;
  height: number | null;
  position: number;
}
export interface ProductVariant {
  id: string;
  name: string;
  value: string | null;
  sku: string | null;
  priceCents: number | null;
  stock: number;
  isActive: boolean;
  position: number;
}
export interface Tag {
  name: string;
  slug: string;
}
export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  comparePriceCents: number | null;
  sku: string | null;
  stock: number;
  categoryId: string | null;
  isActive: boolean;
  brand: string | null;
  featured: boolean;
  ratingAvg: number;
  ratingCount: number;
  thumbnailPublicId: string | null;
  thumbnailSecureUrl: string | null;
  images?: ProductImage[];
  variants?: ProductVariant[];
  tags?: Tag[];
}
export interface Order {
  id: string;
  userId: string;
  status: "pending" | "paid" | "shipped" | "cancelled";
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  shippingZone: string | null;
  totalCents: number;
  couponCode: string | null;
  createdAt: string;
}
export interface OrderItem {
  id: string;
  productId: string | null;
  productName: string;
  variantId: string | null;
  variantName: string | null;
  qty: number;
  unitPriceCents: number;
}
export interface Coupon {
  code: string;
  percentOff: number;
  active: boolean;
  expiresAt: string | null;
}
export interface ShippingZone {
  id: string;
  name: string;
  chargeCents: number;
  freeAboveCents: number | null;
  active: boolean;
  position: number;
}
