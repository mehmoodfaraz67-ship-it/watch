import { CustomerDetails, StoreSettings, WatchProduct } from '../types';

export interface CheckoutLineItem {
  watch: WatchProduct;
  colorName: string;
  quantity: number;
}

export function formatCurrency(amount: number, currencySymbol = 'Rs.'): string {
  const formatted = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
  return currencySymbol === '$' || currencySymbol === '€' || currencySymbol === '£'
    ? `${currencySymbol}${formatted}`
    : `${currencySymbol} ${formatted}`;
}

export function sanitizeWhatsAppNumber(rawNumber: string): string {
  const digits = rawNumber.replace(/[^\d]/g, '');
  if (digits.startsWith('00')) {
    return digits.slice(2);
  }
  return digits;
}

export function buildWhatsAppOrderMessage(
  items: CheckoutLineItem[],
  customer: CustomerDetails,
  settings: StoreSettings
): { message: string; totalAmount: number } {
  const totalAmount = items.reduce(
    (sum, item) => sum + item.watch.discountedPrice * item.quantity,
    0
  );

  const itemLines = items
    .map((item, idx) => {
      const unitFormatted = formatCurrency(item.watch.discountedPrice, settings.currencySymbol);
      const lineTotal = formatCurrency(
        item.watch.discountedPrice * item.quantity,
        settings.currencySymbol
      );
      const prefix = items.length > 1 ? `${idx + 1}. ` : '';
      return [
        `${prefix}- Product: ${item.watch.name} (${item.watch.brand} · ${item.colorName})`,
        `- Quantity: ${item.quantity}`,
        `- Price: ${unitFormatted}`,
        `- Total: ${lineTotal}`,
      ].join('\n');
    })
    .join('\n\n');

  const lines = [
    'Hello! I want to place an order.',
    '',
    '*Order Details:*',
    itemLines,
    '',
    `*Order Grand Total:* ${formatCurrency(totalAmount, settings.currencySymbol)}`,
    '',
    '*Customer Details:*',
    `- Name: ${customer.name.trim()}`,
    `- Phone: ${customer.phone.trim()}`,
    `- Address: ${customer.address.trim()}`,
  ];

  if (customer.note && customer.note.trim()) {
    lines.push(`- Note: ${customer.note.trim()}`);
  }

  lines.push('', 'Please confirm my order. Thank you!');

  return {
    message: lines.join('\n'),
    totalAmount,
  };
}

export function buildWhatsAppUrl(phoneNumber: string, message: string): string {
  const cleanNumber = sanitizeWhatsAppNumber(phoneNumber);
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${cleanNumber}?text=${encoded}`;
}
