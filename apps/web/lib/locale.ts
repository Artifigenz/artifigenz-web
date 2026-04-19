/**
 * Client-side helpers to detect the user's timezone and currency from
 * the browser, with no external API calls.
 */

// Minimal region → currency lookup for common regions. Extend as needed.
// Falls back to USD if the region is unknown.
const REGION_TO_CURRENCY: Record<string, string> = {
  US: 'USD', CA: 'CAD', MX: 'MXN', BR: 'BRL', AR: 'ARS',
  GB: 'GBP', IE: 'EUR', FR: 'EUR', DE: 'EUR', IT: 'EUR', ES: 'EUR',
  NL: 'EUR', BE: 'EUR', AT: 'EUR', PT: 'EUR', GR: 'EUR', FI: 'EUR',
  LU: 'EUR', MT: 'EUR', CY: 'EUR', EE: 'EUR', LV: 'EUR', LT: 'EUR',
  SK: 'EUR', SI: 'EUR', HR: 'EUR',
  CH: 'CHF', SE: 'SEK', NO: 'NOK', DK: 'DKK', IS: 'ISK',
  PL: 'PLN', CZ: 'CZK', HU: 'HUF', RO: 'RON', BG: 'BGN',
  RU: 'RUB', UA: 'UAH', TR: 'TRY',
  AE: 'AED', SA: 'SAR', IL: 'ILS', EG: 'EGP',
  IN: 'INR', PK: 'PKR', BD: 'BDT', LK: 'LKR', NP: 'NPR',
  CN: 'CNY', HK: 'HKD', TW: 'TWD', JP: 'JPY', KR: 'KRW',
  SG: 'SGD', MY: 'MYR', TH: 'THB', ID: 'IDR', VN: 'VND', PH: 'PHP',
  AU: 'AUD', NZ: 'NZD',
  ZA: 'ZAR', NG: 'NGN', KE: 'KES', GH: 'GHS',
};

export interface DetectedLocale {
  timezone: string;
  locale: string;
  currency: string;
}

export function detectLocale(): DetectedLocale {
  let timezone = 'UTC';
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    /* noop */
  }

  const locale = typeof navigator !== 'undefined' ? navigator.language || 'en-US' : 'en-US';

  let currency = 'USD';
  try {
    const parts = new Intl.Locale(locale);
    const region = parts.maximize().region;
    if (region && REGION_TO_CURRENCY[region]) {
      currency = REGION_TO_CURRENCY[region];
    }
  } catch {
    /* noop */
  }

  return { timezone, locale, currency };
}
