import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import {
  apiCheckout,
  apiCreateProduct,
  apiDeleteProduct,
  apiGetMe,
  apiGetCategories,
  apiGetNotificationPreferences,
  apiGetNotifications,
  apiGetMyProducts,
  apiGetOrders,
  apiGetProducts,
  apiGetPublicProducts,
  apiGetRecommendations,
  apiLogin,
  apiLogout,
  apiRecordInteraction,
  apiRegister,
  apiSaveInterests,
  apiUpdateNotificationPreferences,
  apiUploadMedia,
  apiUpdateOrderStatus,
  apiUpdateProduct,
  apiAssetUrl,
  type ApiAccount,
  type ApiAdminProduct,
  type ApiCategory,
  type ApiMarketProduct,
  type ApiOrder,
} from './api-client';

export type Role = 'buyer' | 'farmer' | 'guest';
export type ThemeMode = 'light' | 'dark';
export type Language = 'fr' | 'en';
export type PaymentKind = 'orange-money' | 'mtn-momo' | 'visa' | 'mastercard' | 'cash';
export type UserProfile = {
  name: string;
  email: string;
  phone: string;
  countryCode: string;
  countryName: string;
  location: string;
  address: string;
  crops: string;
  surface: string;
  notificationsEnabled: boolean;
  avatarUri?: string;
  interests: string[];
};
export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  /** Type envoyé par le backend (new_order, order_status, message, product_status…). */
  type: string;
  resourceType?: string | null;
  resourceId?: string | null;
  createdAt: string;
  readAt?: string | null;
  metadata?: Record<string, unknown> | null;
};
export type PaymentMethod = {
  id: string;
  kind?: PaymentKind;
  label: string;
  holder: string;
  reference: string;
};
export type DailyOffer = {
  id: string;
  productId: string;
  label: string;
  availability: string;
  expiresAt: string;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  offerId?: string;
  unit: string;
  image: string;
  category: string;
  farmer: string;
  /** Photo de profil de l'agriculteur. */
  farmerAvatar?: string;
  location: string;
  stock: number;
  rating: number;
  isPopular?: boolean;
  harvestDate?: string;
  shelfLifeDays?: number;
  latitude?: number | null;
  longitude?: number | null;
  status?: 'pending' | 'published' | 'removed';
};

export type CartLine = {
  id: string;
  product: Product;
  quantity: number;
};

export type Order = {
  id: string;
  date: string;
  items: CartLine[];
  total: number;
  status: 'En attente' | 'Confirmée' | 'Préparée' | 'Terminée' | 'Annulée';
  customer: string;
  location: string;
  sellerId?: string;
  sellerName?: string;
  sellerCity?: string;
  sellerPhone?: string;
  sellerLatitude?: number | null;
  sellerLongitude?: number | null;
  buyerId?: string;
  buyerName?: string;
  buyerCity?: string;
  buyerPhone?: string;
  sellerAvatar?: string;
  buyerAvatar?: string;
};

export type Category = {
  id: string;
  label: string;
  slug: string;
  icon: string;
  color: string;
  active: boolean;
  imageUrl?: string | null;
};

export const categories: Category[] = [
  { id: 'all', slug: 'all', label: 'Tout', icon: 'grid-outline', color: '#DFF3E5', active: true },
  { id: 'fruits', slug: 'fruits', label: 'Fruits', icon: 'sunny-outline', color: '#FFF0C9', active: true },
  { id: 'legumes', slug: 'legumes', label: 'Légumes', icon: 'leaf-outline', color: '#DFF3E5', active: true },
  { id: 'tubercules', slug: 'tubercules', label: 'Tubercules', icon: 'ellipse-outline', color: '#FCE7D7', active: true },
  { id: 'cereales', slug: 'cereales', label: 'Céréales', icon: 'reorder-three-outline', color: '#E7F0FF', active: true },
];

const categoryPresentation: Record<string, Pick<Category, 'icon' | 'color'>> = {
  fruits: { icon: 'sunny-outline', color: '#FFF0C9' },
  legumes: { icon: 'leaf-outline', color: '#DFF3E5' },
  tubercules: { icon: 'ellipse-outline', color: '#FCE7D7' },
  cereales: { icon: 'reorder-three-outline', color: '#E7F0FF' },
  epices: { icon: 'flame-outline', color: '#FFE2D5' },
};

function apiCategoryToCategory(category: ApiCategory): Category {
  const presentation = categoryPresentation[category.slug] ?? {
    icon: 'basket-outline',
    color: '#E7F0FF',
  };
  return {
    id: category.slug,
    slug: category.slug,
    label: category.name,
    icon: presentation.icon,
    color: presentation.color,
    active: category.active,
    imageUrl: apiAssetUrl(category.imageUrl),
  };
}

