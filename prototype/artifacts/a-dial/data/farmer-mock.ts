export interface Product {
  id: number;
  name: string;
  category: string;
  qty: number;
  unit: string;
  price: number;
  status: "Disponible" | "Stock faible" | "Épuisé";
  emoji: string;
  harvestDate: string;
  expDate: string;
  location: string;
  description: string;
}

export interface Order {
  id: string;
  customer: string;
  initials: string;
  product: string;
  qty: string;
  total: number;
  status: "En attente" | "Confirmée" | "Livrée" | "Annulée";
  address: string;
  deliveryDate: string;
  phone: string;
}

export interface MessageType {
  id: number;
  from: "me" | "them";
  text: string;
  time: string;
}

export interface Conversation {
  id: number;
  name: string;
  initials: string;
  lastMsg: string;
  time: string;
  unread: number;
  product?: string;
  messages: MessageType[];
}

export interface Notification {
  id: number;
  type: string;
  icon: any;
  iconColor: string;
  iconBg: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
}

export const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Tomates",
    category: "Légumes",
    qty: 50,
    unit: "kg",
    price: 1500,
    status: "Disponible",
    emoji: "🍅",
    harvestDate: "2026-07-20",
    expDate: "2026-08-05",
    location: "Kindia",
    description: "Tomates fraîches cultivées localement, idéales pour les sauces.",
  },
  {
    id: 2,
    name: "Mangues",
    category: "Fruits",
    qty: 3,
    unit: "kg",
    price: 2000,
    status: "Stock faible",
    emoji: "🥭",
    harvestDate: "2026-07-18",
    expDate: "2026-08-02",
    location: "Kindia",
    description: "Mangues juteuses et sucrées de la saison.",
  },
  {
    id: 3,
    name: "Oignons",
    category: "Légumes",
    qty: 0,
    unit: "kg",
    price: 900,
    status: "Épuisé",
    emoji: "🧅",
    harvestDate: "2026-07-10",
    expDate: "2026-08-15",
    location: "Kindia",
    description: "Oignons blancs de qualité supérieure.",
  },
  {
    id: 4,
    name: "Pommes de terre",
    category: "Légumes",
    qty: 80,
    unit: "kg",
    price: 800,
    status: "Disponible",
    emoji: "🥔",
    harvestDate: "2026-07-22",
    expDate: "2026-09-01",
    location: "Mamou",
    description: "Pommes de terre fermes et savoureuses.",
  },
  {
    id: 5,
    name: "Bananes plantain",
    category: "Fruits",
    qty: 12,
    unit: "régimes",
    price: 5000,
    status: "Disponible",
    emoji: "🍌",
    harvestDate: "2026-07-25",
    expDate: "2026-08-10",
    location: "Kindia",
    description: "Bananes plantain vertes, parfaites pour le plantain frit.",
  },
];

export const ORDERS: Order[] = [
  {
    id: "#1048",
    customer: "Aïssatou Camara",
    initials: "AC",
    product: "Pommes de terre",
    qty: "20 kg",
    total: 16000,
    status: "En attente",
    address: "Quartier Almamya, Conakry",
    deliveryDate: "2026-07-25",
    phone: "+224 620 00 01",
  },
  {
    id: "#1047",
    customer: "Ibrahima Sow",
    initials: "IS",
    product: "Tomates",
    qty: "5 kg",
    total: 7500,
    status: "Confirmée",
    address: "Koloma, Ratoma",
    deliveryDate: "2026-07-23",
    phone: "+224 622 11 22",
  },
  {
    id: "#1046",
    customer: "Mariama Baldé",
    initials: "MB",
    product: "Oignons",
    qty: "10 kg",
    total: 9000,
    status: "Livrée",
    address: "Hamdallaye",
    deliveryDate: "2026-07-20",
    phone: "+224 628 33 44",
  },
  {
    id: "#1045",
    customer: "Fatoumata Diallo",
    initials: "FD",
    product: "Tomates",
    qty: "10 kg",
    total: 15000,
    status: "En attente",
    address: "Dixinn",
    deliveryDate: "2026-07-26",
    phone: "+224 621 55 66",
  },
  {
    id: "#1044",
    customer: "Mamadou Barry",
    initials: "MB",
    product: "Bananes plantain",
    qty: "3 régimes",
    total: 15000,
    status: "Annulée",
    address: "Matoto",
    deliveryDate: "2026-07-18",
    phone: "+224 624 77 88",
  },
];

