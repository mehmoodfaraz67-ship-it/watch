import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  ExternalLink,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { STUDIO_IMAGE_LIBRARY } from '../data/initialWatches';
import {
  CollectionTag,
  OrderRecord,
  StockStatus,
  StoreSettings,
  WATCH_CATEGORIES,
  WatchCategory,
  WatchProduct,
} from '../types';
import { buildWhatsAppUrl, formatCurrency, sanitizeWhatsAppNumber } from '../utils/whatsapp';
import { WatchImage } from './WatchImage';

interface AdminPanelModalProps {
  isOpen: boolean;
  watches: WatchProduct[];
  settings: StoreSettings;
  orders: OrderRecord[];
  onClose: () => void;
  onSaveWatch: (watch: WatchProduct) => void;
  onDeleteWatch: (watchId: string) => void;
  onResetCatalog: () => void;
  onSaveSettings: (settings: StoreSettings) => void;
}

const ALL_TAGS: { id: CollectionTag; label: string }[] = [
  { id: 'featured', label: 'Featured' },
  { id: 'bestseller', label: 'Best Seller' },
  { id: 'new', label: 'New Arrival' },
  { id: 'offer', label: 'Special Offer' },
];

const EMPTY_FORM = (): Omit<WatchProduct, 'id' | 'createdAt' | 'popularity'> => ({
  reference: `REF. RLX-${Math.floor(10000 + Math.random() * 89999)}`,
  name: '',
  brand: 'ROLEX',
  category: "Men's Watches",
  originalPrice: 25000,
  discountedPrice: 21500,
  description: '',
  image: STUDIO_IMAGE_LIBRARY[1].path,
  colors: [{ name: 'Obsidian / Oystersteel', hex: '#1F2937' }],
  specifications: {
    movement: 'Perpetual Automatic Chronometer',
    caseDiameter: '40 mm · Oystersteel',
    waterResistance: '100m / 10 ATM',
    crystal: 'Anti-reflective sapphire',
    strap: 'Oyster solid-link bracelet',
  },
  stockStatus: 'In Stock',
  stockCount: 10,
  tags: ['featured', 'new'],
});

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  watches,
  settings,
  orders,
  onClose,
  onSaveWatch,
  onDeleteWatch,
  onResetCatalog,
  onSaveSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'settings' | 'orders'>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingWatchId, setEditingWatchId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formState, setFormState] = useState(EMPTY_FORM);
  const [colorInputName, setColorInputName] = useState('');
  const [colorInputHex, setColorInputHex] = useState('#1E3A5F');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const [settingsForm, setSettingsForm] = useState<StoreSettings>(settings);

  useEffect(() => {
    if (isOpen) {
      setSettingsForm(settings);
    }
  }, [isOpen, settings]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const filteredWatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return watches;
    return watches.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        w.brand.toLowerCase().includes(q) ||
        w.category.toLowerCase().includes(q) ||
        w.reference.toLowerCase().includes(q)
    );
  }, [watches, searchQuery]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 2600);
  };

  const openCreateForm = () => {
    setEditingWatchId(null);
    setFormState(EMPTY_FORM());
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEditForm = (watch: WatchProduct) => {
    setEditingWatchId(watch.id);
    setFormState({
      reference: watch.reference,
      name: watch.name,
      brand: watch.brand,
      category: watch.category,
      originalPrice: watch.originalPrice,
      discountedPrice: watch.discountedPrice,
      description: watch.description,
      image: watch.image,
      colors: watch.colors.length > 0 ? [...watch.colors] : [{ name: 'Standard', hex: '#C9A227' }],
      specifications: { ...watch.specifications },
      stockStatus: watch.stockStatus,
      stockCount: watch.stockCount,
      tags: [...watch.tags],
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleAddColor = () => {
    if (!colorInputName.trim()) return;
    setFormState((prev) => ({
      ...prev,
      colors: [...prev.colors, { name: colorInputName.trim(), hex: colorInputHex }],
    }));
    setColorInputName('');
  };

  const handleRemoveColor = (name: string) => {
    setFormState((prev) => ({
      ...prev,
      colors: prev.colors.filter((c) => c.name !== name),
    }));
  };

  const toggleTag = (tag: CollectionTag) => {
    setFormState((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
    }));
  };

  const handleSubmitWatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name.trim() || !formState.brand.trim()) {
      setFormError('Watch name and brand are required.');
      return;
    }
    if (formState.discountedPrice <= 0 || formState.originalPrice <= 0) {
      setFormError('Prices must be greater than zero.');
      return;
    }
    if (formState.discountedPrice > formState.originalPrice) {
      setFormError('Discounted price cannot exceed original price.');
      return;
    }

    const existing = editingWatchId ? watches.find((w) => w.id === editingWatchId) : null;
    const computedStatus: StockStatus =
      formState.stockCount <= 0
        ? 'Out of Stock'
        : formState.stockStatus === 'Out of Stock' && formState.stockCount > 0
        ? 'In Stock'
        : formState.stockStatus;

    const saved: WatchProduct = {
      id: existing ? existing.id : `rlx-${Date.now().toString(36)}`,
      createdAt: existing ? existing.createdAt : new Date().toISOString().slice(0, 10),
      popularity: existing ? existing.popularity : 80,
      ...formState,
      name: formState.name.trim(),
      brand: formState.brand.trim(),
      reference: formState.reference.trim() || 'REF. RLX-CUSTOM',
      description:
        formState.description.trim() ||
        `${formState.brand.trim()} ${formState.name.trim()} crafted with precision perpetual horology.`,
      colors:
        formState.colors.length > 0 ? formState.colors : [{ name: 'Standard', hex: '#C9A227' }],
      stockStatus: computedStatus,
    };

    onSaveWatch(saved);
    setIsFormOpen(false);
    setEditingWatchId(null);
    showToast(existing ? `Updated "${saved.name}"` : `Added "${saved.name}" to catalog`);
  };

  const handleQuickStockChange = (watch: WatchProduct, stockStatus: StockStatus) => {
    const nextCount =
      stockStatus === 'Out of Stock'
        ? 0
        : stockStatus === 'Low Stock'
        ? Math.min(Math.max(1, watch.stockCount), 4)
        : Math.max(5, watch.stockCount);
    onSaveWatch({
      ...watch,
      stockStatus,
      stockCount: nextCount,
    });
    showToast(`Stock status updated for ${watch.name}`);
  };

  const handleSaveSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedNumber = sanitizeWhatsAppNumber(settingsForm.whatsappNumber);
    if (cleanedNumber.length < 8) {
      showToast('Enter a valid WhatsApp Business Number with country code.');
      return;
    }
    const updated: StoreSettings = {
      ...settingsForm,
      whatsappNumber: cleanedNumber,
      businessName: settingsForm.businessName.trim() || 'ROLEX',
    };
    setSettingsForm(updated);
    onSaveSettings(updated);
    showToast('Store & WhatsApp configuration saved');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-2 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Store Management and Product Catalog"
      onClick={onClose}
    >
      <div
        className="w-full max-w-6xl bg-[#121212] border border-[#333333] rounded-sm shadow-2xl overflow-hidden my-auto max-h-[94dvh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar */}
        <div className="px-5 sm:px-6 py-4 bg-[#1C1C1C] border-b border-[#333333] flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold text-[#FFFFFF]">
              Store &amp; Catalog Management
            </h2>
            <p className="text-xs text-[#B3B3B3]">
              Manage inventory, pricing, categories, and WhatsApp Business checkout settings
            </p>
          </div>

          <div className="flex items-center gap-3">
            {feedbackMsg && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#C9A227] bg-[#000000] border border-[#C9A227]/40 px-3 py-1.5 rounded-sm">
                <Check className="w-3.5 h-3.5" />
                {feedbackMsg}
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close store management"
              className="w-10 h-10 flex items-center justify-center rounded-sm text-[#B3B3B3] hover:text-[#FFFFFF] hover:bg-[#121212] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 sm:px-6 bg-[#000000] border-b border-[#333333] flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              setActiveTab('inventory');
              setIsFormOpen(false);
            }}
            className={`px-4 py-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'inventory'
                ? 'border-[#C9A227] text-[#FFFFFF]'
                : 'border-transparent text-[#B3B3B3] hover:text-[#FFFFFF]'
            }`}
          >
            Watch Inventory ({watches.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'settings'
                ? 'border-[#C9A227] text-[#FFFFFF]'
                : 'border-transparent text-[#B3B3B3] hover:text-[#FFFFFF]'
            }`}
          >
            WhatsApp &amp; Store Settings
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
              activeTab === 'orders'
                ? 'border-[#C9A227] text-[#FFFFFF]'
                : 'border-transparent text-[#B3B3B3] hover:text-[#FFFFFF]'
            }`}
          >
            WhatsApp Orders ({orders.length})
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {/* TAB 1: INVENTORY CRUD */}
          {activeTab === 'inventory' && !isFormOpen && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-[#B3B3B3] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter watches by name, brand, or category..."
                    className="w-full pl-9 pr-4 py-2.5 text-sm bg-[#000000] text-[#FFFFFF] placeholder:text-[#737373] border border-[#333333] rounded-sm focus:outline-none focus:ring-1 focus:ring-[#C9A227]"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {confirmReset ? (
                    <div className="inline-flex items-center gap-2 bg-[#1C1C1C] border border-[#333333] px-3 py-2 rounded-sm text-xs">
                      <span className="text-[#B3B3B3]">Restore defaults?</span>
                      <button
                        type="button"
                        onClick={() => {
                          onResetCatalog();
                          setConfirmReset(false);
                          showToast('Default watch catalog restored');
                        }}
                        className="font-semibold text-[#F87171] hover:underline cursor-pointer"
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmReset(false)}
                        className="text-[#B3B3B3] hover:text-[#FFFFFF] hover:underline cursor-pointer"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmReset(true)}
                      className="inline-flex items-center gap-1.5 px-3 min-h-[40px] text-xs font-medium border border-[#333333] bg-[#1C1C1C] text-[#B3B3B3] hover:text-[#FFFFFF] hover:border-[#C9A227] rounded-sm cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Defaults</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={openCreateForm}
                    className="inline-flex items-center gap-1.5 px-4 min-h-[40px] text-xs font-semibold bg-[#C9A227] text-[#000000] hover:bg-[#D9B43A] transition-colors rounded-sm cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Watch</span>
                  </button>
                </div>
              </div>

              <div className="bg-[#1C1C1C] border border-[#333333] rounded-sm overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[#333333] bg-[#000000] text-xs uppercase tracking-wider text-[#B3B3B3]">
                      <th className="py-3 px-4 font-medium">Timepiece</th>
                      <th className="py-3 px-4 font-medium">Category</th>
                      <th className="py-3 px-4 font-medium">Price</th>
                      <th className="py-3 px-4 font-medium">Availability</th>
                      <th className="py-3 px-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#333333]">
                    {filteredWatches.map((watch) => (
                      <tr key={watch.id} className="hover:bg-[#121212] transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-14 h-11 bg-[#000000] rounded-sm overflow-hidden border border-[#333333] shrink-0">
                              <WatchImage
                                src={watch.image}
                                alt={watch.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-[#FFFFFF] truncate max-w-[220px]">
                                {watch.name}
                              </p>
                              <p className="text-xs text-[#B3B3B3]">
                                {watch.brand} <span aria-hidden="true">·</span>{' '}
                                <span className="font-mono">{watch.reference}</span>
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs text-[#B3B3B3] whitespace-nowrap">
                          {watch.category}
                        </td>
                        <td className="py-3 px-4 tabular-nums whitespace-nowrap">
                          <div className="font-medium text-[#FFFFFF]">
                            {formatCurrency(watch.discountedPrice, settings.currencySymbol)}
                          </div>
                          {watch.originalPrice > watch.discountedPrice && (
                            <div className="text-xs text-[#8C8C8C] line-through">
                              {formatCurrency(watch.originalPrice, settings.currencySymbol)}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <select
                            aria-label={`Availability for ${watch.name}`}
                            value={watch.stockStatus}
                            onChange={(e) =>
                              handleQuickStockChange(watch, e.target.value as StockStatus)
                            }
                            className="text-xs bg-[#000000] border border-[#333333] rounded-sm px-2.5 py-1.5 text-[#FFFFFF] focus:outline-none focus:ring-1 focus:ring-[#C9A227] cursor-pointer"
                          >
                            <option value="In Stock">In Stock ({watch.stockCount})</option>
                            <option value="Low Stock">Low Stock ({watch.stockCount})</option>
                            <option value="Out of Stock">Out of Stock</option>
                          </select>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditForm(watch)}
                              aria-label={`Edit ${watch.name}`}
                              className="p-2 text-[#B3B3B3] hover:text-[#FFFFFF] border border-[#333333] rounded-sm bg-[#000000] hover:border-[#C9A227] cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>

                            {confirmDeleteId === watch.id ? (
                              <div className="inline-flex items-center gap-2 px-2.5 py-1.5 bg-[#2A1212] border border-[#F87171]/40 rounded-sm text-xs">
                                <button
                                  type="button"
                                  onClick={() => {
                                    onDeleteWatch(watch.id);
                                    setConfirmDeleteId(null);
                                    showToast(`Deleted "${watch.name}"`);
                                  }}
                                  className="font-semibold text-[#F87171] hover:underline cursor-pointer"
                                >
                                  Delete
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="text-[#B3B3B3] hover:text-[#FFFFFF] hover:underline cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(watch.id)}
                                aria-label={`Delete ${watch.name}`}
                                className="p-2 text-[#B3B3B3] hover:text-[#F87171] border border-[#333333] rounded-sm bg-[#000000] hover:border-[#F87171]/60 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}

                    {filteredWatches.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-sm text-[#B3B3B3]">
                          No watches match your search query.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ADD / EDIT WATCH FORM */}
          {activeTab === 'inventory' && isFormOpen && (
            <form onSubmit={handleSubmitWatch} className="max-w-4xl mx-auto space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#333333]">
                <h3 className="font-display text-2xl font-semibold text-[#FFFFFF]">
                  {editingWatchId ? 'Edit Timepiece' : 'Add New Timepiece'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="text-xs font-medium text-[#C9A227] hover:text-[#FFFFFF] underline cursor-pointer"
                >
                  Back to Inventory List
                </button>
              </div>

              {formError && (
                <div className="p-3 bg-[#2A1212] border border-[#F87171]/40 text-xs text-[#F87171] rounded-sm">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-[#B3B3B3] mb-1">
                    Watch Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formState.name}
                    onChange={(e) => setFormState((p) => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Submariner Perpetual Date"
                    className="w-full px-3 py-2.5 text-sm bg-[#000000] text-[#FFFFFF] border border-[#333333] rounded-sm focus:outline-none focus:ring-1 focus:ring-[#C9A227]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-[#B3B3B3] mb-1">
                    Brand *
                  </label>
                  <input
                    type="text"
                    required
                    value={formState.brand}
                    onChange={(e) => setFormState((p) => ({ ...p, brand: e.target.value }))}
                    placeholder="e.g. ROLEX"
                    className="w-full px-3 py-2.5 text-sm bg-[#000000] text-[#FFFFFF] border border-[#333333] rounded-sm focus:outline-none focus:ring-1 focus:ring-[#C9A227]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-[#B3B3B3] mb-1">
                    Category
                  </label>
                  <select
                    value={formState.category}
                    onChange={(e) =>
                      setFormState((p) => ({ ...p, category: e.target.value as WatchCategory }))
                    }
                    className="w-full px-3 py-2.5 text-sm bg-[#000000] text-[#FFFFFF] border border-[#333333] rounded-sm focus:outline-none focus:ring-1 focus:ring-[#C9A227]"
                  >
                    {WATCH_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-[#B3B3B3] mb-1">
                    Reference Code
                  </label>
                  <input
                    type="text"
                    value={formState.reference}
                    onChange={(e) => setFormState((p) => ({ ...p, reference: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm font-mono bg-[#000000] text-[#FFFFFF] border border-[#333333] rounded-sm focus:outline-none focus:ring-1 focus:ring-[#C9A227]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-[#B3B3B3] mb-1">
                    Original Price ({settings.currencySymbol}) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formState.originalPrice}
                    onChange={(e) =>
                      setFormState((p) => ({ ...p, originalPrice: Number(e.target.value) }))
                    }
                    className="w-full px-3 py-2.5 text-sm tabular-nums bg-[#000000] text-[#FFFFFF] border border-[#333333] rounded-sm focus:outline-none focus:ring-1 focus:ring-[#C9A227]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-[#B3B3B3] mb-1">
                    Sale / Discounted Price ({settings.currencySymbol}) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formState.discountedPrice}
                    onChange={(e) =>
                      setFormState((p) => ({ ...p, discountedPrice: Number(e.target.value) }))
                    }
                    className="w-full px-3 py-2.5 text-sm tabular-nums bg-[#000000] text-[#FFFFFF] border border-[#333333] rounded-sm focus:outline-none focus:ring-1 focus:ring-[#C9A227]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-[#B3B3B3] mb-1">
                    Stock Status
                  </label>
                  <select
                    value={formState.stockStatus}
                    onChange={(e) =>
                      setFormState((p) => ({ ...p, stockStatus: e.target.value as StockStatus }))
                    }
                    className="w-full px-3 py-2.5 text-sm bg-[#000000] text-[#FFFFFF] border border-[#333333] rounded-sm focus:outline-none focus:ring-1 focus:ring-[#C9A227]"
                  >
                    <option value="In Stock">In Stock</option>
                    <option value="Low Stock">Low Stock</option>
                    <option value="Out of Stock">Out of Stock</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-[#B3B3B3] mb-1">
                    Units Available
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formState.stockCount}
                    onChange={(e) =>
                      setFormState((p) => ({ ...p, stockCount: Number(e.target.value) }))
                    }
                    className="w-full px-3 py-2.5 text-sm tabular-nums bg-[#000000] text-[#FFFFFF] border border-[#333333] rounded-sm focus:outline-none focus:ring-1 focus:ring-[#C9A227]"
                  />
                </div>
              </div>

              {/* Studio Image Picker */}
              <div className="space-y-2">
                <label className="block text-xs font-medium uppercase tracking-wider text-[#B3B3B3]">
                  Product Photography (Select Studio Asset or Custom Path)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {STUDIO_IMAGE_LIBRARY.map((asset) => {
                    const selected = formState.image === asset.path;
                    return (
                      <button
                        key={asset.path}
                        type="button"
                        onClick={() => setFormState((p) => ({ ...p, image: asset.path }))}
                        className={`p-1.5 border rounded-sm text-left transition-colors cursor-pointer ${
                          selected
                            ? 'border-[#C9A227] bg-[#1C1C1C] ring-1 ring-[#C9A227]'
                            : 'border-[#333333] bg-[#000000] hover:border-[#C9A227]/60'
                        }`}
                      >
                        <div className="aspect-[4/3] overflow-hidden bg-[#121212] rounded-sm mb-1.5">
                          <WatchImage
                            src={asset.path}
                            alt={asset.label}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="block text-[11px] font-medium text-[#FFFFFF] truncate">
                          {asset.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  value={formState.image}
                  onChange={(e) => setFormState((p) => ({ ...p, image: e.target.value }))}
                  placeholder="/src/assets/images/..."
                  className="w-full px-3 py-2 text-xs font-mono bg-[#000000] text-[#FFFFFF] border border-[#333333] rounded-sm focus:outline-none focus:ring-1 focus:ring-[#C9A227]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-[#B3B3B3] mb-1">
                  Editorial Description
                </label>
                <textarea
                  rows={3}
                  value={formState.description}
                  onChange={(e) => setFormState((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Describe dial artistry, case material, and movement provenance..."
                  className="w-full px-3 py-2 text-sm bg-[#000000] text-[#FFFFFF] border border-[#333333] rounded-sm focus:outline-none focus:ring-1 focus:ring-[#C9A227]"
                />
              </div>

              {/* Color Variations */}
              <div className="space-y-2">
                <label className="block text-xs font-medium uppercase tracking-wider text-[#B3B3B3]">
                  Color &amp; Strap Variations
                </label>
                <div className="flex flex-wrap gap-2">
                  {formState.colors.map((color) => (
                    <span
                      key={color.name}
                      className="inline-flex items-center gap-2 px-2.5 py-1.5 text-xs bg-[#1C1C1C] text-[#FFFFFF] border border-[#333333] rounded-sm"
                    >
                      <span
                        className="w-3 h-3 rounded-full border border-white/25"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span>{color.name}</span>
                      {formState.colors.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveColor(color.name)}
                          className="text-[#B3B3B3] hover:text-[#F87171] cursor-pointer"
                          aria-label={`Remove ${color.name}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 max-w-md">
                  <input
                    type="color"
                    value={colorInputHex}
                    onChange={(e) => setColorInputHex(e.target.value)}
                    className="w-10 h-10 p-0.5 bg-[#000000] border border-[#333333] rounded-sm cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={colorInputName}
                    onChange={(e) => setColorInputName(e.target.value)}
                    placeholder="e.g. Emerald / Oystersteel"
                    className="flex-1 min-w-[160px] px-3 py-2 text-xs bg-[#000000] text-[#FFFFFF] border border-[#333333] rounded-sm"
                  />
                  <button
                    type="button"
                    onClick={handleAddColor}
                    className="px-3 py-2 text-xs font-medium border border-[#333333] bg-[#1C1C1C] text-[#FFFFFF] hover:border-[#C9A227] rounded-sm cursor-pointer shrink-0"
                  >
                    Add Finish
                  </button>
                </div>
              </div>

              {/* Specifications */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium uppercase text-[#B3B3B3] mb-1">
                    Movement
                  </label>
                  <input
                    type="text"
                    value={formState.specifications.movement}
                    onChange={(e) =>
                      setFormState((p) => ({
                        ...p,
                        specifications: { ...p.specifications, movement: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 text-xs bg-[#000000] text-[#FFFFFF] border border-[#333333] rounded-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium uppercase text-[#B3B3B3] mb-1">
                    Case Diameter
                  </label>
                  <input
                    type="text"
                    value={formState.specifications.caseDiameter}
                    onChange={(e) =>
                      setFormState((p) => ({
                        ...p,
                        specifications: { ...p.specifications, caseDiameter: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 text-xs bg-[#000000] text-[#FFFFFF] border border-[#333333] rounded-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium uppercase text-[#B3B3B3] mb-1">
                    Water Resistance
                  </label>
                  <input
                    type="text"
                    value={formState.specifications.waterResistance}
                    onChange={(e) =>
                      setFormState((p) => ({
                        ...p,
                        specifications: { ...p.specifications, waterResistance: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 text-xs bg-[#000000] text-[#FFFFFF] border border-[#333333] rounded-sm"
                  />
                </div>
              </div>

              {/* Collection Placement Tags */}
              <div>
                <span className="block text-xs font-medium uppercase tracking-wider text-[#B3B3B3] mb-2">
                  Homepage Collection Placement
                </span>
                <div className="flex flex-wrap gap-2">
                  {ALL_TAGS.map((tag) => {
                    const active = formState.tags.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className={`px-3 py-1.5 text-xs font-medium border rounded-sm transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#C9A227] text-[#000000] border-[#C9A227] font-semibold'
                            : 'bg-[#000000] text-[#B3B3B3] border-[#333333] hover:border-[#C9A227]'
                        }`}
                      >
                        {tag.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-[#333333] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2.5 text-xs font-medium border border-[#333333] bg-[#1C1C1C] text-[#B3B3B3] hover:text-[#FFFFFF] rounded-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-semibold bg-[#C9A227] text-[#000000] hover:bg-[#D9B43A] transition-colors rounded-sm cursor-pointer"
                >
                  {editingWatchId ? 'Save Changes' : 'Publish Timepiece'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: WHATSAPP & STORE SETTINGS */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveSettingsSubmit} className="max-w-2xl space-y-6">
              <div>
                <h3 className="font-display text-2xl font-semibold text-[#FFFFFF]">
                  WhatsApp Checkout Configuration
                </h3>
                <p className="text-sm text-[#B3B3B3] mt-1">
                  All customer orders placed through the checkout drawer will route to the WhatsApp
                  Business number configured below.
                </p>
              </div>

              <div className="space-y-4 bg-[#1C1C1C] p-6 border border-[#333333] rounded-sm">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-[#B3B3B3] mb-1.5">
                    WhatsApp Business Number (with country code, digits only)
                  </label>
                  <input
                    type="text"
                    required
                    value={settingsForm.whatsappNumber}
                    onChange={(e) =>
                      setSettingsForm((p) => ({ ...p, whatsappNumber: e.target.value }))
                    }
                    placeholder="e.g. 923001234567"
                    className="w-full px-3.5 py-2.5 text-sm font-mono bg-[#000000] text-[#FFFFFF] border border-[#333333] rounded-sm focus:outline-none focus:ring-1 focus:ring-[#C9A227]"
                  />
                  <p className="mt-1.5 text-xs text-[#B3B3B3]">
                    Active click-to-chat endpoint:{' '}
                    <span className="font-mono text-[#C9A227]">
                      https://wa.me/{sanitizeWhatsAppNumber(settingsForm.whatsappNumber)}
                    </span>
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-[#B3B3B3] mb-1.5">
                      Storefront Brand Name
                    </label>
                    <input
                      type="text"
                      value={settingsForm.businessName}
                      onChange={(e) =>
                        setSettingsForm((p) => ({ ...p, businessName: e.target.value }))
                      }
                      className="w-full px-3.5 py-2.5 text-sm bg-[#000000] text-[#FFFFFF] border border-[#333333] rounded-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-[#B3B3B3] mb-1.5">
                      Display Currency
                    </label>
                    <select
                      value={settingsForm.currencySymbol}
                      onChange={(e) =>
                        setSettingsForm((p) => ({ ...p, currencySymbol: e.target.value }))
                      }
                      className="w-full px-3.5 py-2.5 text-sm bg-[#000000] text-[#FFFFFF] border border-[#333333] rounded-sm"
                    >
                      <option value="Rs.">Rs. (PKR / INR)</option>
                      <option value="$">$ (USD)</option>
                      <option value="€">€ (EUR)</option>
                      <option value="£">£ (GBP)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-[#B3B3B3] mb-1.5">
                      Concierge Email
                    </label>
                    <input
                      type="email"
                      value={settingsForm.supportEmail}
                      onChange={(e) =>
                        setSettingsForm((p) => ({ ...p, supportEmail: e.target.value }))
                      }
                      className="w-full px-3.5 py-2.5 text-sm bg-[#000000] text-[#FFFFFF] border border-[#333333] rounded-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-[#B3B3B3] mb-1.5">
                      Free Insured Shipping Threshold
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={settingsForm.freeShippingThreshold}
                      onChange={(e) =>
                        setSettingsForm((p) => ({
                          ...p,
                          freeShippingThreshold: Number(e.target.value),
                        }))
                      }
                      className="w-full px-3.5 py-2.5 text-sm tabular-nums bg-[#000000] text-[#FFFFFF] border border-[#333333] rounded-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-[#B3B3B3] mb-1.5">
                    Boutique Address
                  </label>
                  <input
                    type="text"
                    value={settingsForm.storeAddress}
                    onChange={(e) =>
                      setSettingsForm((p) => ({ ...p, storeAddress: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 text-sm bg-[#000000] text-[#FFFFFF] border border-[#333333] rounded-sm"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  className="px-6 min-h-[42px] text-xs font-semibold bg-[#C9A227] text-[#000000] hover:bg-[#D9B43A] transition-colors rounded-sm cursor-pointer"
                >
                  Save Configuration
                </button>
                <a
                  href={buildWhatsAppUrl(
                    settingsForm.whatsappNumber,
                    `Hello ${settingsForm.businessName}, testing storefront WhatsApp integration.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 min-h-[42px] text-xs font-medium border border-[#333333] bg-[#1C1C1C] text-[#FFFFFF] hover:border-[#C9A227] rounded-sm"
                >
                  <span>Test WhatsApp Link</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </form>
          )}

          {/* TAB 3: RECENT WHATSAPP ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-display text-2xl font-semibold text-[#FFFFFF]">
                  Submitted WhatsApp Orders
                </h3>
                <p className="text-sm text-[#B3B3B3]">
                  Orders prepared from this browser session are stored locally for reference.
                </p>
              </div>

              {orders.length === 0 ? (
                <div className="p-12 bg-[#1C1C1C] border border-[#333333] rounded-sm text-center text-sm text-[#B3B3B3]">
                  No WhatsApp orders have been prepared yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="p-5 bg-[#1C1C1C] border border-[#333333] rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-[#B3B3B3]">
                          <span className="font-mono font-semibold text-[#C9A227]">
                            #{order.id}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{new Date(order.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-sm font-medium text-[#FFFFFF]">
                          {order.customer.name} ({order.customer.phone})
                        </p>
                        <p className="text-xs text-[#B3B3B3]">{order.customer.address}</p>
                        <p className="text-xs text-[#B3B3B3]">
                          {order.items
                            .map((i) => `${i.quantity}x ${i.name} (${i.colorName})`)
                            .join(' · ')}
                        </p>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                        <span className="text-base font-semibold text-[#FFFFFF] tabular-nums">
                          {formatCurrency(order.totalAmount, settings.currencySymbol)}
                        </span>
                        <a
                          href={order.whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#C9A227] text-[#000000] hover:bg-[#D9B43A] rounded-sm"
                        >
                          <span>Open in WhatsApp</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
