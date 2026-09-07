import { Platform } from 'react-native';

/**
 * Typed fetch helper for the A DJAL secure API.
 * Uses EXPO_PUBLIC_API_URL for the base URL.
 * Tokens are NEVER logged.
 */

/** Account shape returned by the API (mirrors openapi.yaml Account schema). */
export type ApiAccount = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'buyer' | 'farmer' | 'admin';
  city: string;
  country: 'CM';
  status: 'active' | 'suspended';
  avatarUrl: string | null;
  interests: string[];
  createdAt: string;
  latitude?: number | null;
  longitude?: number | null;
};

/** Session shape returned by /auth/register and /auth/login. */
export type ApiSession = {
  accessToken: string;
  account: ApiAccount;
};

function getApiBase(): string {
  // Expo exposes EXPO_PUBLIC_* vars at build/runtime
  const configuredBase =
    typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL;
  if (configuredBase) return configuredBase.replace(/\/$/, '');
  if (Platform.OS === 'android') return 'http://10.0.2.2:8099/api';
  if (Platform.OS === 'ios') return 'http://localhost:8099/api';
  if (Platform.OS === 'web') {
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    return hostname === 'localhost' || hostname === '127.0.0.1' ? 'http://localhost:8099/api' : '/api';
  }
  return 'http://localhost:8099/api';
}

/** Turns API media paths into URLs that also work on native Expo clients. */
export function apiAssetUrl(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value) || value.startsWith('data:') || value.startsWith('file:') || value.startsWith('blob:')) {
    return value;
  }
  const base = getApiBase();
  if (base === '/api') return value;
  const origin = base.replace(/\/api\/?$/, '');
  return `${origin}${value.startsWith('/') ? value : `/${value}`}`;
}

type ApiError = { error: string };