export const CONVERSATIONS: Conversation[] = [
  {
    id: 1,
    name: "Aïssatou Camara",
    initials: "AC",
    lastMsg: "Merci, je passerai récupérer demain.",
    time: "14:32",
    unread: 2,
    product: "Pommes de terre",
    messages: [
      { id: 1, from: "me", text: "Bonjour, vos pommes de terre sont disponibles.", time: "13:45" },
      { id: 2, from: "them", text: "Parfait ! Je peux passer demain ?", time: "14:10" },
      { id: 3, from: "me", text: "Oui, c'est possible entre 8h et 18h.", time: "14:15" },
      { id: 4, from: "them", text: "Merci, je passerai récupérer demain.", time: "14:32" },
      { id: 5, from: "me", text: "À demain !", time: "14:33" },
    ],
  },
  {
    id: 2,
    name: "Ibrahima Sow",
    initials: "IS",
    lastMsg: "D'accord, je commande 5kg.",
    time: "Hier",
    unread: 0,
    product: "Tomates",
    messages: [
      { id: 1, from: "them", text: "Bonjour, avez-vous des tomates ?", time: "Hier" },
      { id: 2, from: "me", text: "Oui, 50kg disponibles à 1500 FCFA/kg.", time: "Hier" },
      { id: 3, from: "them", text: "D'accord, je commande 5kg.", time: "Hier" },
    ],
  },
  {
    id: 3,
    name: "Mariama Baldé",
    initials: "MB",
    lastMsg: "La commande a été livrée.",
    time: "Hier",
    unread: 0,
    messages: [
      { id: 1, from: "me", text: "Votre commande est en route.", time: "Hier" },
      { id: 2, from: "them", text: "La commande a été livrée.", time: "Hier" },
    ],
  },
  {
    id: 4,
    name: "Mamadou Bah",
    initials: "MB2",
    lastMsg: "Avez-vous des oignons ?",
    time: "10:05",
    unread: 1,
    messages: [
      { id: 1, from: "them", text: "Avez-vous des oignons ?", time: "10:05" },
    ],
  },
];

export const NOTIFICATIONS: Notification[] = [
  {
    id: 1,
    type: "order",
    icon: "bag",
    iconColor: "#2E7D32",
    iconBg: "#E8F5E9",
    title: "Nouvelle commande reçue",
    body: "Fatoumata Diallo a commandé 10 kg de Tomates",
    time: "Il y a 5 min",
    unread: true,
  },
  {
    id: 2,
    type: "alert",
    icon: "alert",
    iconColor: "#F57F17",
    iconBg: "#FFF8E1",
    title: "Stock faible",
    body: "Vos Mangues ne sont plus qu'à 3 kg",
    time: "Il y a 1h",
    unread: true,
  },
  {
    id: 3,
    type: "delivery",
    icon: "checkmark-circle",
    iconColor: "#1565C0",
    iconBg: "#E3F2FD",
    title: "Commande livrée",
    body: "La commande #1042 a été marquée comme livrée",
    time: "Il y a 3h",
    unread: false,
  },
  {
    id: 4,
    type: "message",
    icon: "chatbubble",
    iconColor: "#6A1B9A",
    iconBg: "#F3E5F5",
    title: "Nouveau message",
    body: "Mamadou Bah : « Avez-vous encore des oignons ? »",
    time: "Hier",
    unread: false,
  },
  {
    id: 5,
    type: "promo",
    icon: "star",
    iconColor: "#F57F17",
    iconBg: "#FFF8E1",
    title: "Annonce promotionnelle",
    body: "0% de commission cette saison",
    time: "Hier",
    unread: false,
  },
];

export const MONTHLY_SALES = [
  { month: "Fév", value: 120000 },
  { month: "Mar", value: 180000 },
  { month: "Avr", value: 145000 },
  { month: "Mai", value: 210000 },
  { month: "Juin", value: 190000 },
  { month: "Juil", value: 248500 },
];

export const SALES_BY_PRODUCT = [
  { name: "Tomates", pct: 38, color: "#2E7D32" },
  { name: "P.de terre", pct: 24, color: "#43A047" },
  { name: "Mangues", pct: 15, color: "#F57F17" },
  { name: "Oignons", pct: 10, color: "#1565C0" },
  { name: "Plantain", pct: 8, color: "#6A1B9A" },
];

export const DASHBOARD_STATS = {
  activeProducts: 4,
  pendingOrders: 2,
  deliveredRevenue: 248500,
  deliveredOrders: 12,
};

export const PERFORMANCE = {
  rating: 4.8,
  loyalty: 73,
  delivery: 96,
};

export const FARMER = {
  name: "Mamadou Sylla",
  initials: "MS",
  farm: "Ferme Sylla & Fils",
  location: "Kindia, Guinée",
  phone: "+224 620 12 34 56",
  note: 4.8,
};

export const EMOJI_LIST = ["🍅", "🥭", "🧅", "🥔", "🍌", "🌽", "🥕", "🧄", "🍆", "🫑", "🥑", "🍋"];
