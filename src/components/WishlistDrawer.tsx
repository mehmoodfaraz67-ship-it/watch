import React, { useEffect } from 'react';
import { Heart, ShoppingBag, Trash2, X } from 'lucide-react';
import { WatchProduct } from '../types';
import { formatCurrency } from '../utils/whatsapp';
import { WatchImage } from './WatchImage';

interface WishlistDrawerProps {
  isOpen: boolean;
  watches: WatchProduct[];
  currencySymbol: string;
  onClose: () => void;
  onRemove: (watchId: string) => void;
  onMoveToCart: (watch: WatchProduct) => void;
  onSelectWatch: (watch: WatchProduct) => void;
}

export const WishlistDrawer: React.FC<WishlistDrawerProps> = ({
  isOpen,
  watches,
  currencySymbol,
  onClose,
  onRemove,
  onMoveToCart,
  onSelectWatch,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Saved Wishlist"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#121212] h-[100dvh] flex flex-col border-l border-[#333333] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 sm:px-6 py-4 bg-[#1C1C1C] border-b border-[#333333] flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold text-[#FFFFFF]">Saved Wishlist</h2>
            <p className="text-xs text-[#B3B3B3] tabular-nums">
              {watches.length} {watches.length === 1 ? 'timepiece' : 'timepieces'} curated
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close wishlist"
            className="w-10 h-10 flex items-center justify-center rounded-sm text-[#B3B3B3] hover:text-[#FFFFFF] hover:bg-[#121212] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {watches.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4">
              <Heart className="w-10 h-10 text-[#C9A227]/60 stroke-[1.25] mb-3" />
              <p className="font-display text-2xl text-[#FFFFFF]">Your wishlist is empty</p>
              <p className="mt-1 text-sm text-[#B3B3B3] max-w-xs">
                Save timepieces while browsing to compare specifications or add them to your bag later.
              </p>
            </div>
          ) : (
            watches.map((watch) => {
              const isOutOfStock = watch.stockStatus === 'Out of Stock' || watch.stockCount <= 0;
              return (
                <div
                  key={watch.id}
                  className="flex gap-4 p-4 bg-[#1C1C1C] border border-[#333333] rounded-sm"
                >
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onSelectWatch(watch);
                    }}
                    className="w-24 h-20 bg-[#000000] rounded-sm overflow-hidden shrink-0 border border-[#333333] cursor-pointer"
                  >
                    <WatchImage
                      src={watch.image}
                      alt={watch.name}
                      className="w-full h-full object-cover"
                    />
                  </button>

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-[#C9A227]">
                        {watch.brand}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onSelectWatch(watch);
                        }}
                        className="text-left font-medium text-sm text-[#FFFFFF] hover:text-[#C9A227] truncate block w-full cursor-pointer"
                      >
                        {watch.name}
                      </button>
                      <p className="mt-1 text-sm font-semibold text-[#FFFFFF] tabular-nums">
                        {formatCurrency(watch.discountedPrice, currencySymbol)}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => onMoveToCart(watch)}
                        className="inline-flex items-center gap-1.5 px-3 min-h-[36px] text-xs font-semibold bg-[#C9A227] text-[#000000] hover:bg-[#D9B43A] disabled:opacity-40 rounded-sm cursor-pointer"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>{isOutOfStock ? 'Out of Stock' : 'Move to Bag'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemove(watch.id)}
                        aria-label={`Remove ${watch.name} from wishlist`}
                        className="p-2 text-[#B3B3B3] hover:text-[#F87171] transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
