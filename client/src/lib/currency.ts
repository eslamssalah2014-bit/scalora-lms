/**
 * Scalora LMS Currency & Pricing Utility
 * Primary Platform Currency: Egyptian Pound (EGP / ج.م)
 */

export const DEFAULT_CURRENCY = 'EGP';
export const CURRENCY_SYMBOL_EN = 'EGP';
export const CURRENCY_SYMBOL_AR = 'ج.م';

export interface PriceFormattingOptions {
  useArabicSymbol?: boolean;
  showDecimals?: boolean;
  showCurrency?: boolean;
}

/**
 * Format a numeric amount in Egyptian Pounds (EGP)
 * Example: 5000 -> "5,000 EGP" or "5,000 ج.م"
 */
export function formatCurrency(
  amount: number | null | undefined,
  options: PriceFormattingOptions = {}
): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return `0 ${options.useArabicSymbol ? CURRENCY_SYMBOL_AR : CURRENCY_SYMBOL_EN}`;
  }

  const { useArabicSymbol = false, showDecimals = false, showCurrency = true } = options;

  const formattedNumber = amount.toLocaleString('en-US', {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  });

  if (!showCurrency) return formattedNumber;

  const symbol = useArabicSymbol ? CURRENCY_SYMBOL_AR : CURRENCY_SYMBOL_EN;
  return `${formattedNumber} ${symbol}`;
}

/**
 * Calculate discount percentage
 * Formula: ((Base Price - Discounted Price) / Base Price) * 100
 */
export function calculateDiscountPercent(basePrice: number, discountPrice: number): number {
  if (!basePrice || basePrice <= 0 || !discountPrice || discountPrice >= basePrice) {
    return 0;
  }
  return Math.round(((basePrice - discountPrice) / basePrice) * 100);
}

/**
 * Compute effective price, discount percentage, and savings for any course
 */
export function getCoursePricing(course: {
  price?: number;
  basePrice?: number;
  discountPrice?: number;
  discountPercent?: number;
}) {
  const base = typeof course.basePrice === 'number' && course.basePrice > 0
    ? course.basePrice
    : (typeof course.price === 'number' && course.price > 0 ? course.price : 0);

  const discount = typeof course.discountPrice === 'number' && course.discountPrice > 0
    ? course.discountPrice
    : (typeof course.price === 'number' && course.price > 0 ? course.price : base);

  const hasDiscount = discount > 0 && discount < base;
  const effectivePrice = hasDiscount ? discount : base;
  const discountPercent = hasDiscount
    ? (course.discountPercent || calculateDiscountPercent(base, discount))
    : 0;
  const savings = hasDiscount ? base - discount : 0;

  return {
    basePrice: base,
    discountPrice: discount,
    effectivePrice,
    hasDiscount,
    discountPercent,
    savings,
    isFree: effectivePrice === 0,
    formattedBase: formatCurrency(base),
    formattedEffective: effectivePrice === 0 ? 'Free' : formatCurrency(effectivePrice),
    formattedSavings: formatCurrency(savings),
  };
}
