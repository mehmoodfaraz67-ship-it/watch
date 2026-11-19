import React, { useEffect, useState } from 'react';
import { Check, Heart, Minus, Plus, ShieldCheck, ShoppingBag, X } from 'lucide-react';
import { WatchProduct } from '../types';
import { formatCurrency } from '../utils/whatsapp';
import { WatchImage } from './WatchImage';

interface ProductDetailModalProps {
  watch: WatchProduct | null;
  currencySymbol: string;
  isWishlisted: boolean;
  onClose: () => void;
  onToggleWishlist: (watchId: string) => void;
  onAddToCart: (watch: WatchProduct, colorName: string, quantity: number) => void;
  onBuyNow: (watch: WatchProduct, colorName: string, quantity: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  watch,
  currencySymbol,
  isWishlisted,
  onClose,
  onToggleWishlist,
  onAddToCart,
  onBuyNow,
}) => {
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [addedFeedback, setAddedFeedback] = useState(false);

  useEffect(() => {
    if (watch) {
      setSelectedColor(watch.colors[0]?.name || 'Standard Edition');
      setQuantity(1);
      setAddedFeedback(false);
    }
  }, [watch]);

  useEffect(() => {
    if (!watch) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [watch, onClose]);

  if (!watch) return null;

  const hasDiscount = watch.originalPrice > watch.discountedPrice;
  const savings = watch.originalPrice - watch.discountedPrice;
  const isOutOfStock = watch.stockStatus === 'Out of Stock' || watch.stockCount <= 0;
  const maxQty = Math.max(1, watch.stockCount);

  const handleAdd = () => {
    onAddToCart(watch, selectedColor, quantity);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 1800);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-2 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdp-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl bg-[#121212] border border-[#333333] rounded-sm shadow-2xl overflow-hidden my-auto max-h-[94dvh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-[#333333] bg-[#1C1C1C]">
          <div className="text-xs text-[#B3B3B3] font-mono tracking-wide truncate pr-4">
            {watch.reference} <span aria-hidden="true">·</span> {watch.category}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close timepiece details"
            className="w-10 h-10 flex items-center justify-center rounded-sm text-[#B3B3B3] hover:text-[#FFFFFF] hover:bg-[#121212] transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contiguous Purchase Module */}
        <div className="overflow-y-auto grid grid-cols-1 lg:grid-cols-12">
          {/* Left: Studio Image */}
          <div className="lg:col-span-6 bg-[#000000] p-5 sm:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#333333]">
            <div className="aspect-[4/3] w-full overflow-hidden rounded-sm border border-[#333333] bg-[#1C1C1C]">
              <WatchImage
                src={watch.image}
                alt={`${watch.brand} ${watch.name}`}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="mt-6 pt-5 border-t border-[#333333] grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#B3B3B3]">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#C9A227] shrink-0 mt-0.5" />
                <span>5-Year International Perpetual Warranty</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-[#C9A227] shrink-0 mt-0.5" />
                <span>Direct WhatsApp Verification Before Dispatch</span>
              </div>
            </div>
          </div>

          {/* Right: Purchase & Specifications */}
          <div className="lg:col-span-6 p-5 sm:p-8 space-y-6 bg-[#121212]">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#C9A227] font-semibold">
                {watch.brand}
              </p>
              <h2
                id="pdp-title"
                className="mt-1.5 font-display text-3xl sm:text-4xl font-semibold text-[#FFFFFF] leading-tight tracking-wide"
              >
                {watch.name}
              </h2>

              <div className="mt-4 flex flex-wrap items-baseline gap-3 tabular-nums">
                <span className="text-2xl font-semibold text-[#FFFFFF]">
                  {formatCurrency(watch.discountedPrice, currencySymbol)}
                </span>
                {hasDiscount && (
                  <>
                    <span className="text-sm text-[#8C8C8C] line-through">
                      {formatCurrency(watch.originalPrice, currencySymbol)}
                    </span>
                    <span className="text-xs font-medium text-[#C9A227]">
                      Save {formatCurrency(savings, currencySymbol)}
                    </span>
                  </>
                )}
              </div>

              <p className="mt-2 text-xs font-medium text-[#B3B3B3]">
                Availability:{' '}
                <span
                  className={
                    isOutOfStock
                      ? 'text-[#F87171]'
                      : watch.stockStatus === 'Low Stock'
                      ? 'text-[#C9A227]'
                      : 'text-[#FFFFFF]'
                  }
                >
                  {isOutOfStock
                    ? 'Currently Out of Stock'
                    : `${watch.stockStatus} (${watch.stockCount} available)`}
                </span>
              </p>
            </div>

            <p className="text-sm text-[#B3B3B3] leading-relaxed">{watch.description}</p>

            {/* Color / Strap Variation Selector */}
            {watch.colors.length > 0 && (
              <div>
                <span className="block text-xs font-medium uppercase tracking-wider text-[#B3B3B3] mb-2.5">
                  Dial &amp; Strap Finish:{' '}
                  <strong className="text-[#FFFFFF]">{selectedColor}</strong>
                </span>
                <div className="flex flex-wrap gap-2">
                  {watch.colors.map((color) => {
                    const active = selectedColor === color.name;
                    return (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => setSelectedColor(color.name)}
                        className={`inline-flex items-center gap-2 px-3 min-h-[40px] text-xs font-medium rounded-sm border transition-colors cursor-pointer ${
                          active
                            ? 'border-[#C9A227] bg-[#1C1C1C] text-[#FFFFFF]'
                            : 'border-[#333333] bg-[#000000] text-[#B3B3B3] hover:border-[#C9A227]/60 hover:text-[#FFFFFF]'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-white/25 shrink-0"
                          style={{ backgroundColor: color.hex }}
                        />
                        <span>{color.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity & Primary Purchase CTAs */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
                <div className="inline-flex items-center border border-[#333333] bg-[#1C1C1C] rounded-sm">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1 || isOutOfStock}
                    aria-label="Decrease quantity"
                    className="w-11 h-11 flex items-center justify-center text-[#B3B3B3] hover:text-[#FFFFFF] disabled:opacity-40 cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-10 text-center text-sm font-medium text-[#FFFFFF] tabular-nums">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                    disabled={quantity >= maxQty || isOutOfStock}
                    aria-label="Increase quantity"
                    className="w-11 h-11 flex items-center justify-center text-[#B3B3B3] hover:text-[#FFFFFF] disabled:opacity-40 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  disabled={isOutOfStock}
                  onClick={handleAdd}
                  className="flex-1 min-w-[140px] h-11 inline-flex items-center justify-center gap-2 px-5 text-sm font-medium border border-[#333333] bg-[#1C1C1C] text-[#FFFFFF] hover:border-[#C9A227] hover:text-[#C9A227] disabled:opacity-40 disabled:cursor-not-allowed transition-colors rounded-sm cursor-pointer whitespace-nowrap"
                >
                  {addedFeedback ? (
                    <Check className="w-4 h-4 text-[#C9A227]" />
                  ) : (
                    <ShoppingBag className="w-4 h-4" />
                  )}
                  <span>{addedFeedback ? 'Added to Bag' : 'Add to Bag'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onToggleWishlist(watch.id)}
                  aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                  className={`w-11 h-11 flex items-center justify-center rounded-sm border transition-colors cursor-pointer shrink-0 ${
                    isWishlisted
                      ? 'bg-[#C9A227] border-[#C9A227] text-[#000000]'
                      : 'border-[#333333] bg-[#1C1C1C] text-[#B3B3B3] hover:text-[#FFFFFF] hover:border-[#C9A227]'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>
              </div>

              <button
                type="button"
                disabled={isOutOfStock}
                onClick={() => onBuyNow(watch, selectedColor, quantity)}
                className="w-full h-12 inline-flex items-center justify-center px-6 text-sm font-semibold bg-[#C9A227] text-[#000000] hover:bg-[#D9B43A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors rounded-sm cursor-pointer"
              >
                Buy Now · Order via WhatsApp
              </button>
            </div>

            {/* Technical Specifications Table */}
            <div className="pt-4 border-t border-[#333333]">
              <h3 className="font-sans text-xs uppercase tracking-wider font-semibold text-[#B3B3B3] mb-3">
                Horological Specifications
              </h3>
              <dl className="divide-y divide-[#333333] text-xs">
                <div className="py-2.5 flex justify-between gap-4">
                  <dt className="text-[#B3B3B3]">Movement</dt>
                  <dd className="text-[#FFFFFF] font-medium text-right">
                    {watch.specifications.movement}
                  </dd>
                </div>
                <div className="py-2.5 flex justify-between gap-4">
                  <dt className="text-[#B3B3B3]">Case Dimensions</dt>
                  <dd className="text-[#FFFFFF] font-medium text-right">
                    {watch.specifications.caseDiameter}
                  </dd>
                </div>
                <div className="py-2.5 flex justify-between gap-4">
                  <dt className="text-[#B3B3B3]">Water Resistance</dt>
                  <dd className="text-[#FFFFFF] font-medium text-right">
                    {watch.specifications.waterResistance}
                  </dd>
                </div>
                <div className="py-2.5 flex justify-between gap-4">
                  <dt className="text-[#B3B3B3]">Crystal</dt>
                  <dd className="text-[#FFFFFF] font-medium text-right">
                    {watch.specifications.crystal}
                  </dd>
                </div>
                <div className="py-2.5 flex justify-between gap-4">
                  <dt className="text-[#B3B3B3]">Strap / Bracelet</dt>
                  <dd className="text-[#FFFFFF] font-medium text-right">
                    {watch.specifications.strap}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
