import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Check,
  Mail,
  MessageCircle,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Truck,
  X,
} from 'lucide-react';
import { AdminPanelModal } from './components/AdminPanelModal';
import { CartDrawer } from './components/CartDrawer';
import { CrownMark, Navbar } from './components/Navbar';
import { ProductDetailModal } from './components/ProductDetailModal';
import { WatchCard } from './components/WatchCard';
import { WatchImage } from './components/WatchImage';
import { WishlistDrawer } from './components/WishlistDrawer';
import {
  CartItem,
  OrderRecord,
  StoreSettings,
  WATCH_CATEGORIES,
  WatchCategory,
  WatchProduct,
} from './types';
import {
  loadCart,
  loadOrders,
  loadSettings,
  loadWatches,
  loadWishlist,
  resetDefaultWatches,
  saveCart,
  saveNewsletterSubscriber,
  saveOrder,
  saveSettings,
  saveWatches,
  saveWishlist,
} from './utils/storage';
import { buildWhatsAppUrl, formatCurrency } from './utils/whatsapp';

type ShowcaseTab = 'all' | 'featured' | 'bestseller' | 'new' | 'offer';
type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'popular' | 'newest';

const HERO_IMAGE = '/src/assets/images/hero_luxury_chronograph_1795087189730.jpg';

const TESTIMONIALS = [
  {
    name: 'Kamran Siddiqui',
    role: 'Managing Partner, Crescent Capital · Lahore',
    piece: 'Cosmograph Perpetual Open-Balance',
    quote:
      'Placed the order on WhatsApp in under two minutes and received a macro wrist-roll video of my exact serial number before courier dispatch. Arrived insured the next afternoon.',
  },
  {
    name: 'Sana Mir',
    role: 'Architectural Director · Islamabad',
    piece: 'Lady-Datejust Pearl Milanese',
    quote:
      'I wanted a slim mother-of-pearl dress watch for an anniversary dinner. The ROLEX concierge confirmed wrist sizing over WhatsApp and adjusted the Milanese clasp prior to shipping.',
  },
  {
    name: 'Danial Qureshi',
    role: 'Commercial Aviator · Karachi',
    piece: 'Submariner 300M Emerald Diver',
    quote:
      'Zero friction checkout and transparent pricing. The emerald Cerachrom bezel catches daylight cleanly, and it is keeping +2 seconds per day accuracy after four months.',
  },
];