/** Generic API fetch. Returns typed data or throws with a user-facing message. */
async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, ...fetchOptions } = options;
  const base = getApiBase();
  const url = `${base}${path}`;

  const isMultipart = typeof FormData !== 'undefined' && fetchOptions.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isMultipart ? {} : { 'Content-Type': 'application/json' }),
    ...(fetchOptions.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...fetchOptions, headers });

  const responseText = await response.text();
  let json: unknown;
  if (responseText) {
    try {
      json = JSON.parse(responseText);
    } catch {
      json = undefined;
    }
  }

  if (!response.ok) {
    const errorBody = json as ApiError;
    throw new Error(errorBody?.error ?? `Erreur serveur (${response.status})`);
  }

  return json as T;
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export async function apiRegister(body: {
  name: string;
  email: string;
  password: string;
  phone: string;
  city: string;
  role: 'buyer' | 'farmer';
}): Promise<ApiSession> {
  return apiFetch<ApiSession>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function apiLogin(body: {
  email: string;
  password: string;
}): Promise<ApiSession> {
  return apiFetch<ApiSession>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function apiLogout(token: string): Promise<void> {
  await apiFetch<void>('/auth/logout', { method: 'POST', token });
}

export async function apiGetMe(token: string): Promise<ApiAccount> {
  return apiFetch<ApiAccount>('/auth/me', { token });
}

/** Always resolves when the reset request is accepted (202), for privacy. */
export async function apiRequestPasswordReset(email: string): Promise<void> {
  await apiFetch<void>('/auth/password-reset', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

/** Consumes a short-lived, one-use recovery credential and signs out sessions. */
export async function apiConfirmPasswordReset(token: string, password: string): Promise<void> {
  await apiFetch<void>('/auth/password-reset/confirm', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  });
}

// ── Conversations ────────────────────────────────────────────────────────────

export type ApiConversation = {
  id: string;
  otherUserId: string;
  otherUserName: string;
  avatarUrl?: string | null;
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type ApiMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  body: string;
  createdAt: string;
  readAt?: string | null;
};

export type ApiNotification = {
  id: string;
  title: string;
  body: string;
  type: 'order' | 'message' | 'product' | 'system';
  readAt?: string | null;
  createdAt: string;
  metadata?: Record<string, unknown> | null;
};

export async function apiGetConversations(token: string): Promise<ApiConversation[]> {
  return apiFetch<ApiConversation[]>('/conversations', { token });
}

export async function apiCreateConversation(token: string, otherUserId: string): Promise<ApiConversation> {
  return apiFetch<ApiConversation>('/conversations', { method: 'POST', token, body: JSON.stringify({ otherUserId }) });
}

export async function apiGetMessages(token: string, conversationId: string): Promise<ApiMessage[]> {
  return apiFetch<ApiMessage[]>(`/conversations/${conversationId}/messages`, { token });
}

export async function apiSendMessage(token: string, conversationId: string, body: string): Promise<ApiMessage> {
  return apiFetch<ApiMessage>(`/conversations/${conversationId}/messages`, {
    method: 'POST',
    token,
    body: JSON.stringify({ body }),
  });
}

export async function apiMarkConversationRead(token: string, conversationId: string): Promise<void> {
  await apiFetch<void>(`/conversations/${conversationId}/read`, { method: 'POST', token });
}

export type ReportReason = 'fraud' | 'harassment' | 'unsafe_product' | 'spam' | 'other';

export async function apiReportFarmer(
  token: string,
  body: { farmerId: string; reason: ReportReason; details: string },
): Promise<void> {
  await apiFetch('/reports', { method: 'POST', token, body: JSON.stringify(body) });
}

export async function apiGetNotifications(token: string): Promise<ApiNotification[]> {
  return apiFetch<ApiNotification[]>('/notifications', { token });
}

export async function apiMarkNotificationRead(token: string, notificationId: string): Promise<void> {
  await apiFetch<void>(`/notifications/${notificationId}/read`, { method: 'PATCH', token });
}

export async function apiGetUnreadNotificationCount(token: string): Promise<{ unreadCount: number }> {
  const result = await apiFetch<{ unreadCount?: number; count?: number }>('/notifications/unread-count', { token });
  return { unreadCount: result.unreadCount ?? result.count ?? 0 };
}

export async function apiUpdateNotificationPreferences(
  token: string,
  body: { notificationsEnabled: boolean },
): Promise<{ notificationsEnabled: boolean }> {
  return apiFetch<{ notificationsEnabled: boolean }>('/notifications/preferences', {
    method: 'PATCH',
    token,
    body: JSON.stringify(body),
  });
}

export async function apiGetNotificationPreferences(token: string): Promise<{ notificationsEnabled: boolean }> {
  return apiFetch<{ notificationsEnabled: boolean }>('/notifications/preferences', { token });
}

export async function apiSearchAccounts(token: string, search = ''): Promise<ApiAccount[]> {
  return apiFetch<ApiAccount[]>(`/accounts?search=${encodeURIComponent(search)}`, { token });
}

export async function apiUploadMedia(
  token: string,
  file: { uri: string; name?: string; type?: string },
): Promise<{ url: string }> {
  const formData = new FormData();
  if (Platform.OS === 'web') {
    const blob = await fetch(file.uri).then((response) => response.blob());
    formData.append('file', blob, file.name ?? 'upload.jpg');
  } else {
    formData.append('file', {
      uri: file.uri,
      name: file.name ?? 'upload.jpg',
      type: file.type ?? 'image/jpeg',
    } as never);
  }
  return apiFetch<{ url: string }>('/media/upload', {
    method: 'POST',
    token,
    headers: {},
    body: formData,
  });
}

export async function apiUploadProfileAvatar(
  token: string,
  file: { uri: string; name?: string; type?: string },
): Promise<{ avatarUrl: string }> {
  const formData = new FormData();
  if (Platform.OS === 'web') {
    const blob = await fetch(file.uri).then((response) => response.blob());
    formData.append('file', blob, file.name ?? 'avatar.jpg');
  } else {
    formData.append('file', {
      uri: file.uri,
      name: file.name ?? 'avatar.jpg',
      type: file.type ?? 'image/jpeg',
    } as never);
  }
  return apiFetch<{ avatarUrl: string }>('/profile/avatar', {
    method: 'POST',
    token,
    headers: {},
    body: formData,
  });
}

export async function apiUpdateProfile(
  token: string,
  changes: {
    name?: string;
    phone?: string;
    city?: string;
    avatarUrl?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  },
): Promise<ApiAccount> {
  return apiFetch<ApiAccount>('/profile', {
    method: 'PATCH',
    token,
    body: JSON.stringify(changes),
  });
}

// ── Interests ─────────────────────────────────────────────────────────────────

export async function apiSaveInterests(
  token: string,
  interests: string[],
): Promise<{ interests: string[] }> {
  return apiFetch<{ interests: string[] }>('/interests', {
    method: 'PUT',
    token,
    body: JSON.stringify({ interests }),
  });
}

export type ApiRecommendation = {
  product: ApiMarketProduct;
  score: number;
  reasons: string[];
};

/** GET /recommendations — server-ranked products for the authenticated buyer. */
export async function apiGetRecommendations(token: string): Promise<ApiRecommendation[]> {
  return apiFetch<ApiRecommendation[]>('/recommendations', { token });
}

/** POST /interactions — records a real product view, search or purchase. */
export async function apiRecordInteraction(
  token: string,
  body: { productId: string; type: 'view' | 'search' | 'purchase' },
): Promise<void> {
  await apiFetch<void>('/interactions', {
    method: 'POST',
    token,
    body: JSON.stringify(body),
  });
}

export type ApiCategory = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Active categories used by the buyer catalog and farmer listing form. */
export async function apiGetCategories(): Promise<ApiCategory[]> {
  return apiFetch<ApiCategory[]>('/categories');
}

// ── Products ────────────────────────────────────────────────────────────────

/** Published, in-stock listing returned by GET /products (mirrors MarketProduct). */
export type ApiMarketProduct = {
  id: string;
  name: string;
  category: string;
  city: string;
  price: number;
  unit: string;
  stock: number;
  status: 'published';
  harvestDate: string;
  shelfLifeDays?: number;
  ownerName: string;
  description?: string | null;
  imageUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

/**
 * Farmer/admin listing returned by POST /products (mirrors AdminProduct).
 * Unlike MarketProduct, status can be pending | published | removed and
 * ownerName may be absent.
 */
export type ApiAdminProduct = {
  id: string;
  name: string;
  category: string;
  city: string;
  price: number;
  unit: string;
  stock: number;
  status: 'pending' | 'published' | 'removed';
  harvestDate: string;
  shelfLifeDays?: number;
  ownerName?: string;
  description?: string | null;
  imageUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

/** GET /products — saleable published listings for authenticated buyers/farmers. */
export async function apiGetProducts(token: string): Promise<ApiMarketProduct[]> {
  return apiFetch<ApiMarketProduct[]>('/products', { token });
}

/** GET /public/products — published catalog for guest browsing. */
export async function apiGetPublicProducts(): Promise<ApiMarketProduct[]> {
  return apiFetch<ApiMarketProduct[]>('/public/products');
}

/**
 * GET /products/mine — the authenticated farmer's OWN listings in every status
 * (pending | published | removed). Farmer role required (403 otherwise).
 */
export async function apiGetMyProducts(token: string): Promise<ApiAdminProduct[]> {
  return apiFetch<ApiAdminProduct[]>('/products/mine', { token });
}

/**
 * PATCH /products/:id — updates the farmer's OWN pending listing. Only the
 * provided fields are changed. Server rejects non-pending listings (409),
 * non-owners (403), and unknown ids (404).
 */
export async function apiUpdateProduct(
  token: string,
  id: string,
  body: Partial<{
    name: string;
    category: string;
    price: number;
    unit: string;
    stock: number;
    city: string;
    harvestDate: string;
    shelfLifeDays: number;
    description?: string;
    imageUrl?: string;
    latitude?: number;
    longitude?: number;
  }>,
): Promise<ApiAdminProduct> {
  return apiFetch<ApiAdminProduct>(`/products/${id}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(body),
  });
}

/**
 * DELETE /products/:id — removes the farmer's OWN pending listing (204).
 * Server rejects non-pending listings (409), non-owners (403), unknown ids (404).
 */
export async function apiDeleteProduct(token: string, id: string): Promise<void> {
  await apiFetch<void>(`/products/${id}`, { method: 'DELETE', token });
}

/** POST /products — create a pending listing (farmer role required). */
export async function apiCreateProduct(
  token: string,
  body: {
    name: string;
    category: string;
    price: number;
    unit: string;
    stock: number;
    city: string;
    harvestDate: string;
    shelfLifeDays?: number;
    description: string;
    imageUrl: string;
    latitude?: number;
    longitude?: number;
  },
): Promise<ApiAdminProduct> {
  return apiFetch<ApiAdminProduct>('/products', {
    method: 'POST',
    token,
    body: JSON.stringify(body),
  });
}

// ── Orders ──────────────────────────────────────────────────────────────────

/** Order returned by GET/POST /orders (mirrors openapi Order schema). */
export type ApiOrder = {
  id: string;
  productId: string;
  productName: string;
  buyerId: string;
  sellerId: string;
  quantity: number;
  unitPrice: number;
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled';
  city: string;
  country: 'CM';
  createdAt: string;
  sellerName?: string | null;
  sellerCity?: string | null;
  sellerPhone?: string | null;
  sellerLatitude?: number | null;
  sellerLongitude?: number | null;
  buyerName?: string | null;
  buyerCity?: string | null;
  buyerPhone?: string | null;
};

/** GET /orders — orders visible to the caller (buyer's own, farmer's sales). */
export async function apiGetOrders(token: string): Promise<ApiOrder[]> {
  return apiFetch<ApiOrder[]>('/orders', { token });
}

/** POST /orders — create a pending order (buyer role required). */
export async function apiCreateOrder(
  token: string,
  body: { productId: string; quantity: number; city?: string },
): Promise<ApiOrder> {
  return apiFetch<ApiOrder>('/orders', {
    method: 'POST',
    token,
    body: JSON.stringify(body),
  });
}

/** A single cart line submitted to POST /checkout. */
export type ApiCheckoutLine = { productId: string; quantity: number };

/**
 * POST /checkout — places the whole cart atomically (buyer role required).
 * All lines succeed together or none do: on any stock/availability failure the
 * server rolls back and returns an error, so the caller can preserve the cart.
 * Returns the created orders (one per line) on success.
 */
export async function apiCheckout(
  token: string,
  body: { lines: ApiCheckoutLine[]; city?: string },
): Promise<ApiOrder[]> {
  return apiFetch<ApiOrder[]>('/checkout', {
    method: 'POST',
    token,
    body: JSON.stringify(body),
  });
}

/**
 * PATCH /orders/:id/status — server-enforced order transition.
 * Buyer may `cancel` their own pending order (restock); the owning farmer may
 * `confirm` a pending order then `deliver` a confirmed one. Returns the updated
 * order; the server rejects invalid transitions (409) and non-owners (403).
 */
export async function apiUpdateOrderStatus(
  token: string,
  id: string,
  status: 'confirmed' | 'delivered' | 'cancelled',
): Promise<ApiOrder> {
  return apiFetch<ApiOrder>(`/orders/${id}/status`, {
    method: 'PATCH',
    token,
    body: JSON.stringify({ status }),
  });
}
