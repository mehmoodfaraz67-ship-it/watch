import React from 'react';
import { Heart, ShoppingBag } from 'lucide-react';
import { WatchProduct } from '../types';
import { formatCurrency } from '../utils/whatsapp';
import { WatchImage } from './WatchImage';

interface WatchCardProps {
  watch: WatchProduct;
  currencySymbol: string;
  isWishlisted: boolean;
  onToggleWishlist: (watchId: string) => void;
  onAddToCart: (watch: WatchProduct) => void;
  onBuyNow: (watch: WatchProduct) => void;
  onSelectWatch: (watch: WatchProduct) => void;
}

export const WatchCard: React.FC<WatchCardProps> = ({
  watch,
  currencySymbol,
  isWishlisted,
  onToggleWishlist,
  onAddToCart,
  onBuyNow,
  onSelectWatch,
}) => {
  const hasDiscount = watch.originalPrice > watch.discountedPrice;
  const isOutOfStock = watch.stockStatus === 'Out of Stock' || watch.stockCount <= 0;
  const discountPercent = hasDiscount
    ? Math.round(((watch.originalPrice - watch.discountedPrice) / watch.originalPrice) * 100)
    : 0;

  return (
    <article className="group flex flex-col bg-[#1C1C1C] border border-[#333333] rounded-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#C9A227]/60">
      {/* 4:3 Studio Product Photography */}
      <div className="relative aspect-[4/3] overflow-hidden bg-[#121212] border-b border-[#333333]">
        <button
          type="button"
          onClick={() => onSelectWatch(watch)}
          className="w-full h-full block cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#C9A227]"
          aria-label={`View details for ${watch.name}`}
        >
          <WatchImage
            src={watch.image}
            alt={`${watch.brand} ${watch.name}`}
            className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
          />
        </button>

        {/* Wishlist Heart Affordance */}
        <button
          type="button"
          onClick={() => onToggleWishlist(watch.id)}
          aria-label={
            isWishlisted ? `Remove ${watch.name} from wishlist` : `Save ${watch.name} to wishlist`
          }
          className={`absolute top-3 right-3 w-10 h-10 flex items-center justify-center rounded-sm border transition-colors cursor-pointer ${
            isWishlisted
              ? 'bg-[#C9A227] border-[#C9A227] text-[#000000]'
              : 'bg-[#000000]/75 border-[#333333] text-[#B3B3B3] hover:text-[#FFFFFF] hover:border-[#C9A227]'
          }`}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Product Body */}
      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div>
          {/* Unboxed Metadata Line */}
          <div className="flex items-center justify-between gap-2 text-xs text-[#B3B3B3] mb-1.5">
            <span className="uppercase tracking-wider font-medium truncate">
              {watch.brand} <span aria-hidden="true">·</span> {watch.category}
            </span>
            {hasDiscount && (
              <span className="font-mono text-[#C9A227] font-medium shrink-0 tabular-nums">
                -{discountPercent}%
              </span>
            )}
          </div>

          {/* Watch Name */}
          <button
            type="button"
            onClick={() => onSelectWatch(watch)}
            className="text-left block w-full cursor-pointer group/title"
          >
            <h3 className="font-display text-xl font-semibold text-[#FFFFFF] leading-snug group-hover/title:text-[#C9A227] transition-colors line-clamp-1 tracking-wide">
              {watch.name}
            </h3>
          </button>

          {/* Subtle Spec & Color Swatches */}
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-xs text-[#B3B3B3] truncate">{watch.specifications.caseDiameter}</p>
            {watch.colors.length > 0 && (
              <div
                className="flex items-center gap-1.5 shrink-0"
                title={watch.colors.map((c) => c.name).join(', ')}
              >
                {watch.colors.slice(0, 3).map((color) => (
                  <span
                    key={color.name}
                    className="w-3 h-3 rounded-full border border-white/25"
                    style={{ backgroundColor: color.hex }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Price, Stock & Actions */}
        <div className="pt-3 border-t border-[#333333] space-y-3">
          <div className="flex items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-2 tabular-nums">
              <span className="text-base font-semibold text-[#FFFFFF]">
                {formatCurrency(watch.discountedPrice, currencySymbol)}
              </span>
              {hasDiscount && (
                <span className="text-xs text-[#8C8C8C] line-through">
                  {formatCurrency(watch.originalPrice, currencySymbol)}
                </span>
              )}
            </div>
            <span
              className={`text-xs font-medium ${
                isOutOfStock
                  ? 'text-[#F87171]'
                  : watch.stockStatus === 'Low Stock'
                  ? 'text-[#C9A227]'
                  : 'text-[#B3B3B3]'
              }`}
            >
              {isOutOfStock
                ? 'Out of Stock'
                : watch.stockStatus === 'Low Stock'
                ? `Only ${watch.stockCount} left`
                : 'In Stock'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={isOutOfStock}
              onClick={() => onAddToCart(watch)}
              className="inline-flex items-center justify-center gap-1.5 px-3 min-h-[42px] text-xs font-medium border border-[#333333] text-[#FFFFFF] bg-[#121212] hover:border-[#C9A227] hover:text-[#C9A227] disabled:opacity-40 disabled:cursor-not-allowed transition-colors rounded-sm whitespace-nowrap cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
              <span>Add to Bag</span>
            </button>
            <button
              type="button"
              disabled={isOutOfStock}
              onClick={() => onBuyNow(watch)}
              className="inline-flex items-center justify-center px-3 min-h-[42px] text-xs font-semibold bg-[#C9A227] text-[#000000] hover:bg-[#D9B43A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors rounded-sm whitespace-nowrap cursor-pointer"
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