export default function App() {
  const [watches, setWatches] = useState<WatchProduct[]>(() => loadWatches());
  const [cart, setCart] = useState<CartItem[]>(() => loadCart());
  const [wishlist, setWishlist] = useState<string[]>(() => loadWishlist());
  const [settings, setSettings] = useState<StoreSettings>(() => loadSettings());
  const [orders, setOrders] = useState<OrderRecord[]>(() => loadOrders());

  // Catalog Filters
  const [showcaseTab, setShowcaseTab] = useState<ShowcaseTab>('all');
  const [selectedCategory, setSelectedCategory] = useState<WatchCategory | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('featured');

  // Overlays & Modals
  const [selectedWatch, setSelectedWatch] = useState<WatchProduct | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartInitialStep, setCartInitialStep] = useState<'bag' | 'checkout'>('bag');
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);

  // Toast & Newsletter
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterState, setNewsletterState] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    saveWatches(watches);
  }, [watches]);

  useEffect(() => {
    saveCart(cart);
  }, [cart]);

  useEffect(() => {
    saveWishlist(wishlist);
  }, [wishlist]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    const brandName = (settings.businessName || 'ROLEX').trim();
    document.title = `${brandName} — Perpetual Luxury Timepieces`;
  }, [settings.businessName]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const notify = (msg: string) => {
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    setToastMessage(msg);
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, 2600);
  };

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const wishlistedWatches = useMemo(
    () => watches.filter((w) => wishlist.includes(w.id)),
    [watches, wishlist]
  );

  const filteredWatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const parsedMin = minPrice !== '' ? Number(minPrice) : 0;
    const parsedMax = maxPrice !== '' ? Number(maxPrice) : Infinity;
    const min = Number.isFinite(parsedMin) && parsedMin > 0 ? parsedMin : 0;
    const max = Number.isFinite(parsedMax) && parsedMax >= 0 ? parsedMax : Infinity;

    const list = watches.filter((watch) => {
      if (showcaseTab !== 'all' && !watch.tags.includes(showcaseTab)) {
        return false;
      }
      if (selectedCategory !== 'All' && watch.category !== selectedCategory) {
        return false;
      }
      if (q) {
        const matchesQuery =
          watch.name.toLowerCase().includes(q) ||
          watch.brand.toLowerCase().includes(q) ||
          watch.category.toLowerCase().includes(q) ||
          watch.reference.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }
      if (watch.discountedPrice < min || watch.discountedPrice > max) {
        return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'price-asc') return a.discountedPrice - b.discountedPrice;
      if (sortBy === 'price-desc') return b.discountedPrice - a.discountedPrice;
      if (sortBy === 'popular') return b.popularity - a.popularity;
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      const aFeat = a.tags.includes('featured') ? 1 : 0;
      const bFeat = b.tags.includes('featured') ? 1 : 0;
      if (aFeat !== bFeat) return bFeat - aFeat;
      return b.popularity - a.popularity;
    });
  }, [watches, showcaseTab, selectedCategory, searchQuery, minPrice, maxPrice, sortBy]);

  const hasActiveFilters =
    showcaseTab !== 'all' ||
    selectedCategory !== 'All' ||
    searchQuery.trim() !== '' ||
    minPrice !== '' ||
    maxPrice !== '' ||
    sortBy !== 'featured';

  const resetFilters = () => {
    setShowcaseTab('all');
    setSelectedCategory('All');
    setSearchQuery('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('featured');
  };

  // Cart & Wishlist Handlers
  const handleAddToCart = (watch: WatchProduct, colorName?: string, quantity = 1) => {
    const chosenColor = colorName || watch.colors[0]?.name || 'Standard Edition';
    const maxAllowed = Math.max(1, watch.stockCount);
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.watchId === watch.id && item.colorName === chosenColor
      );
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: Math.min(maxAllowed, updated[existingIndex].quantity + quantity),
        };
        return updated;
      }
      return [
        ...prev,
        { watchId: watch.id, colorName: chosenColor, quantity: Math.min(maxAllowed, quantity) },
      ];
    });
    notify(`Added ${watch.name} to bag`);
  };

  const handleBuyNow = (watch: WatchProduct, colorName?: string, quantity = 1) => {
    const chosenColor = colorName || watch.colors[0]?.name || 'Standard Edition';
    const maxAllowed = Math.max(1, watch.stockCount);
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.watchId === watch.id && item.colorName === chosenColor
      );
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: Math.min(maxAllowed, Math.max(updated[existingIndex].quantity, quantity)),
        };
        return updated;
      }
      return [
        ...prev,
        { watchId: watch.id, colorName: chosenColor, quantity: Math.min(maxAllowed, quantity) },
      ];
    });
    setSelectedWatch(null);
    setCartInitialStep('checkout');
    setCartOpen(true);
  };

  const handleUpdateCartQty = (watchId: string, colorName: string, delta: number) => {
    const watch = watches.find((w) => w.id === watchId);
    const maxAllowed = watch ? Math.max(1, watch.stockCount) : 99;
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.watchId === watchId && item.colorName === colorName) {
            return { ...item, quantity: Math.min(maxAllowed, item.quantity + delta) };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveCartItem = (watchId: string, colorName: string) => {
    setCart((prev) =>
      prev.filter((item) => !(item.watchId === watchId && item.colorName === colorName))
    );
  };

  const handleToggleWishlist = (watchId: string) => {
    setWishlist((prev) => {
      const exists = prev.includes(watchId);
      const next = exists ? prev.filter((id) => id !== watchId) : [...prev, watchId];
      notify(exists ? 'Removed from wishlist' : 'Saved to wishlist');
      return next;
    });
  };

  const handleMoveWishlistToCart = (watch: WatchProduct) => {
    handleAddToCart(watch, watch.colors[0]?.name);
    setWishlistOpen(false);
    setCartInitialStep('bag');
    setCartOpen(true);
  };

  // Admin CRUD Handlers
  const handleSaveWatch = (saved: WatchProduct) => {
    setWatches((prev) => {
      const exists = prev.some((w) => w.id === saved.id);
      if (exists) {
        return prev.map((w) => (w.id === saved.id ? saved : w));
      }
      return [saved, ...prev];
    });
  };

  const handleDeleteWatch = (watchId: string) => {
    setWatches((prev) => prev.filter((w) => w.id !== watchId));
    setCart((prev) => prev.filter((c) => c.watchId !== watchId));
    setWishlist((prev) => prev.filter((id) => id !== watchId));
  };

  const handleResetCatalog = () => {
    const defaults = resetDefaultWatches();
    setWatches(defaults);
  };

  const handleOrderRecorded = (order: OrderRecord) => {
    const updated = saveOrder(order);
    setOrders(updated);
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newsletterEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setNewsletterState({
        type: 'error',
        message: 'Please enter a valid email address.',
      });
      return;
    }
    const added = saveNewsletterSubscriber(trimmed);
    setNewsletterEmail('');
    setNewsletterState({
      type: 'success',
      message: added
        ? 'Subscribed to ROLEX Private Dispatches.'
        : 'This address is already subscribed to our dispatch list.',
    });
  };

  const jumpToCollection = (tab: ShowcaseTab, category: WatchCategory | 'All' = 'All') => {
    setShowcaseTab(tab);
    setSelectedCategory(category);
    const el = document.getElementById('collection');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const brandNameUpper = (settings.businessName || 'ROLEX').trim().toUpperCase();

  return (
    <div id="top" className="min-h-screen flex flex-col bg-[#000000] text-[#FFFFFF] overflow-x-hidden">
      {/* Top Bar */}
      <Navbar
        businessName={settings.businessName}
        cartCount={cartCount}
        wishlistCount={wishlist.length}
        onOpenCart={() => {
          setCartInitialStep('bag');
          setCartOpen(true);
        }}
        onOpenWishlist={() => setWishlistOpen(true)}
        onOpenAdmin={() => setAdminOpen(true)}
        onSelectShowcase={(tab) => jumpToCollection(tab, 'All')}
      />

      {/* Floating Feedback Toast */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 px-4 py-3 bg-[#1C1C1C] text-[#FFFFFF] text-xs font-medium rounded-sm shadow-2xl border border-[#C9A227]/60"
        >
          <Check className="w-4 h-4 text-[#C9A227] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="flex-1">
        {/* SECTION 1: Storefront Hero */}
        <section className="bg-[#000000] text-[#FFFFFF] border-b border-[#333333]">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 items-stretch">
            {/* Hero Copy */}
            <div className="lg:col-span-6 px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-24 flex flex-col justify-center">
              <p className="text-xs uppercase tracking-[0.22em] text-[#C9A227] font-semibold">
                {brandNameUpper} · Perpetual Horology
              </p>
              <h1 className="mt-4 font-display text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.06] text-balance max-w-xl text-[#FFFFFF]">
                Perpetual Precision in Obsidian &amp; Gold
              </h1>
              <p className="mt-5 text-base text-[#B3B3B3] leading-relaxed max-w-lg">
                Explore authentic Swiss-grade chronographs, ultra-thin dress pieces, ceramic divers,
                and titanium smartwatches—personally verified via WhatsApp concierge prior to
                insured dispatch.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => jumpToCollection('all')}
                  className="inline-flex items-center gap-2.5 px-6 min-h-[46px] text-sm font-semibold bg-[#C9A227] text-[#000000] hover:bg-[#D9B43A] transition-colors rounded-sm cursor-pointer whitespace-nowrap"
                >
                  <span>Shop Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => jumpToCollection('offer')}
                  className="inline-flex items-center gap-2 px-5 min-h-[46px] text-sm font-medium border border-[#333333] bg-[#121212] text-[#FFFFFF] hover:border-[#C9A227] hover:text-[#C9A227] transition-colors rounded-sm cursor-pointer whitespace-nowrap"
                >
                  <span>View Seasonal Offers</span>
                </button>
              </div>
            </div>

            {/* Hero Macro Studio Image */}
            <div className="lg:col-span-6 relative min-h-[280px] sm:min-h-[380px] lg:min-h-[520px] bg-[#121212]">
              <WatchImage
                src={HERO_IMAGE}
                alt="ROLEX Cosmograph Perpetual Gold Chronograph on dark basalt stone"
                priority
                className="w-full h-full lg:absolute lg:inset-0 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />
              <div className="absolute bottom-5 left-5 right-5 sm:bottom-6 sm:left-6 sm:right-6 flex items-end justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-mono text-[11px] tracking-wider text-[#C9A227]">
                    REF. RLX-116508 · FEATURED FLAGSHIP
                  </p>
                  <p className="font-display text-xl sm:text-2xl font-semibold text-[#FFFFFF] truncate">
                    Cosmograph Perpetual Open-Balance
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const flagship = watches[0];
                    if (flagship) setSelectedWatch(flagship);
                  }}
                  className="px-4 min-h-[40px] text-xs font-medium bg-[#121212]/90 backdrop-blur-md text-[#FFFFFF] border border-[#333333] hover:border-[#C9A227] hover:text-[#C9A227] transition-colors rounded-sm whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Inspect Piece
                </button>
              </div>
            </div>
          </div>

          {/* Quiet Value Strip */}
          <div className="border-t border-[#333333] bg-[#121212]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[#B3B3B3]">
              <div className="flex items-center gap-2.5">
                <MessageCircle className="w-4 h-4 text-[#C9A227] shrink-0" />
                <span>Direct WhatsApp concierge verification on every order</span>
              </div>
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#C9A227] shrink-0" />
                <span>5-year international perpetual warranty &amp; certificate</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Truck className="w-4 h-4 text-[#C9A227] shrink-0" />
                <span className="tabular-nums">
                  Complimentary insured shipping above{' '}
                  {formatCurrency(settings.freeShippingThreshold, settings.currencySymbol)}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: Curated Collections, Categories & Interactive Catalog */}
        <section id="collection" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
          {/* Header & Collection Showcase Tabs */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-[#333333]">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#C9A227] font-semibold">
                {brandNameUpper} Collection
              </p>
              <h2 className="mt-2 font-display text-3xl sm:text-4xl font-semibold text-[#FFFFFF] text-balance">
                Timepieces Across Seven Signatures
              </h2>
            </div>

            {/* Collection Filter Tabs */}
            <div
              role="tablist"
              aria-label="Collection showcases"
              className="flex items-center gap-1 p-1 bg-[#121212] border border-[#333333] rounded-sm overflow-x-auto"
            >
              {[
                { id: 'all', label: 'All Watches' },
                { id: 'featured', label: 'Featured' },
                { id: 'bestseller', label: 'Best Sellers' },
                { id: 'new', label: 'New Arrivals' },
                { id: 'offer', label: 'Special Offers' },
              ].map((tab) => {
                const active = showcaseTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    role="tab"
                    aria-selected={active}
                    type="button"
                    onClick={() => setShowcaseTab(tab.id as ShowcaseTab)}
                    className={`px-3.5 py-2 min-h-[38px] text-xs font-medium rounded-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'bg-[#C9A227] text-[#000000] font-semibold'
                        : 'text-[#B3B3B3] hover:text-[#FFFFFF]'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category Filter Bar (All 7 Required Categories) */}
          <div className="py-5 border-b border-[#333333] flex items-center gap-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => setSelectedCategory('All')}
              className={`px-3.5 min-h-[38px] text-xs font-medium rounded-sm border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedCategory === 'All'
                  ? 'bg-[#C9A227] text-[#000000] border-[#C9A227] font-semibold'
                  : 'bg-[#1C1C1C] text-[#B3B3B3] border-[#333333] hover:border-[#C9A227] hover:text-[#FFFFFF]'
              }`}
            >
              All Categories
            </button>
            {WATCH_CATEGORIES.map((category) => {
              const active = selectedCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3.5 min-h-[38px] text-xs font-medium rounded-sm border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-[#C9A227] text-[#000000] border-[#C9A227] font-semibold'
                      : 'bg-[#1C1C1C] text-[#B3B3B3] border-[#333333] hover:border-[#C9A227] hover:text-[#FFFFFF]'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>

          {/* Search, Price Range & Sort Toolbar */}
          <div className="py-5 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            <div className="md:col-span-5 relative">
              <Search className="w-4 h-4 text-[#B3B3B3] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                aria-label="Search watches by name or brand"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search watches by name, brand, or reference..."
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#121212] text-[#FFFFFF] placeholder:text-[#737373] border border-[#333333] rounded-sm focus:outline-none focus:ring-1 focus:ring-[#C9A227]"
              />
            </div>

            <div className="md:col-span-4 flex items-center gap-2">
              <div className="flex-1">
                <input
                  type="number"
                  min={0}
                  aria-label="Minimum price"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder={`Min (${settings.currencySymbol})`}
                  className="w-full px-3 py-2.5 text-sm tabular-nums bg-[#121212] text-[#FFFFFF] placeholder:text-[#737373] border border-[#333333] rounded-sm focus:outline-none focus:ring-1 focus:ring-[#C9A227]"
                />
              </div>
              <span className="text-[#B3B3B3] text-xs shrink-0">to</span>
              <div className="flex-1">
                <input
                  type="number"
                  min={0}
                  aria-label="Maximum price"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder={`Max (${settings.currencySymbol})`}
                  className="w-full px-3 py-2.5 text-sm tabular-nums bg-[#121212] text-[#FFFFFF] placeholder:text-[#737373] border border-[#333333] rounded-sm focus:outline-none focus:ring-1 focus:ring-[#C9A227]"
                />
              </div>
            </div>

            <div className="md:col-span-3 flex items-center gap-2">
              <div className="relative flex-1">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#B3B3B3] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  aria-label="Sort watches"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="w-full pl-8 pr-3 py-2.5 text-sm bg-[#121212] text-[#FFFFFF] border border-[#333333] rounded-sm focus:outline-none focus:ring-1 focus:ring-[#C9A227] cursor-pointer"
                >
                  <option value="featured">Sort: Featured</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="popular">Most Popular</option>
                  <option value="newest">Newest Arrivals</option>
                </select>
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  aria-label="Clear all filters"
                  className="px-3 py-2.5 text-xs font-medium text-[#B3B3B3] hover:text-[#FFFFFF] border border-[#333333] bg-[#1C1C1C] hover:border-[#C9A227] rounded-sm shrink-0 cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Result Count */}
          <div className="mb-6 flex items-center justify-between text-xs text-[#B3B3B3]">
            <span className="tabular-nums">
              Showing {filteredWatches.length} of {watches.length} timepieces
            </span>
            {selectedCategory !== 'All' && (
              <button
                type="button"
                onClick={() => setSelectedCategory('All')}
                className="inline-flex items-center gap-1 text-[#C9A227] hover:text-[#FFFFFF] cursor-pointer"
              >
                <span>{selectedCategory}</span>
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* 3-Column Product Grid */}
          {filteredWatches.length === 0 ? (
            <div className="py-16 px-6 bg-[#1C1C1C] border border-[#333333] rounded-sm text-center">
              <p className="font-display text-2xl text-[#FFFFFF]">
                No timepieces match your current filters
              </p>
              <p className="mt-2 text-sm text-[#B3B3B3]">
                Try broadening your price ceiling or clearing the category filter.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-5 px-5 min-h-[42px] text-xs font-semibold bg-[#C9A227] text-[#000000] hover:bg-[#D9B43A] rounded-sm cursor-pointer"
              >
                Show All Watches
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
              {filteredWatches.map((watch) => (
                <WatchCard
                  key={watch.id}
                  watch={watch}
                  currencySymbol={settings.currencySymbol}
                  isWishlisted={wishlist.includes(watch.id)}
                  onToggleWishlist={handleToggleWishlist}
                  onAddToCart={(w) => handleAddToCart(w)}
                  onBuyNow={(w) => handleBuyNow(w)}
                  onSelectWatch={(w) => setSelectedWatch(w)}
                />
              ))}
            </div>
          )}
        </section>

        {/* SECTION 3: Client Testimonials & Private Dispatch Newsletter */}
        <section
          id="testimonials"
          className="bg-[#121212] border-t border-b border-[#333333] py-14 sm:py-20"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#C9A227] font-semibold">
                  Verified Collectors
                </p>
                <h2 className="mt-2 font-display text-3xl sm:text-4xl font-semibold text-[#FFFFFF] text-balance">
                  Trusted by {brandNameUpper} Collectors Nationwide
                </h2>
              </div>
              <p className="text-sm text-[#B3B3B3] max-w-md">
                Every timepiece is pressure-tested, photographed for serial confirmation over
                WhatsApp, and dispatched in sealed presentation boxes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {TESTIMONIALS.map((item) => (
                <blockquote
                  key={item.name}
                  className="bg-[#1C1C1C] border border-[#333333] rounded-sm p-6 flex flex-col justify-between gap-5"
                >
                  <p className="text-sm text-[#FFFFFF]/90 leading-relaxed">“{item.quote}”</p>
                  <footer className="pt-4 border-t border-[#333333]">
                    <p className="text-sm font-semibold text-[#FFFFFF]">{item.name}</p>
                    <p className="text-xs text-[#B3B3B3] mt-0.5">{item.role}</p>
                    <p className="text-[11px] font-mono text-[#C9A227] mt-1">{item.piece}</p>
                  </footer>
                </blockquote>
              ))}
            </div>

            {/* Newsletter Subscription */}
            <div className="bg-[#1C1C1C] border border-[#333333] rounded-sm p-6 sm:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="max-w-xl">
                <p className="text-xs uppercase tracking-[0.2em] text-[#C9A227] font-semibold">
                  Private Dispatch
                </p>
                <h3 className="mt-1.5 font-display text-2xl sm:text-3xl font-semibold text-[#FFFFFF]">
                  Receive Limited-Edition Releases &amp; Seasonal Offers
                </h3>
                <p className="mt-1.5 text-sm text-[#B3B3B3]">
                  Occasional invitations for new mechanical arrivals and collector-only pricing.
                </p>
              </div>

              <form onSubmit={handleNewsletterSubmit} className="w-full lg:max-w-md space-y-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Mail className="w-4 h-4 text-[#B3B3B3] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      aria-label="Email address for newsletter"
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      placeholder="collector@domain.com"
                      className="w-full pl-10 pr-4 py-3 text-sm bg-[#000000] text-[#FFFFFF] placeholder:text-[#737373] border border-[#333333] rounded-sm focus:outline-none focus:ring-1 focus:ring-[#C9A227]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-6 min-h-[46px] text-xs font-semibold uppercase tracking-wider bg-[#C9A227] text-[#000000] hover:bg-[#D9B43A] transition-colors rounded-sm whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Subscribe
                  </button>
                </div>
                {newsletterState && (
                  <p
                    className={`text-xs ${
                      newsletterState.type === 'success' ? 'text-[#C9A227]' : 'text-[#F87171]'
                    }`}
                  >
                    {newsletterState.message}
                  </p>
                )}
              </form>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#000000] text-[#B3B3B3] py-14 border-t border-[#333333]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-12 gap-10 pb-10 border-b border-[#333333]">
          <div className="md:col-span-4 space-y-3">
            <div className="inline-flex items-center gap-2.5 font-display text-2xl font-semibold tracking-[0.14em] text-[#FFFFFF]">
              <CrownMark className="w-5 h-5 text-[#C9A227]" />
              <span>{brandNameUpper}</span>
            </div>
            <p className="text-sm text-[#B3B3B3] leading-relaxed max-w-sm">
              Luxury horological boutique curating perpetual mechanical, formal, sports, and smart
              timepieces with personal WhatsApp concierge ordering.
            </p>
            <a
              href={buildWhatsAppUrl(
                settings.whatsappNumber,
                `Hello ${settings.businessName}, I would like assistance choosing a watch.`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-medium text-[#C9A227] hover:text-[#FFFFFF] transition-colors pt-1"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chat with WhatsApp Concierge</span>
            </a>
          </div>

          <div className="md:col-span-4 space-y-3">
            <h4 className="font-sans text-xs uppercase tracking-wider font-semibold text-[#FFFFFF]">
              Watch Categories
            </h4>
            <ul className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-xs">
              {WATCH_CATEGORIES.map((category) => (
                <li key={category}>
                  <button
                    type="button"
                    onClick={() => jumpToCollection('all', category)}
                    className="hover:text-[#C9A227] transition-colors text-left cursor-pointer"
                  >
                    {category}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-4 space-y-3">
            <h4 className="font-sans text-xs uppercase tracking-wider font-semibold text-[#FFFFFF]">
              Concierge &amp; Atelier
            </h4>
            <div className="space-y-1.5 text-xs text-[#B3B3B3]">
              <p>{settings.storeAddress}</p>
              <p>Email: {settings.supportEmail}</p>
              <p className="font-mono text-[#FFFFFF]">WhatsApp: +{settings.whatsappNumber}</p>
            </div>
            <div className="pt-2 flex items-center gap-4 text-xs">
              <button
                type="button"
                onClick={() => setAdminOpen(true)}
                className="text-[#C9A227] hover:text-[#FFFFFF] underline cursor-pointer"
              >
                Manage Inventory
              </button>
              <button
                type="button"
                onClick={() => setWishlistOpen(true)}
                className="text-[#FFFFFF] hover:text-[#C9A227] underline cursor-pointer"
              >
                Saved Wishlist
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#B3B3B3]">
          <p>
            © {new Date().getFullYear()} {brandNameUpper}. All rights reserved.
          </p>
          <p>Insured Express Delivery · 5-Year Perpetual Warranty</p>
        </div>
      </footer>

      {/* Product Detail Modal */}
      <ProductDetailModal
        watch={selectedWatch}
        currencySymbol={settings.currencySymbol}
        isWishlisted={selectedWatch ? wishlist.includes(selectedWatch.id) : false}
        onClose={() => setSelectedWatch(null)}
        onToggleWishlist={handleToggleWishlist}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
      />

      {/* Shopping Bag & WhatsApp Checkout Drawer */}
      <CartDrawer
        isOpen={cartOpen}
        initialStep={cartInitialStep}
        cart={cart}
        watches={watches}
        settings={settings}
        onClose={() => setCartOpen(false)}
        onUpdateQty={handleUpdateCartQty}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={() => setCart([])}
        onOrderRecorded={handleOrderRecorded}
      />

      {/* Wishlist Drawer */}
      <WishlistDrawer
        isOpen={wishlistOpen}
        watches={wishlistedWatches}
        currencySymbol={settings.currencySymbol}
        onClose={() => setWishlistOpen(false)}
        onRemove={handleToggleWishlist}
        onMoveToCart={handleMoveWishlistToCart}
        onSelectWatch={(w) => setSelectedWatch(w)}
      />

      {/* Admin & Product CRUD Management Modal */}
      <AdminPanelModal
        isOpen={adminOpen}
        watches={watches}
        settings={settings}
        orders={orders}
        onClose={() => setAdminOpen(false)}
        onSaveWatch={handleSaveWatch}
        onDeleteWatch={handleDeleteWatch}
        onResetCatalog={handleResetCatalog}
        onSaveSettings={setSettings}
      />
    </div>
  );
}
