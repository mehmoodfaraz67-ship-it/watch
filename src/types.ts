export type WatchCategory =
  | "Men's Watches"
  | "Women's Watches"
  | "Luxury Watches"
  | "Smart Watches"
  | "Sports Watches"
  | "Casual Watches"
  | "Formal Watches";

export const WATCH_CATEGORIES: WatchCategory[] = [
  "Men's Watches",
  "Women's Watches",
  "Luxury Watches",
  "Smart Watches",
  "Sports Watches",
  "Casual Watches",
  "Formal Watches",
];

export type CollectionTag = 'featured' | 'bestseller' | 'new' | 'offer';

export type StockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock';

export interface WatchColorOption {
  name: string;
  hex: string;
}

export interface WatchSpecs {
  movement: string;
  caseDiameter: string;
  waterResistance: string;
  crystal: string;
  strap: string;
}

export interface WatchProduct {
  id: string;
  reference: string;
  name: string;
  brand: string;
  category: WatchCategory;
  originalPrice: number;
  discountedPrice: number;
  description: string;
  image: string;
  colors: WatchColorOption[];
  specifications: WatchSpecs;
  stockStatus: StockStatus;
  stockCount: number;
  tags: CollectionTag[];
  popularity: number;
  createdAt: string;
}

export interface CartItem {
  watchId: string;
  colorName: string;
  quantity: number;
}

export interface CustomerDetails {
  name: string;
  phone: string;
  address: string;
  note?: string;
}

export interface StoreSettings {
  businessName: string;
  whatsappNumber: string;
  currencySymbol: string;
  freeShippingThreshold: number;
  supportEmail: string;
  storeAddress: string;
}

export interface OrderRecord {
  id: string;
  createdAt: string;
  customer: CustomerDetails;
  items: {
    watchId: string;
    name: string;
    brand: string;
    colorName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[];
  totalAmount: number;
  whatsappUrl: string;
  messagePreview: string;
}
