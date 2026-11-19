import React, { useState } from 'react';
import { Menu, ShoppingBag, X } from 'lucide-react';

interface NavbarProps {
  businessName: string;
  cartCount: number;
  wishlistCount: number;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenAdmin: () => void;
  onSelectShowcase: (tab: 'all' | 'featured' | 'bestseller' | 'new' | 'offer') => void;
}

export const CrownMark: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    className={className}
  >
    <path
      d="M4 18.5H20M4.5 16L3 7.5L8.2 11.5L12 5L15.8 11.5L21 7.5L19.5 16H4.5Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
    <circle cx="3" cy="6.5" r="1.1" fill="currentColor" />
    <circle cx="12" cy="4" r="1.1" fill="currentColor" />
    <circle cx="21" cy="6.5" r="1.1" fill="currentColor" />
  </svg>
);

export const Navbar: React.FC<NavbarProps> = ({
  businessName,
  cartCount,
  wishlistCount,
  onOpenCart,
  onOpenWishlist,
  onOpenAdmin,
  onSelectShowcase,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const brandDisplay = (businessName || 'ROLEX').trim().toUpperCase();

  const handleCollectionJump = (tab: 'all' | 'featured') => {
    onSelectShowcase(tab);
    setMobileMenuOpen(false);
    const el = document.getElementById('collection');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSectionJump = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 bg-[#000000]/95 backdrop-blur-md border-b border-[#333333]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 sm:gap-8">
        {/* Zone 1: Single-line ROLEX Crown Wordmark */}
        <a
          href="#top"
          className="inline-flex items-center gap-2.5 font-display text-2xl font-semibold tracking-[0.14em] text-[#FFFFFF] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227] rounded-sm"
        >
          <CrownMark className="w-5 h-5 text-[#C9A227] shrink-0" />
          <span>{brandDisplay}</span>
        </a>

        {/* Zone 2: 5 concise single-line navigation links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#B3B3B3]"
        >
          <button
            type="button"
            onClick={() => handleCollectionJump('all')}
            className="hover:text-[#FFFFFF] transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 border-b border-transparent hover:border-[#C9A227]"
          >
            Collection
          </button>
          <button
            type="button"
            onClick={() => handleCollectionJump('featured')}
            className="hover:text-[#FFFFFF] transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 border-b border-transparent hover:border-[#C9A227]"
          >
            Curated
          </button>
          <button
            type="button"
            onClick={() => handleSectionJump('testimonials')}
            className="hover:text-[#FFFFFF] transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 border-b border-transparent hover:border-[#C9A227]"
          >
            Clients
          </button>
          <button
            type="button"
            onClick={onOpenWishlist}
            className="hover:text-[#FFFFFF] transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 border-b border-transparent hover:border-[#C9A227] tabular-nums"
          >
            Wishlist{wishlistCount > 0 ? ` (${wishlistCount})` : ''}
          </button>
          <button
            type="button"
            onClick={onOpenAdmin}
            className="hover:text-[#FFFFFF] transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 border-b border-transparent hover:border-[#C9A227]"
          >
            Manage Store
          </button>
        </nav>

        {/* Zone 3: 1 primary action + mobile hamburger */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onOpenCart}
            className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] text-sm font-semibold bg-[#C9A227] text-[#000000] hover:bg-[#D9B43A] transition-colors rounded-sm whitespace-nowrap shrink-0 cursor-pointer tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFFFFF]"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Bag ({cartCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 text-[#FFFFFF] bg-[#121212] border border-[#333333] rounded-sm hover:border-[#C9A227] transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#121212] border-b border-[#333333] px-4 py-3 space-y-1">
          <button
            type="button"
            onClick={() => handleCollectionJump('all')}
            className="w-full text-left px-3 py-3 text-sm font-medium text-[#FFFFFF] hover:bg-[#1C1C1C] hover:text-[#C9A227] rounded-sm cursor-pointer transition-colors"
          >
            Collection
          </button>
          <button
            type="button"
            onClick={() => handleCollectionJump('featured')}
            className="w-full text-left px-3 py-3 text-sm font-medium text-[#FFFFFF] hover:bg-[#1C1C1C] hover:text-[#C9A227] rounded-sm cursor-pointer transition-colors"
          >
            Curated Pieces
          </button>
          <button
            type="button"
            onClick={() => handleSectionJump('testimonials')}
            className="w-full text-left px-3 py-3 text-sm font-medium text-[#FFFFFF] hover:bg-[#1C1C1C] hover:text-[#C9A227] rounded-sm cursor-pointer transition-colors"
          >
            Client Stories
          </button>
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenWishlist();
            }}
            className="w-full text-left px-3 py-3 text-sm font-medium text-[#FFFFFF] hover:bg-[#1C1C1C] hover:text-[#C9A227] rounded-sm cursor-pointer tabular-nums transition-colors"
          >
            Wishlist ({wishlistCount})
          </button>
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenAdmin();
            }}
            className="w-full text-left px-3 py-3 text-sm font-medium text-[#FFFFFF] hover:bg-[#1C1C1C] hover:text-[#C9A227] rounded-sm cursor-pointer transition-colors"
          >
            Manage Store
          </button>
        </div>
      )}
    </header>
  );
};