export const seedProducts: Product[] = []; /*
  {
    id: 'p1',
    name: 'Tomates fraîches',
    description: 'Tomates mûries au soleil, récoltées à la main et prêtes à cuisiner.',
    price: 4000,
    unit: 'caisse',
    image: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=900&q=85',
    category: 'legumes',
    farmer: 'Anaba Geo',
    location: 'Ntui',
    stock: 24,
    rating: 4.8,
    isPopular: true,
    harvestDate: '2026-08-20',
    shelfLifeDays: 7,
  },
  {
    id: 'p2',
    name: 'Manioc',
    description: 'Manioc frais de qualité, cultivé localement sans intermédiaire.',
    price: 5000,
    unit: 'filet',
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=900&q=85',
    category: 'tubercules',
    farmer: 'Jean Mfou',
    location: 'Yaoundé',
    stock: 10,
    rating: 4.7,
    isPopular: true,
    harvestDate: '2026-08-16',
    shelfLifeDays: 30,
  },
  {
    id: 'p3',
    name: 'Maïs jaune',
    description: 'Épis de maïs jaune sélectionnés, parfaits pour la consommation familiale.',
    price: 4000,
    unit: 'sac',
    image: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=900&q=85',
    category: 'cereales',
    farmer: 'Aïssatou B',
    location: 'Bafoussam',
    stock: 0,
    rating: 4.5,
    harvestDate: '2026-08-18',
    shelfLifeDays: 12,
  },
  {
    id: 'p4',
    name: 'Bananes plantain',
    description: 'Plantains verts et fermes, idéals pour les plats camerounais.',
    price: 6500,
    unit: 'régime',
    image: 'https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=900&q=85',
    category: 'fruits',
    farmer: 'Marie Nomo',
    location: 'Loum',
    stock: 35,
    rating: 4.9,
    isPopular: true,
    harvestDate: '2026-08-19',
    shelfLifeDays: 10,
  },
  {
    id: 'p5',
    name: 'Ananas',
    description: 'Ananas sucrés et parfumés récoltés à maturité.',
    price: 2500,
    unit: 'pièce',
    image: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=900&q=85',
    category: 'fruits',
    farmer: 'Paul Njoya',
    location: 'Bafang',
    stock: 18,
    rating: 4.6,
    harvestDate: '2026-08-17',
    shelfLifeDays: 9,
  },
  {
    id: 'p6',
    name: 'Piments frais',
    description: 'Piments rouges et verts, relevés et soigneusement triés.',
    price: 1800,
    unit: 'panier',
    image: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=900&q=85',
    category: 'legumes',
    farmer: 'Aminata T.',
    location: 'Douala',
    stock: 42,
    rating: 4.4,
    harvestDate: '2026-08-20',
    shelfLifeDays: 6,
  },
  {
    id: 'p7',
    name: 'Patates douces',
    description: 'Patates douces généreuses, naturellement douces et nourrissantes.',
    price: 3500,
    unit: 'sac',
    image: 'https://images.unsplash.com/photo-1596097635121-14b63c7b3b1f?w=900&q=85',
    category: 'tubercules',
    farmer: 'Cédric Nana',
    location: 'Bamenda',
    stock: 16,
    rating: 4.6,
    harvestDate: '2026-08-13',
    shelfLifeDays: 21,
  },
  {
    id: 'p8',
    name: 'Haricots rouges',
    description: 'Haricots secs triés, propres et prêts à conserver.',
    price: 4500,
    unit: 'sac',
    image: 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=900&q=85',
    category: 'cereales',
    farmer: 'Claudine F.',
    location: 'Dschang',
    stock: 28,
    rating: 4.8,
    harvestDate: '2026-08-05',
    shelfLifeDays: 120,
  },
];

export const dailyOffers: DailyOffer[] = [
  { id: 'offer-tomatoes', productId: 'p1', label: 'Récolte du matin', availability: '24 caisses disponibles', expiresAt: 'Aujourd\u2019hui, 18:00' },
  { id: 'offer-plantains', productId: 'p4', label: 'Direct de Loum', availability: '35 régimes disponibles', expiresAt: 'Aujourd\u2019hui, 20:00' },
  { id: 'offer-cassava', productId: 'p2', label: 'Sélection locale', availability: '10 filets disponibles', expiresAt: 'Demain, 10:00' },
];

const seedOrders: Order[] = [
  {
    id: '#1048',
    date: '25 juillet 2026',
    items: [{ id: 'p5:standard:700', product: seedProducts[4], quantity: 5 }],
    total: 3500,
    status: 'En attente',
    customer: 'Ahanda Geo',
    location: 'Yaoundé',
  },
  {
    id: '#1049',
    date: '25 juillet 2026',
    items: [{ id: 'p4:standard:6500', product: seedProducts[3], quantity: 1 }],
    total: 6500,
    status: 'Confirmée',
    customer: 'Mbida Ngue',
    location: 'Douala',
  },
  {
    id: '#1050',
    date: '25 juillet 2026',
    items: [{ id: 'p1:standard:4000', product: seedProducts[0], quantity: 1 }],
    total: 4000,
    status: 'Terminée',
    customer: 'Marcel Cesar',
    location: 'Yaoundé',
  },
  {
    id: '#1056',
    date: '25 juillet 2026',
    items: [{ id: 'p7:standard:1400', product: seedProducts[6], quantity: 5 }],
    total: 7000,
    status: 'Annulée',
    customer: 'Ngountsan Vanel',
    location: 'Bafoussam',
  },
  {
    id: '#1060',
    date: '24 juillet 2026',
    items: [{ id: 'p2:standard:5000', product: seedProducts[1], quantity: 1 }],
    total: 5000,
    status: 'En attente',
    customer: 'Michel Ngui',
    location: 'Yaoundé',
  },
  {
    id: '#1064',
    date: '24 juillet 2026',
    items: [{ id: 'p5:standard:700', product: seedProducts[4], quantity: 5 }],
    total: 12500,
    status: 'Terminée',
    customer: 'Abouna Mvondo',
    location: 'Douala',
  },
]; */

