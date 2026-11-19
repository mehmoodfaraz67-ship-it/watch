import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  MessageCircle,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react';
import { CartItem, CustomerDetails, OrderRecord, StoreSettings, WatchProduct } from '../types';
import {
  buildWhatsAppOrderMessage,
  buildWhatsAppUrl,
  formatCurrency,
} from '../utils/whatsapp';
import { WatchImage } from './WatchImage';

interface CartDrawerProps {
  isOpen: boolean;
  initialStep: 'bag' | 'checkout';
  cart: CartItem[];
  watches: WatchProduct[];
  settings: StoreSettings;
  onClose: () => void;
  onUpdateQty: (watchId: string, colorName: string, delta: number) => void;
  onRemoveItem: (watchId: string, colorName: string) => void;
  onClearCart: () => void;
  onOrderRecorded: (order: OrderRecord) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  initialStep,
  cart,
  watches,
  settings,
  onClose,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onOrderRecorded,
}) => {
  const [step, setStep] = useState<'bag' | 'checkout' | 'confirmed'>(initialStep);
  const [customer, setCustomer] = useState<CustomerDetails>({
    name: '',
    phone: '',
    address: '',
    note: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerDetails, string>>>({});
  const [confirmedOrder, setConfirmedOrder] = useState<OrderRecord | null>(null);
  const [copied, setCopied] = useState(false);

  const lineItems = useMemo(() => {
    return cart
      .map((item) => {
        const watch = watches.find((w) => w.id === item.watchId);
        if (!watch) return null;
        return {
          watch,
          colorName: item.colorName,
          quantity: item.quantity,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [cart, watches]);

  useEffect(() => {
    if (isOpen) {
      setStep(lineItems.length === 0 && initialStep === 'checkout' ? 'bag' : initialStep);
      setErrors({});
      setCopied(false);
    }
  }, [isOpen, initialStep, lineItems.length]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const subtotal = useMemo(() => {
    return lineItems.reduce(
      (sum, item) => sum + item.watch.discountedPrice * item.quantity,
      0
    );
  }, [lineItems]);

  const qualifiesFreeDelivery = subtotal >= settings.freeShippingThreshold;

  const liveDraft = useMemo(() => {
    const previewCustomer: CustomerDetails = {
      name: customer.name.trim() || 'Your Name',
      phone: customer.phone.trim() || '03XXXXXXXXX',
      address: customer.address.trim() || 'Your Delivery Address',
      note: customer.note,
    };
    return buildWhatsAppOrderMessage(lineItems, previewCustomer, settings);
  }, [lineItems, customer, settings]);

  if (!isOpen) return null;

  const validateCustomer = (): boolean => {
    const nextErrors: Partial<Record<keyof CustomerDetails, string>> = {};
    if (customer.name.trim().length < 2) {
      nextErrors.name = 'Please enter your full name.';
    }
    const digitsCount = customer.phone.replace(/[^\d]/g, '').length;
    if (digitsCount < 7) {
      nextErrors.phone = 'Please enter a valid contact phone number.';
    }
    if (customer.address.trim().length < 6) {
      nextErrors.address = 'Please enter your complete street and city delivery address.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handlePlaceWhatsAppOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (lineItems.length === 0) return;
    if (!validateCustomer()) return;

    const { message, totalAmount } = buildWhatsAppOrderMessage(lineItems, customer, settings);
    const whatsappUrl = buildWhatsAppUrl(settings.whatsappNumber, message);

    const record: OrderRecord = {
      id: `RLX-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
      customer: {
        name: customer.name.trim(),
        phone: customer.phone.trim(),
        address: customer.address.trim(),
        note: customer.note?.trim() || '',
      },
      items: lineItems.map((item) => ({
        watchId: item.watch.id,
        name: item.watch.name,
        brand: item.watch.brand,
        colorName: item.colorName,
        quantity: item.quantity,
        unitPrice: item.watch.discountedPrice,
        lineTotal: item.watch.discountedPrice * item.quantity,
      })),
      totalAmount,
      whatsappUrl,
      messagePreview: message,
    };

    onOrderRecorded(record);
    setConfirmedOrder(record);
    onClearCart();
    setStep('confirmed');

    const anchor = document.createElement('a');
    anchor.href = whatsappUrl;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  const handleCopyMessage = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Bag and WhatsApp Checkout"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#121212] h-[100dvh] flex flex-col border-l border-[#333333] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="px-5 sm:px-6 py-4 bg-[#1C1C1C] border-b border-[#333333] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {step === 'checkout' && (
              <button
                type="button"
                onClick={() => setStep('bag')}
                aria-label="Back to shopping bag"
                className="w-9 h-9 flex items-center justify-center rounded-sm border border-[#333333] bg-[#121212] text-[#B3B3B3] hover:text-[#FFFFFF] hover:border-[#C9A227] cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="min-w-0">
              <h2 className="font-display text-2xl font-semibold text-[#FFFFFF] truncate">
                {step === 'bag'
                  ? 'Shopping Bag'
                  : step === 'checkout'
                  ? 'WhatsApp Checkout'
                  : 'Order Ready on WhatsApp'}
              </h2>
              <p className="text-xs text-[#B3B3B3] tabular-nums truncate">
                {step === 'confirmed' && confirmedOrder
                  ? `Order #${confirmedOrder.id} prepared for WhatsApp review`
                  : `${lineItems.reduce((sum, i) => sum + i.quantity, 0)} items · ${formatCurrency(
                      subtotal,
                      settings.currencySymbol
                    )}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close bag drawer"
            className="w-10 h-10 flex items-center justify-center rounded-sm text-[#B3B3B3] hover:text-[#FFFFFF] hover:bg-[#121212] cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Bag Items */}
        {step === 'bag' && (
          <>
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              {lineItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4">
                  <ShoppingBag className="w-10 h-10 text-[#C9A227]/60 stroke-[1.25] mb-3" />
                  <p className="font-display text-2xl text-[#FFFFFF]">Your shopping bag is empty</p>
                  <p className="mt-1 text-sm text-[#B3B3B3] max-w-xs">
                    Select any timepiece from the {settings.businessName} collection to begin your
                    WhatsApp concierge order.
                  </p>
                  <button
                    type="button"
                    onClick={onClose}
                    className="mt-6 px-6 min-h-[44px] text-xs font-semibold uppercase tracking-wider bg-[#C9A227] text-[#000000] hover:bg-[#D9B43A] transition-colors rounded-sm cursor-pointer"
                  >
                    Browse Timepieces
                  </button>
                </div>
              ) : (
                lineItems.map((item) => (
                  <div
                    key={`${item.watch.id}-${item.colorName}`}
                    className="flex gap-4 p-4 bg-[#1C1C1C] border border-[#333333] rounded-sm"
                  >
                    <div className="w-24 h-20 bg-[#000000] rounded-sm overflow-hidden shrink-0 border border-[#333333]">
                      <WatchImage
                        src={item.watch.image}
                        alt={item.watch.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[11px] uppercase tracking-wider text-[#C9A227]">
                              {item.watch.brand}
                            </p>
                            <h3 className="text-sm font-semibold text-[#FFFFFF] leading-snug truncate">
                              {item.watch.name}
                            </h3>
                          </div>
                          <button
                            type="button"
                            onClick={() => onRemoveItem(item.watch.id, item.colorName)}
                            aria-label={`Remove ${item.watch.name}`}
                            className="text-[#B3B3B3] hover:text-[#F87171] p-1.5 cursor-pointer shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-xs text-[#B3B3B3] mt-0.5 truncate">{item.colorName}</p>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="inline-flex items-center border border-[#333333] bg-[#121212] rounded-sm">
                          <button
                            type="button"
                            onClick={() => onUpdateQty(item.watch.id, item.colorName, -1)}
                            aria-label="Decrease quantity"
                            className="w-8 h-8 flex items-center justify-center text-[#B3B3B3] hover:text-[#FFFFFF] cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-xs font-medium text-[#FFFFFF] tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            disabled={item.quantity >= Math.max(1, item.watch.stockCount)}
                            onClick={() => onUpdateQty(item.watch.id, item.colorName, 1)}
                            aria-label="Increase quantity"
                            className="w-8 h-8 flex items-center justify-center text-[#B3B3B3] hover:text-[#FFFFFF] disabled:opacity-35 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="text-right tabular-nums">
                          <p className="text-sm font-semibold text-[#FFFFFF]">
                            {formatCurrency(
                              item.watch.discountedPrice * item.quantity,
                              settings.currencySymbol
                            )}
                          </p>
                          {item.quantity > 1 && (
                            <p className="text-[11px] text-[#B3B3B3]">
                              {formatCurrency(item.watch.discountedPrice, settings.currencySymbol)}{' '}
                              each
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {lineItems.length > 0 && (
              <div className="p-5 sm:p-6 bg-[#1C1C1C] border-t border-[#333333] space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-[#B3B3B3]">
                    <span>Subtotal</span>
                    <span className="tabular-nums font-medium text-[#FFFFFF]">
                      {formatCurrency(subtotal, settings.currencySymbol)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#B3B3B3]">
                    <span>Insured Courier Delivery</span>
                    <span className="text-[#C9A227] font-medium">
                      {qualifiesFreeDelivery ? 'Complimentary' : 'Confirmed via WhatsApp'}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-[#333333] flex justify-between text-base font-semibold text-[#FFFFFF]">
                    <span>Total Amount</span>
                    <span className="tabular-nums">
                      {formatCurrency(subtotal, settings.currencySymbol)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStep('checkout')}
                  className="w-full h-12 inline-flex items-center justify-center gap-2 bg-[#C9A227] text-[#000000] hover:bg-[#D9B43A] transition-colors text-sm font-semibold rounded-sm cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Proceed to WhatsApp Checkout</span>
                </button>
              </div>
            )}
          </>
        )}

        {/* Step 2: Customer Details & Live Message Preview */}
        {step === 'checkout' && (
          <form onSubmit={handlePlaceWhatsAppOrder} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              <div className="p-4 bg-[#1C1C1C] border border-[#333333] rounded-sm text-xs text-[#B3B3B3] leading-relaxed">
                Complete your delivery information below. Clicking{' '}
                <strong className="text-[#FFFFFF]">Order on WhatsApp</strong> prepares your itemized
                order inside WhatsApp so you can review and press Send directly.
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="checkout-name"
                    className="block text-xs font-medium uppercase tracking-wider text-[#B3B3B3] mb-1.5"
                  >
                    Full Name *
                  </label>
                  <input
                    id="checkout-name"
                    type="text"
                    required
                    value={customer.name}
                    onChange={(e) => {
                      setCustomer((prev) => ({ ...prev, name: e.target.value }));
                      if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                    }}
                    placeholder="e.g. Tariq Mahmood"
                    className={`w-full px-3.5 py-2.5 text-sm bg-[#000000] text-[#FFFFFF] placeholder:text-[#737373] border rounded-sm focus:outline-none focus:ring-1 focus:ring-[#C9A227] ${
                      errors.name ? 'border-[#F87171]' : 'border-[#333333]'
                    }`}
                  />
                  {errors.name && <p className="mt-1 text-xs text-[#F87171]">{errors.name}</p>}
                </div>

                <div>
                  <label
                    htmlFor="checkout-phone"
                    className="block text-xs font-medium uppercase tracking-wider text-[#B3B3B3] mb-1.5"
                  >
                    Phone Number *
                  </label>
                  <input
                    id="checkout-phone"
                    type="tel"
                    required
                    value={customer.phone}
                    onChange={(e) => {
                      setCustomer((prev) => ({ ...prev, phone: e.target.value }));
                      if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                    }}
                    placeholder="e.g. 0300 1234567"
                    className={`w-full px-3.5 py-2.5 text-sm bg-[#000000] text-[#FFFFFF] placeholder:text-[#737373] border rounded-sm focus:outline-none focus:ring-1 focus:ring-[#C9A227] ${
                      errors.phone ? 'border-[#F87171]' : 'border-[#333333]'
                    }`}
                  />
                  {errors.phone && <p className="mt-1 text-xs text-[#F87171]">{errors.phone}</p>}
                </div>

                <div>
                  <label
                    htmlFor="checkout-address"
                    className="block text-xs font-medium uppercase tracking-wider text-[#B3B3B3] mb-1.5"
                  >
                    Delivery Address *
                  </label>
                  <textarea
                    id="checkout-address"
                    rows={3}
                    required
                    value={customer.address}
                    onChange={(e) => {
                      setCustomer((prev) => ({ ...prev, address: e.target.value }));
                      if (errors.address) setErrors((prev) => ({ ...prev, address: undefined }));
                    }}
                    placeholder="House / Suite, Street, Sector, City"
                    className={`w-full px-3.5 py-2.5 text-sm bg-[#000000] text-[#FFFFFF] placeholder:text-[#737373] border rounded-sm focus:outline-none focus:ring-1 focus:ring-[#C9A227] resize-none ${
                      errors.address ? 'border-[#F87171]' : 'border-[#333333]'
                    }`}
                  />
                  {errors.address && (
                    <p className="mt-1 text-xs text-[#F87171]">{errors.address}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="checkout-note"
                    className="block text-xs font-medium uppercase tracking-wider text-[#B3B3B3] mb-1.5"
                  >
                    Concierge Note (Optional)
                  </label>
                  <input
                    id="checkout-note"
                    type="text"
                    value={customer.note || ''}
                    onChange={(e) => setCustomer((prev) => ({ ...prev, note: e.target.value }))}
                    placeholder="Gift presentation box or delivery timing"
                    className="w-full px-3.5 py-2.5 text-sm bg-[#000000] text-[#FFFFFF] placeholder:text-[#737373] border border-[#333333] rounded-sm focus:outline-none focus:ring-1 focus:ring-[#C9A227]"
                  />
                </div>
              </div>

              {/* Order Summary & Live Message Preview */}
              <div className="pt-2">
                <p className="text-xs font-medium uppercase tracking-wider text-[#B3B3B3] mb-2">
                  WhatsApp Message Preview
                </p>
                <pre className="p-4 bg-[#000000] border border-[#333333] rounded-sm text-[11px] font-mono text-[#B3B3B3] whitespace-pre-wrap leading-relaxed overflow-x-auto">
                  {liveDraft.message}
                </pre>
              </div>
            </div>

            <div className="p-5 sm:p-6 bg-[#1C1C1C] border-t border-[#333333] space-y-3">
              <div className="flex justify-between text-sm font-semibold text-[#FFFFFF]">
                <span>Order Total</span>
                <span className="tabular-nums text-[#C9A227]">
                  {formatCurrency(subtotal, settings.currencySymbol)}
                </span>
              </div>
              <button
                type="submit"
                className="w-full h-12 inline-flex items-center justify-center gap-2 bg-[#C9A227] text-[#000000] hover:bg-[#D9B43A] transition-colors text-sm font-semibold rounded-sm cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Order on WhatsApp</span>
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Confirmation Receipt & Direct WhatsApp Launch */}
        {step === 'confirmed' && confirmedOrder && (
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            <div className="p-5 bg-[#1C1C1C] border border-[#333333] rounded-sm space-y-2">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#C9A227]">
                <Check className="w-4 h-4" />
                <span>Order #{confirmedOrder.id} Prepared</span>
              </div>
              <h3 className="font-display text-2xl font-semibold text-[#FFFFFF]">
                Review &amp; Send on WhatsApp
              </h3>
              <p className="text-sm text-[#B3B3B3] leading-relaxed">
                Your order details are formatted and ready for{' '}
                <strong className="text-[#FFFFFF]">{settings.businessName}</strong>. Click below if
                WhatsApp did not open automatically so you can review and send your message.
              </p>
            </div>

            <div className="p-4 bg-[#1C1C1C] border border-[#333333] rounded-sm space-y-2 text-xs">
              <div className="flex justify-between gap-4">
                <span className="text-[#B3B3B3]">Customer</span>
                <span className="font-medium text-[#FFFFFF] text-right">
                  {confirmedOrder.customer.name}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[#B3B3B3]">Phone</span>
                <span className="font-medium text-[#FFFFFF] text-right">
                  {confirmedOrder.customer.phone}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[#B3B3B3] shrink-0">Address</span>
                <span className="font-medium text-[#FFFFFF] text-right">
                  {confirmedOrder.customer.address}
                </span>
              </div>
              <div className="pt-2 border-t border-[#333333] flex justify-between text-sm font-semibold">
                <span className="text-[#FFFFFF]">Total Amount</span>
                <span className="tabular-nums text-[#C9A227]">
                  {formatCurrency(confirmedOrder.totalAmount, settings.currencySymbol)}
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium uppercase tracking-wider text-[#B3B3B3]">
                  Generated WhatsApp Message
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyMessage(confirmedOrder.messagePreview)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#C9A227] hover:text-[#FFFFFF] cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Text'}</span>
                </button>
              </div>
              <pre className="p-4 bg-[#000000] border border-[#333333] rounded-sm text-[11px] font-mono text-[#B3B3B3] whitespace-pre-wrap leading-relaxed overflow-x-auto">
                {confirmedOrder.messagePreview}
              </pre>
            </div>

            <div className="space-y-3 pt-2">
              <a
                href={confirmedOrder.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-12 inline-flex items-center justify-center gap-2 bg-[#C9A227] text-[#000000] hover:bg-[#D9B43A] transition-colors text-sm font-semibold rounded-sm"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Open WhatsApp to Send Order</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={onClose}
                className="w-full h-11 inline-flex items-center justify-center border border-[#333333] bg-[#1C1C1C] text-[#FFFFFF] hover:border-[#C9A227] text-xs font-medium rounded-sm cursor-pointer"
              >
                Return to Storefront
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
