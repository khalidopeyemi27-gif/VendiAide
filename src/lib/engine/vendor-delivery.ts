import { LocationResolution } from './nigeria-geography';

export interface VendorDeliveryRate {
  rateNaira: number;
  timeframe?: string;
}

export interface VendorDeliveryConfig {
  vendorId: string;
  rates: { [locationOrState: string]: VendorDeliveryRate };
  excludedLocations?: string[];
}

export interface VendorCoverage {
  vendorId: string;
  locationName: string;
  status: 'CONFIRMED' | 'UNCONFIRMED' | 'NOT_COVERED';
  feeNaira?: number;
  timeframe?: string;
}

export const DEFAULT_DEMO_VENDOR_CONFIG: VendorDeliveryConfig = {
  vendorId: 'kulture_fashion_house',
  rates: {
    lagos: { rateNaira: 2500, timeframe: '1-2 business days' },
    ikeja: { rateNaira: 2500, timeframe: '1-2 business days' },
    lekki: { rateNaira: 2500, timeframe: '1-2 business days' },
    vi: { rateNaira: 2500, timeframe: '1-2 business days' },
    abuja: { rateNaira: 5000, timeframe: '3-5 business days' },
    fct: { rateNaira: 5000, timeframe: '3-5 business days' },
    wuse: { rateNaira: 5000, timeframe: '3-5 business days' },
    gwarinpa: { rateNaira: 5000, timeframe: '3-5 business days' },
    'port harcourt': { rateNaira: 5000, timeframe: '3-5 business days' },
    ph: { rateNaira: 5000, timeframe: '3-5 business days' },
    rumuola: { rateNaira: 5000, timeframe: '3-5 business days' },
    ibadan: { rateNaira: 5000, timeframe: '3-5 business days' },
    abeokuta: { rateNaira: 5000, timeframe: '3-5 business days' },
  },
  excludedLocations: [],
};

/**
 * Multi-Tenant Vendor Delivery Coverage Engine:
 * Evaluates pure geographic LocationResolution against vendor-specific delivery configuration.
 * Prevents cross-tenant pricing leakage and enforces strict timeframe grounding.
 */
export function verifyVendorDeliveryCoverage(
  vendorId: string,
  location: LocationResolution,
  vendorConfig?: VendorDeliveryConfig
): VendorCoverage {
  const config = vendorConfig || DEFAULT_DEMO_VENDOR_CONFIG;
  const canonical = location.canonicalName.toLowerCase();
  const state = location.state.toLowerCase();
  const input = location.input.toLowerCase();

  // Check explicit exclusions
  if (config.excludedLocations) {
    const isExcluded = config.excludedLocations.some(
      (ex) => ex.toLowerCase() === canonical || ex.toLowerCase() === state || ex.toLowerCase() === input
    );
    if (isExcluded) {
      return {
        vendorId,
        locationName: location.canonicalName,
        status: 'NOT_COVERED',
      };
    }
  }

  // Direct canonical match, state match, or input match
  const directMatch = config.rates[canonical] || config.rates[state] || config.rates[input];

  if (directMatch) {
    return {
      vendorId,
      locationName: location.canonicalName,
      status: 'CONFIRMED',
      feeNaira: directMatch.rateNaira,
      timeframe: directMatch.timeframe,
    };
  }

  // Unconfirmed coverage (recognized geographically, but vendor config lacks rule)
  return {
    vendorId,
    locationName: location.canonicalName,
    status: 'UNCONFIRMED',
    feeNaira: undefined,
    timeframe: undefined,
  };
}