const storageKeys = {
  hasSeenOnboarding: '@adjal/hasSeenOnboarding/v2',
  role: '@adjal/role',
  cart: '@adjal/cart',
  orders: '@adjal/orders',
  products: '@adjal/farmerProducts',
  themeMode: '@adjal/themeMode',
  language: '@adjal/language',
  profile: '@adjal/profile',
  paymentMethods: '@adjal/paymentMethods',
  selectedPaymentMethodId: '@adjal/selectedPaymentMethodId',
  /** Opaque access token — persisted only in Expo SecureStore. */
  accessToken: 'adjal.accessToken.v1',
};

/** Maps a server ApiAccount to local UserProfile. Admin role is never trusted in mobile. */
function accountToProfile(acc: ApiAccount, existing: UserProfile): UserProfile {
  return {
    ...existing,
    name: acc.name,
    email: acc.email,
    // phone from server is +237XXXXXXXXX — strip the prefix for display
    phone: acc.phone.replace(/^\+237/, ''),
    countryCode: '+237',
    countryName: 'Cameroun',
    location: acc.city ? `${acc.city}, Cameroun` : existing.location,
    interests: Array.isArray(acc.interests) ? acc.interests : existing.interests,
    avatarUri: apiAssetUrl(acc.avatarUrl) ?? existing.avatarUri,
  };
}

/** Returns 'buyer' or 'farmer' — never 'admin' in mobile. */
function safeRole(serverRole: string): 'buyer' | 'farmer' {
  if (serverRole === 'farmer') return 'farmer';
  return 'buyer';
}

/** UI-only fields are kept locally while server-backed product media is preferred. */
type ProductUiOverlay = { description?: string; image?: string; rating?: number; isPopular?: boolean };

const fallbackProductImage = 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=600&q=85';
const categoryFallbackImages: Record<string, string> = {
  fruits: 'https://images.unsplash.com/photo-1577234286642-fc512a5f8f1f?w=900&q=85',
  legumes: 'https://images.unsplash.com/photo-1540420773420-3366772f3310?w=900&q=85',
  tubercules: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=900&q=85',
  cereales: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=900&q=85',
};

/** Maps a server product (market or admin listing) to the local Product UI shape. */
function apiProductToProduct(
  api: ApiMarketProduct | ApiAdminProduct,
  overlay?: ProductUiOverlay,
): Product {
  return {
    id: api.id,
    name: api.name,
    description: api.description ?? overlay?.description ?? 'Produit agricole local soigneusement sélectionné.',
    price: api.price,
    unit: api.unit,
    image: apiAssetUrl(api.imageUrl) ?? overlay?.image ?? fallbackProductImage,
    category: api.category,
    farmer: api.ownerName ?? '',
    farmerAvatar: apiAssetUrl(api.ownerAvatarUrl),
    location: api.city,
    stock: api.stock,
    rating: overlay?.rating ?? 4.7,
    isPopular: overlay?.isPopular,
    harvestDate: api.harvestDate,
    shelfLifeDays: api.shelfLifeDays,
    latitude: api.latitude,
    longitude: api.longitude,
    status: api.status,
  };
}

const apiOrderStatusToLocal: Record<ApiOrder['status'], Order['status']> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  delivered: 'Terminée',
  cancelled: 'Annulée',
};

/**
 * Maps a target local status to the server transition verb accepted by
 * PATCH /orders/:id/status. Only these transitions exist server-side; any other
 * requested status is not a valid server-backed transition.
 */
const localStatusToApiTransition: Partial<
  Record<Order['status'], 'confirmed' | 'delivered' | 'cancelled'>
> = {
  Confirmée: 'confirmed',
  Terminée: 'delivered',
  Annulée: 'cancelled',
};

/** Formats an ISO timestamp for display; falls back to the raw value on failure. */
function formatOrderDate(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Maps a server Order (single product line) to the local Order UI shape.
 * The line's Product is reconstructed from the order plus any known catalog
 * product for richer display (image/category).
 */
function apiOrderToOrder(
  api: ApiOrder,
  customerName: string,
  known?: Product,
): Order {
  // L'image envoyée par le serveur avec la commande est la même que celle de la fiche produit.
  const serverImage = apiAssetUrl(api.productImageUrl);
  const lineProduct: Product = known
    ? {
        ...known,
        price: api.unitPrice,
        name: api.productName,
        image: serverImage ?? known.image,
        unit: api.productUnit ?? known.unit,
        category: api.productCategory ?? known.category,
        stock: Math.max(known.stock, api.quantity),
      }
    : {
        id: api.productId,
        name: api.productName,
        description: 'Produit agricole local soigneusement sélectionné.',
        price: api.unitPrice,
        unit: api.productUnit ?? 'unité',
        image: serverImage ?? fallbackProductImage,
        category: api.productCategory ?? 'legumes',
         farmer: api.sellerName ?? '',
         farmerAvatar: apiAssetUrl(api.sellerAvatarUrl),
         location: api.sellerCity ?? api.city,
        stock: api.quantity,
        rating: 4.7,
      };
  return {
    id: api.id,
    date: formatOrderDate(api.createdAt),
    items: [{ id: `${api.productId}:standard:${api.unitPrice}`, product: lineProduct, quantity: api.quantity }],
    total: api.unitPrice * api.quantity,
    status: apiOrderStatusToLocal[api.status] ?? 'En attente',
    customer: customerName,
    location: api.city,
    sellerId: api.sellerId,
    sellerName: api.sellerName ?? undefined,
    sellerCity: api.sellerCity ?? undefined,
    sellerPhone: api.sellerPhone ?? undefined,
    sellerLatitude: api.sellerLatitude,
    sellerLongitude: api.sellerLongitude,
    buyerId: api.buyerId,
    buyerName: api.buyerName ?? undefined,
    buyerCity: api.buyerCity ?? undefined,
    buyerPhone: api.buyerPhone ?? undefined,
    sellerAvatar: apiAssetUrl(api.sellerAvatarUrl),
    buyerAvatar: apiAssetUrl(api.buyerAvatarUrl),
  };
}

/**
 * Native builds use the OS credential vault. Expo SecureStore's web shim is not
 * implemented in the current SDK, so the preview uses tab-scoped sessionStorage
 * rather than any persistent browser storage.
 */
const sessionTokenStore = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') return globalThis.sessionStorage?.getItem(key) ?? null;
    return SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      globalThis.sessionStorage?.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  async deleteItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      globalThis.sessionStorage?.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

type AppContextValue = {
  accessToken: string | null;
  userId: string | null;
  hydrated: boolean;
  hasSeenOnboarding: boolean;
  role: Role | null;
  themeMode: ThemeMode;
  language: Language;
  profile: UserProfile;
  paymentMethods: PaymentMethod[];
  selectedPaymentMethodId: string | null;
  dailyOffers: DailyOffer[];
  categories: Category[];
  products: Product[];
  cart: CartLine[];
  orders: Order[];
  farmerListings: Product[];
  recommendations: Product[];
  setHasSeenOnboarding: (value: boolean) => void;
  setRole: (role: Role | null) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setLanguage: (language: Language) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  addPaymentMethod: (method: Omit<PaymentMethod, 'id'>) => void;
  selectPaymentMethod: (id: string) => void;
  addToCart: (product: Product, quantity?: number) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  /**
   * Buyer-only: submits the whole cart to POST /checkout atomically with the
   * buyer's city. Resolves with the created server orders and clears the cart on
   * success; on any error the entire cart is preserved. Throws a user-facing
   * message on failure.
   */
  createOrder: () => Promise<Order[]>;
  /**
   * Farmer-only: saves a listing to the server. Existing own listings are sent
   * via PATCH /products/:id; new ones via POST /products. The farmer list is
   * refreshed from the server response. Throws a user-facing message on failure.
   * UI-only fields (description/image) are preserved locally.
   */
  saveProduct: (product: Product) => Promise<void>;
  /** Farmer-only: removes an own listing via DELETE /products/:id, then mutates local state from the server outcome. */
  deleteProduct: (productId: string) => Promise<void>;
  /** Server-backed order transition via PATCH /orders/:id/status; local state mutates only from the server response. */
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  notificationsEnabled: boolean;
  updateNotificationPreferences: (enabled: boolean) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  /** Recharge les commandes depuis le serveur (ex. à l'ouverture d'une notification). */
  refreshOrders: () => Promise<void>;
  /** Recharge les annonces de l'agriculteur connecté. */
  refreshFarmerListings: () => Promise<void>;
  notifications: NotificationItem[];
  cartCount: number;
  cartTotal: number;
  /** Sign in with email + password. Returns the resolved role. Throws with a user-facing message on failure. */
  signIn: (email: string, password: string) => Promise<'buyer' | 'farmer'>;
  /** Register a new account. Returns the resolved role. Throws with a user-facing message on failure. */
  registerAccount: (params: {
    name: string;
    email: string;
    password: string;
    phone: string;
    city: string;
    role: 'buyer' | 'farmer';
  }) => Promise<'buyer' | 'farmer'>;
  /** Sign out: invalidates server session, clears local token, resets role. */
  signOut: () => Promise<void>;
  /**
   * Saves interests via PUT /api/interests.
   * Updates local profile only on success. Throws on error.
   */
  saveInterests: (interests: string[]) => Promise<void>;
  recordInteraction: (productId: string, type: 'view' | 'search' | 'purchase') => Promise<void>;
};

/**
 * Code de commande court et lisible pour l'affichage (ex. « CMD-7F3A2C »).
 * Tiré de l'identifiant serveur : identique pour l'acheteur, l'agriculteur et l'admin.
 * L'identifiant complet reste utilisé en interne pour les appels API.
 */
export function formatOrderCode(id: string | null | undefined): string {
  if (!id) return 'CMD-?';
  const compact = id.replace(/[^a-zA-Z0-9]/g, '');
  if (compact.length <= 6) return id;
  return `CMD-${compact.slice(0, 6).toUpperCase()}`;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboardingState] = useState(false);
  const [role, setRoleState] = useState<Role | null>(null);
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');
  const [language, setLanguageState] = useState<Language>('fr');
  const defaultProfile: UserProfile = {
    name: '',
    email: '',
    phone: '',
    countryCode: '+237',
    countryName: 'Cameroun',
    location: '',
    address: '',
    crops: '',
    surface: '',
    notificationsEnabled: true,
    interests: [],
  };
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string | null>(null);
  /**
   * Server published catalog for authenticated users. Falls back to seedProducts
   * only for guest browsing (never a source of truth for signed-in accounts).
   */
  const [serverCatalog, setServerCatalog] = useState<Product[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<Category[]>(categories);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  /** Opaque access token — kept in state but never logged. */
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [userId, setUserIdState] = useState<string | null>(null);
  /**
   * UI-only overlays (description/image/rating/popularity) for server products,
   * keyed by product id. The API does not persist these fields.
   */
  const productOverlaysRef = React.useRef<Record<string, ProductUiOverlay>>({});
  /**
   * Farmer's own listings in every status (pending/published/removed), fetched
   * authoritatively from GET /products/mine. GET /products only returns published
   * in-stock catalog entries, so a farmer's pending/removed listings come from
   * this dedicated endpoint — never from session-created records.
   */
  const [farmerListings, setFarmerListings] = useState<Product[]>([]);
  const [recommendations, setRecommendations] = useState<Product[]>([]);

  /** Persist the opaque session token in SecureStore (or tab-scoped web storage). */
  const persistToken = async (token: string | null) => {
    if (token) {
      await sessionTokenStore.setItem(storageKeys.accessToken, token);
    } else {
      await sessionTokenStore.deleteItem(storageKeys.accessToken);
    }
  };

  /**
   * Fetches server products and orders for an authenticated account and replaces
   * the local catalog/order state (server is the source of truth for signed-in
   * users). Buyers fetch the published catalog + their own orders; farmers also
   * fetch their OWN listings in every status via GET /products/mine so pending
   * and removed listings appear in their product list — never from any
   * session-created list. Best-effort: a failure leaves prior server state.
   */
  const loadServerData = async (token: string, account: ApiAccount) => {
    const role = safeRole(account.role);
    const isFarmer = role === 'farmer';
    const [productsResult, ordersResult, mineResult, categoriesResult, recommendationsResult, notificationsResult, preferencesResult] = await Promise.allSettled([
      apiGetProducts(token),
      apiGetOrders(token),
      isFarmer ? apiGetMyProducts(token) : Promise.resolve<ApiAdminProduct[]>([]),
      apiGetCategories(),
      role === 'buyer' ? apiGetRecommendations(token) : Promise.resolve([]),
      apiGetNotifications(token),
      apiGetNotificationPreferences(token),
    ]);

    if (categoriesResult.status === 'fulfilled') {
      setCategoryOptions([categories[0], ...categoriesResult.value.map(apiCategoryToCategory)]);
    }

    let catalog: Product[] = [];
    if (productsResult.status === 'fulfilled') {
      catalog = productsResult.value.map((api) =>
        apiProductToProduct(api, productOverlaysRef.current[api.id]),
      );
      // Server published listings are the source of truth for signed-in users.
      setServerCatalog(catalog);
    }

    if (isFarmer && mineResult.status === 'fulfilled') {
      // The farmer's own listings (any status) come straight from the server.
      const own = mineResult.value.map((api) =>
        apiProductToProduct(api, productOverlaysRef.current[api.id]),
      );
      setFarmerListings(own);
    }

    if (ordersResult.status === 'fulfilled') {
      const mapped = ordersResult.value.map((api) =>
        apiOrderToOrder(
          api,
          // The farmer's own sales list the buyer (name unknown from the API);
          // the buyer's own orders are placed by the account holder.
          role === 'farmer' ? (api.buyerName ?? 'Client A DJAL') : account.name,
          catalog.find((product) => product.id === api.productId),
        ),
      );
      setOrders(mapped);
    }
    if (recommendationsResult.status === 'fulfilled' && role === 'buyer') {
      const ranked = recommendationsResult.value as { product: ApiMarketProduct }[];
      setRecommendations(ranked.map((item) => apiProductToProduct(item.product, productOverlaysRef.current[item.product.id])));
    }
    if (notificationsResult.status === 'fulfilled') setNotifications(notificationsResult.value);
    if (preferencesResult.status === 'fulfilled') {
      setNotificationsEnabled(preferencesResult.value.notificationsEnabled);
      setProfile((current) => ({ ...current, notificationsEnabled: preferencesResult.value.notificationsEnabled }));
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const localKeys = Object.values(storageKeys).filter((key) => key !== storageKeys.accessToken);
        const values = await AsyncStorage.multiGet(localKeys);
        const stored = Object.fromEntries(values);
        if (stored[storageKeys.hasSeenOnboarding] === 'true') setHasSeenOnboardingState(true);
        if (stored[storageKeys.themeMode] === 'dark' || stored[storageKeys.themeMode] === 'light') {
          setThemeModeState(stored[storageKeys.themeMode] as ThemeMode);
        }
        if (stored[storageKeys.language] === 'fr' || stored[storageKeys.language] === 'en') {
          setLanguageState(stored[storageKeys.language] as Language);
        }
        const storedProfile = stored[storageKeys.profile];
        const storedPaymentMethods = stored[storageKeys.paymentMethods];
        if (storedProfile) {
          try {
            const restoredProfile = JSON.parse(storedProfile) as Partial<UserProfile>;
            setProfile({ ...defaultProfile, ...restoredProfile, interests: Array.isArray(restoredProfile.interests) ? restoredProfile.interests : [] });
            setNotificationsEnabled(restoredProfile.notificationsEnabled ?? true);
          } catch {
            // Corrupted profile data — ignore and use defaults.
          }
        }
        if (storedPaymentMethods) {
          try {
            const restoredMethods: PaymentMethod[] = JSON.parse(storedPaymentMethods).map((method: PaymentMethod) => ({ ...method, kind: method.kind ?? 'orange-money' }));
            setPaymentMethods(restoredMethods);
            const restoredSelectedId = stored[storageKeys.selectedPaymentMethodId];
            setSelectedPaymentMethodId(restoredMethods.some((method) => method.id === restoredSelectedId) ? restoredSelectedId : restoredMethods[0]?.id ?? null);
          } catch {
            // Corrupted payment methods — ignore.
          }
        } else if (stored[storageKeys.selectedPaymentMethodId] === 'pm-mobile-money') {
          setSelectedPaymentMethodId('pm-orange-money');
        }
        const storedCart = stored[storageKeys.cart];
        if (storedCart) {
          try {
            setCart(JSON.parse(storedCart).map((line: CartLine) => ({ ...line, id: line.id ?? `${line.product.id}:${line.product.offerId ?? 'standard'}:${line.product.price}` })));
          } catch {
            // Corrupted cart — ignore.
          }
        }

        // Hydrate auth: restore token and validate with GET /api/auth/me
        const storedToken = await sessionTokenStore.getItem(storageKeys.accessToken);
        if (storedToken) {
          try {
            const account = await apiGetMe(storedToken);
            if (account.role === 'admin') {
              await persistToken(null);
            } else {
             setAccessTokenState(storedToken);
             setUserIdState(account.id);
             setRoleState(safeRole(account.role));
             setProfile((current) => accountToProfile(account, current));
             await loadServerData(storedToken, account);
            }
          } catch {
            await persistToken(null);
          }
        } else {
          try {
            const [remoteCategories, remoteProducts] = await Promise.all([
              apiGetCategories(),
              apiGetPublicProducts(),
            ]);
            setCategoryOptions([categories[0], ...remoteCategories.map(apiCategoryToCategory)]);
            setServerCatalog(remoteProducts.map((product) => apiProductToProduct(product, productOverlaysRef.current[product.id])));
          } catch {
            // Offline guests see an honest empty state instead of fabricated products.
          }
          if (stored[storageKeys.role]) {
            const storedRole = stored[storageKeys.role] as Role;
            if (storedRole === 'guest') setRoleState('guest');
          }
        }
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.multiSet([
      [storageKeys.hasSeenOnboarding, String(hasSeenOnboarding)],
      [storageKeys.role, role ?? ''],
      [storageKeys.themeMode, themeMode],
      [storageKeys.language, language],
      [storageKeys.profile, JSON.stringify(profile)],
      [storageKeys.paymentMethods, JSON.stringify(paymentMethods)],
      [storageKeys.selectedPaymentMethodId, selectedPaymentMethodId ?? ''],
      [storageKeys.cart, JSON.stringify(cart)],
    ]).catch(() => {
      // Échec de sauvegarde locale : on ignore pour ne pas bloquer l'application.
    });
  }, [cart, hasSeenOnboarding, hydrated, language, orders, paymentMethods, serverCatalog, profile, role, selectedPaymentMethodId, themeMode]);

  const setHasSeenOnboarding = (value: boolean) => setHasSeenOnboardingState(value);
  const setRole = (nextRole: Role | null) => setRoleState(nextRole);
  const setThemeMode = (nextMode: ThemeMode) => setThemeModeState(nextMode);
  const setLanguage = (nextLanguage: Language) => setLanguageState(nextLanguage);
  const updateProfile = (changes: Partial<UserProfile>) => setProfile((current) => ({ ...current, ...changes }));
  const updateNotificationPreferences = async (enabled: boolean) => {
    if (accessToken) {
      await apiUpdateNotificationPreferences(accessToken, { notificationsEnabled: enabled });
    }
    setNotificationsEnabled(enabled);
    updateProfile({ notificationsEnabled: enabled });
  };
  const refreshNotifications = async () => {
    if (!accessToken) return;
    try {
      const items = await apiGetNotifications(accessToken);
      setNotifications(items);
    } catch {
      // Silently ignore refresh failures.
    }
  };
  const refreshOrders = async () => {
    if (!accessToken) return;
    try {
      const result = await apiGetOrders(accessToken);
      const known = [...serverCatalog, ...farmerListings];
      setOrders(result.map((api) =>
        apiOrderToOrder(
          api,
          role === 'farmer' ? (api.buyerName ?? 'Client A DJAL') : profile.name,
          known.find((product) => product.id === api.productId),
        ),
      ));
    } catch {
      // Garde les commandes déjà affichées si le serveur est momentanément injoignable.
    }
  };
  const refreshFarmerListings = async () => {
    if (!accessToken || role !== 'farmer') return;
    try {
      const mine = await apiGetMyProducts(accessToken);
      setFarmerListings(mine.map((api) => apiProductToProduct(api, productOverlaysRef.current[api.id])));
    } catch {
      // Garde les annonces déjà affichées.
    }
  };
  const addPaymentMethod = (method: Omit<PaymentMethod, 'id'>) => {
    const next = { ...method, id: `pm-${Date.now()}` };
    setPaymentMethods((current) => [...current, next]);
    setSelectedPaymentMethodId(next.id);
  };
  const selectPaymentMethod = (id: string) => setSelectedPaymentMethodId(id);

  const addToCart = (product: Product, quantity = 1) => {
    if (product.stock <= 0) return;
    setCart((current) => {
      const lineId = `${product.id}:${product.offerId ?? 'standard'}:${product.price}`;
      const existing = current.find((line) => line.id === lineId);
      if (existing) {
        return current.map((line) =>
          line.id === lineId
            ? { ...line, quantity: Math.min(line.quantity + quantity, product.stock) }
            : line,
        );
      }
      return [...current, { id: lineId, product, quantity: Math.min(quantity, product.stock) }];
    });
  };

  const updateCartQuantity = (lineId: string, quantity: number) => {
    setCart((current) =>
      current
        .map((line) =>
          line.id === lineId
            ? { ...line, quantity: Math.min(Math.max(quantity, 0), line.product.stock) }
            : line,
        )
        .filter((line) => line.quantity > 0),
    );
  };

  const removeFromCart = (lineId: string) =>
    setCart((current) => current.filter((line) => line.id !== lineId));
  const clearCart = () => setCart([]);

  /**
   * Buyer-only server-backed checkout. Submits the WHOLE cart to POST /checkout
   * in a single atomic request with the buyer's city. The server creates every
   * order or none: on success we map the returned orders into local state and
   * clear the cart; on any error the entire cart is preserved (no partial state,
   * no local mutation).
   */
  const createOrder = async (): Promise<Order[]> => {
    if (!accessToken || role !== 'buyer') {
      throw new Error('Connectez-vous en tant qu’acheteur pour commander.');
    }
    if (!cart.length) return [];
    const city = profile.location.split(',')[0]?.trim() || profile.location.trim();
    // Atomic checkout of every cart line. A thrown error leaves the cart intact.
    const apiOrders = await apiCheckout(accessToken, {
      lines: cart.map((line) => ({ productId: line.product.id, quantity: line.quantity })),
      city,
    });
    const knownById = new Map(cart.map((line) => [line.product.id, line.product]));
    const created = apiOrders.map((apiOrder) =>
      apiOrderToOrder(apiOrder, profile.name, knownById.get(apiOrder.productId)),
    );
    // Checkout succeeded atomically — merge server orders and clear the cart.
    setOrders((current) => {
      const createdIds = new Set(created.map((order) => order.id));
      return [...created, ...current.filter((order) => !createdIds.has(order.id))];
    });
    setCart([]);
    return created;
  };

  /**
   * Farmer-only server-backed listing save. When the product id already matches
   * one of the farmer's own server listings, the change is sent via
   * PATCH /products/:id (the server only accepts edits to pending listings).
   * Otherwise a new pending listing is created via POST /products. In both cases
   * the farmer list is refreshed from the mapped server response — never from a
   * locally-fabricated record. UI-only fields (description/image/rating/
   * popularity) are kept locally in the overlay; they are NOT persisted
   * server-side.
   */
  const saveProduct = async (product: Product): Promise<void> => {
    if (!accessToken || role !== 'farmer') {
      throw new Error('Connectez-vous en tant qu’agriculteur pour publier un produit.');
    }
    const city = product.location.split(',')[0]?.trim() || product.location.trim();
    const isExistingServerListing = farmerListings.some((item) => item.id === product.id);
    const resolveUpload = async (image: string | undefined) => {
      if (!image || !(image.startsWith('file://') || image.startsWith('content://') || image.startsWith('ph://') || image.startsWith('blob:'))) return undefined;
      const uploaded = await apiUploadMedia(accessToken, { uri: image });
      return uploaded.url;
    };
    const uploadedImage = await resolveUpload(product.image);
    const imagePayload = uploadedImage ? { imageUrl: uploadedImage } : null;
    const saved = isExistingServerListing
      ? await apiUpdateProduct(accessToken, product.id, {
          name: product.name,
          category: product.category,
          price: product.price,
          unit: product.unit,
          stock: product.stock,
          city,
          ...(product.description ? { description: product.description } : {}),
          ...(imagePayload ?? {}),
          ...(product.harvestDate ? { harvestDate: product.harvestDate } : {}),
          ...(product.shelfLifeDays ? { shelfLifeDays: product.shelfLifeDays } : {}),
        })
      : await apiCreateProduct(accessToken, {
          name: product.name,
          category: product.category,
          price: product.price,
          unit: product.unit,
          stock: product.stock,
          city,
          harvestDate: product.harvestDate ?? new Date().toISOString().slice(0, 10),
          description: product.description,
          imageUrl: imagePayload?.imageUrl ?? '',
          ...(product.shelfLifeDays ? { shelfLifeDays: product.shelfLifeDays } : {}),
        });
    // Preserve UI-only fields locally, keyed by the server id from the response.
    productOverlaysRef.current[saved.id] = {
      description: product.description,
      image: uploadedImage ?? product.image,
      rating: product.rating,
      isPopular: product.isPopular,
    };
    const mapped = apiProductToProduct(saved, productOverlaysRef.current[saved.id]);
    setFarmerListings((current) => {
      const exists = current.some((item) => item.id === mapped.id);
      return exists ? current.map((item) => (item.id === mapped.id ? mapped : item)) : [mapped, ...current];
    });
  };
  /**
   * Farmer-only server-backed removal via DELETE /products/:id. The listing is
   * dropped from local state only after the server confirms the deletion, so a
   * rejected removal (e.g. non-pending listing) leaves the list untouched.
   */
  const deleteProduct = async (productId: string): Promise<void> => {
    if (!accessToken || role !== 'farmer') {
      throw new Error('Connectez-vous en tant qu’agriculteur pour supprimer un produit.');
    }
    await apiDeleteProduct(accessToken, productId);
    delete productOverlaysRef.current[productId];
    setFarmerListings((current) => current.filter((product) => product.id !== productId));
  };
  /**
   * Server-backed order transition via PATCH /orders/:id/status. Buyers cancel
   * their own pending order; the owning farmer confirms then delivers. Local
   * order state is updated only from the server response (mapped status), so an
   * invalid transition rejected by the server never changes the UI optimistically.
   */
  const updateOrderStatus = async (orderId: string, status: Order['status']): Promise<void> => {
    if (!accessToken) {
      throw new Error('Connectez-vous pour mettre à jour une commande.');
    }
    const transition = localStatusToApiTransition[status];
    if (!transition) {
      throw new Error('Transition de commande non prise en charge.');
    }
    const updated = await apiUpdateOrderStatus(accessToken, orderId, transition);
    const mappedStatus = apiOrderStatusToLocal[updated.status] ?? status;
    setOrders((current) =>
      current.map((order) => (order.id === orderId ? { ...order, status: mappedStatus } : order)),
    );
  };

  // ── Real API auth functions ─────────────────────────────────────────────────

  const signIn = async (email: string, password: string): Promise<'buyer' | 'farmer'> => {
    const session = await apiLogin({ email, password });
    const serverRole = safeRole(session.account.role);
     await persistToken(session.accessToken);
     setAccessTokenState(session.accessToken);
     setUserIdState(session.account.id);
     setProfile((current) => accountToProfile(session.account, current));
     setRoleState(serverRole);
     // Fresh session — start from server truth, drop any prior farmer listings.
     setFarmerListings([]);
     setRecommendations([]);
     await loadServerData(session.accessToken, session.account);
     return serverRole;
   };

  const registerAccount = async (params: {
    name: string;
    email: string;
    password: string;
    phone: string;
    city: string;
    role: 'buyer' | 'farmer';
  }): Promise<'buyer' | 'farmer'> => {
    const session = await apiRegister(params);
    const serverRole = safeRole(session.account.role);
     await persistToken(session.accessToken);
     setAccessTokenState(session.accessToken);
     setUserIdState(session.account.id);
     setProfile((current) => accountToProfile(session.account, current));
     setRoleState(serverRole);
    // Fresh account — start from server truth (empty catalog/orders).
    setFarmerListings([]);
    setRecommendations([]);
    await loadServerData(session.accessToken, session.account);
    return serverRole;
  };

  const signOut = async (): Promise<void> => {
    if (accessToken) {
      try {
        await apiLogout(accessToken);
      } catch {
        // Best-effort server logout — still clear locally
      }
    }
    await persistToken(null);
    setAccessTokenState(null);
    setUserIdState(null);
    setRoleState(null);
    // Drop authenticated server state; guests reload the public server catalog.
    setFarmerListings([]);
    setServerCatalog([]);
    setOrders([]);
    setCart([]);
    productOverlaysRef.current = {};
  };

  const saveInterests = async (interests: string[]): Promise<void> => {
    if (!accessToken) {
      // Guest/unauthenticated: update locally only
      updateProfile({ interests });
      return;
    }
    const result = await apiSaveInterests(accessToken, interests);
    updateProfile({ interests: result.interests });
  };

  const recordInteraction = async (productId: string, type: 'view' | 'search' | 'purchase'): Promise<void> => {
    if (!accessToken || role !== 'buyer') return;
    await apiRecordInteraction(accessToken, { productId, type });
  };

  /**
   * Products exposed to the UI:
   * - guests browse the public server catalog;
   * - authenticated buyers see the server published catalog only;
   * - authenticated farmers see their own listings (pending/published/removed)
   *   merged with the server published catalog, de-duplicated by id.
   */
  const products = useMemo<Product[]>(() => {
    if (role === 'farmer') {
      const ownIds = new Set(farmerListings.map((item) => item.id));
      return [...farmerListings, ...serverCatalog.filter((item) => !ownIds.has(item.id))];
    }
    return serverCatalog;
  }, [role, farmerListings, serverCatalog]);

  const resolvedDailyOffers = useMemo<DailyOffer[]>(() => {
    if (!accessToken) return [];

    return serverCatalog
      .filter((product) => product.stock > 0)
      .slice(0, 3)
      .map((product, index) => ({
        id: `server-offer-${product.id}`,
        productId: product.id,
        label: index === 0 ? 'OFFRE DU JOUR' : 'BON PLAN LOCAL',
        availability: `Stock limité · ${product.location}`,
        expiresAt: 'Aujourd\u2019hui',
      }));
  }, [accessToken, serverCatalog]);

  const value = useMemo(
    () => ({
      hydrated,
      accessToken,
      userId,
      hasSeenOnboarding,
      role,
      themeMode,
      language,
      profile,
      paymentMethods,
      selectedPaymentMethodId,
      dailyOffers: resolvedDailyOffers,
      categories: categoryOptions,
      products,
      cart,
      orders,
      farmerListings,
      recommendations,
      setHasSeenOnboarding,
      setRole,
      setThemeMode,
      setLanguage,
      updateProfile,
      addPaymentMethod,
      selectPaymentMethod,
      addToCart,
      updateCartQuantity,
      removeFromCart,
      clearCart,
      createOrder,
      saveProduct,
      deleteProduct,
      updateOrderStatus,
      notificationsEnabled,
      updateNotificationPreferences,
      refreshNotifications,
      refreshOrders,
      refreshFarmerListings,
      notifications,
      cartCount: cart.reduce((sum, line) => sum + line.quantity, 0),
      cartTotal: cart.reduce((sum, line) => sum + line.product.price * line.quantity, 0),
      signIn,
      registerAccount,
      signOut,
      saveInterests,
      recordInteraction,
    }),
    [accessToken, userId, cart, categoryOptions, farmerListings, hasSeenOnboarding, hydrated, language, notifications, notificationsEnabled, orders, paymentMethods, products, profile, recommendations, role, selectedPaymentMethodId, serverCatalog, themeMode, resolvedDailyOffers],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside AppProvider');
  return context;
}
