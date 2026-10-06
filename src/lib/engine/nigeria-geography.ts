export type RegionType =
  | 'STATE'
  | 'FCT'
  | 'CITY'
  | 'LGA'
  | 'DISTRICT'
  | 'NEIGHBORHOOD'
  | 'ESTATE'
  | 'LANDMARK';

export interface NigerianLocationInfo {
  canonicalName: string;
  displayName: string;
  state: string;
  lga?: string;
  regionType: RegionType;
  isCapital: boolean;
  aliases: string[];
}

export interface LocationResolution {
  input: string;
  canonicalName: string;
  displayName: string;
  parsed: string;
  state: string;
  lga?: string;
  regionType: RegionType;
  confidence: number;
  matchedAlias: string;
  locationAmbiguous?: boolean;
  possibleLocations?: LocationResolution[];
}

// Compile-Time Type-Level Negative Assertion Guard for Location Purity
type ForbiddenLocationFields = 'vendorCoverage' | 'feeNaira' | 'timeframe' | 'vendorId';
type AssertNoForbiddenFields<T> = Extract<keyof T, ForbiddenLocationFields> extends never ? true : never;
export const locationTypePurityCheck: AssertNoForbiddenFields<LocationResolution> = true;

export interface ResolvedNigerianLocation extends LocationResolution {
  name: string; // Backward compatibility alias for canonicalName
  isState?: boolean;
  isCapital?: boolean;
}

export const NIGERIAN_STATES: { [key: string]: { capital: string; state: string } } = {
  abia: { state: 'Abia', capital: 'Umuahia' },
  adamawa: { state: 'Adamawa', capital: 'Yola' },
  'akwa ibom': { state: 'Akwa Ibom', capital: 'Uyo' },
  anambra: { state: 'Anambra', capital: 'Awka' },
  bauchi: { state: 'Bauchi', capital: 'Bauchi' },
  bayelsa: { state: 'Bayelsa', capital: 'Yenagoa' },
  benue: { state: 'Benue', capital: 'Makurdi' },
  borno: { state: 'Borno', capital: 'Maiduguri' },
  'cross river': { state: 'Cross River', capital: 'Calabar' },
  delta: { state: 'Delta', capital: 'Asaba' },
  ebonyi: { state: 'Ebonyi', capital: 'Abakaliki' },
  edo: { state: 'Edo', capital: 'Benin City' },
  ekiti: { state: 'Ekiti', capital: 'Ado-Ekiti' },
  enugu: { state: 'Enugu', capital: 'Enugu' },
  gombe: { state: 'Gombe', capital: 'Gombe' },
  imo: { state: 'Imo', capital: 'Owerri' },
  jigawa: { state: 'Jigawa', capital: 'Dutse' },
  kaduna: { state: 'Kaduna', capital: 'Kaduna' },
  kano: { state: 'Kano', capital: 'Kano' },
  katsina: { state: 'Katsina', capital: 'Katsina' },
  kebbi: { state: 'Kebbi', capital: 'Birnin Kebbi' },
  kogi: { state: 'Kogi', capital: 'Lokoja' },
  kwara: { state: 'Kwara', capital: 'Ilorin' },
  lagos: { state: 'Lagos', capital: 'Ikeja' },
  nasarawa: { state: 'Nasarawa', capital: 'Lafia' },
  niger: { state: 'Niger', capital: 'Minna' },
  ogun: { state: 'Ogun', capital: 'Abeokuta' },
  ondo: { state: 'Ondo', capital: 'Akure' },
  osun: { state: 'Osun', capital: 'Osogbo' },
  oyo: { state: 'Oyo', capital: 'Ibadan' },
  plateau: { state: 'Plateau', capital: 'Jos' },
  rivers: { state: 'Rivers', capital: 'Port Harcourt' },
  sokoto: { state: 'Sokoto', capital: 'Sokoto' },
  taraba: { state: 'Taraba', capital: 'Jalingo' },
  yobe: { state: 'Yobe', capital: 'Damaturu' },
  zamfara: { state: 'Zamfara', capital: 'Gusau' },
  fct: { state: 'FCT', capital: 'Abuja' },
};

const GEOGRAPHIC_ENTRIES: NigerianLocationInfo[] = [
  // FCT & Neighborhoods / Districts / Area Councils
  { canonicalName: 'Abuja', displayName: 'Abuja, FCT', state: 'FCT', lga: 'AMAC', regionType: 'CITY', isCapital: true, aliases: ['abuja', 'abj', 'fct', 'fct abuja'] },
  { canonicalName: 'Gwarinpa', displayName: 'Gwarinpa, Abuja', state: 'FCT', lga: 'AMAC', regionType: 'NEIGHBORHOOD', isCapital: false, aliases: ['gwarinpa', 'gwarimpa', 'gwarinpa abuja', 'around gwarinpa'] },
  { canonicalName: 'Maitama', displayName: 'Maitama, Abuja', state: 'FCT', lga: 'AMAC', regionType: 'DISTRICT', isCapital: false, aliases: ['maitama'] },
  { canonicalName: 'Asokoro', displayName: 'Asokoro, Abuja', state: 'FCT', lga: 'AMAC', regionType: 'DISTRICT', isCapital: false, aliases: ['asokoro'] },
  { canonicalName: 'Wuse', displayName: 'Wuse, Abuja', state: 'FCT', lga: 'AMAC', regionType: 'DISTRICT', isCapital: false, aliases: ['wuse', 'wuse 2', 'wuse ii', 'around wuse'] },
  { canonicalName: 'Garki', displayName: 'Garki, Abuja', state: 'FCT', lga: 'AMAC', regionType: 'DISTRICT', isCapital: false, aliases: ['garki', 'garki 2', 'garki ii'] },
  { canonicalName: 'Jabi', displayName: 'Jabi, Abuja', state: 'FCT', lga: 'AMAC', regionType: 'DISTRICT', isCapital: false, aliases: ['jabi'] },
  { canonicalName: 'Utako', displayName: 'Utako, Abuja', state: 'FCT', lga: 'AMAC', regionType: 'DISTRICT', isCapital: false, aliases: ['utako'] },
  { canonicalName: 'Kubwa', displayName: 'Kubwa, Abuja', state: 'FCT', lga: 'Bwari', regionType: 'DISTRICT', isCapital: false, aliases: ['kubwa'] },
  { canonicalName: 'Lugbe', displayName: 'Lugbe, Abuja', state: 'FCT', lga: 'AMAC', regionType: 'DISTRICT', isCapital: false, aliases: ['lugbe'] },
  { canonicalName: 'Life Camp', displayName: 'Life Camp, Abuja', state: 'FCT', lga: 'AMAC', regionType: 'DISTRICT', isCapital: false, aliases: ['life camp', 'lifecamp'] },

  // Lagos & Neighborhoods / LGAs / Estates
  { canonicalName: 'Lagos', displayName: 'Lagos State', state: 'Lagos', lga: undefined, regionType: 'STATE', isCapital: false, aliases: ['lagos', 'lasgidi', 'eko'] },
  { canonicalName: 'Ikeja', displayName: 'Ikeja, Lagos', state: 'Lagos', lga: 'Ikeja LGA', regionType: 'LGA', isCapital: true, aliases: ['ikeja'] },
  { canonicalName: 'Lekki', displayName: 'Lekki, Lagos', state: 'Lagos', lga: 'Eti-Osa', regionType: 'NEIGHBORHOOD', isCapital: false, aliases: ['lekki', 'lekki phase 1', 'lekki phase one', 'chevron lekki', 'send to lekki', 'bring am come lekki'] },
  { canonicalName: 'VI', displayName: 'Victoria Island, Lagos', state: 'Lagos', lga: 'Eti-Osa', regionType: 'NEIGHBORHOOD', isCapital: false, aliases: ['victoria island', 'vi', 'v.i', 'v.i.', 'v i', 'around vi', 'bring am come vi'] },
  { canonicalName: 'Yaba', displayName: 'Yaba, Lagos', state: 'Lagos', lga: 'Lagos Mainland', regionType: 'DISTRICT', isCapital: false, aliases: ['yaba', 'akoka'] },
  { canonicalName: 'Surulere', displayName: 'Surulere, Lagos', state: 'Lagos', lga: 'Surulere LGA', regionType: 'LGA', isCapital: false, aliases: ['surulere'] },
  { canonicalName: 'Ikoyi', displayName: 'Ikoyi, Lagos', state: 'Lagos', lga: 'Eti-Osa', regionType: 'NEIGHBORHOOD', isCapital: false, aliases: ['ikoyi', 'banana island'] },
  { canonicalName: 'Ajah', displayName: 'Ajah, Lagos', state: 'Lagos', lga: 'Eti-Osa', regionType: 'DISTRICT', isCapital: false, aliases: ['ajah', 'sangotedo', 'badore'] },
  { canonicalName: 'Ikorodu', displayName: 'Ikorodu, Lagos', state: 'Lagos', lga: 'Ikorodu LGA', regionType: 'LGA', isCapital: false, aliases: ['ikorodu'] },
  { canonicalName: 'Festac', displayName: 'Festac, Lagos', state: 'Lagos', lga: 'Amuwo-Odofin', regionType: 'DISTRICT', isCapital: false, aliases: ['festac', 'festac town'] },
  { canonicalName: 'Maryland', displayName: 'Maryland, Lagos', state: 'Lagos', lga: 'Kosofe', regionType: 'DISTRICT', isCapital: false, aliases: ['maryland'] },
  { canonicalName: 'Agege', displayName: 'Agege, Lagos', state: 'Lagos', lga: 'Agege LGA', regionType: 'LGA', isCapital: false, aliases: ['agege'] },
  { canonicalName: 'Gbagada', displayName: 'Gbagada, Lagos', state: 'Lagos', lga: 'Kosofe', regionType: 'DISTRICT', isCapital: false, aliases: ['gbagada'] },
  { canonicalName: 'Ojuelegba', displayName: 'Ojuelegba, Lagos', state: 'Lagos', lga: 'Surulere LGA', regionType: 'DISTRICT', isCapital: false, aliases: ['ojuelegba'] },
  { canonicalName: 'Oshodi', displayName: 'Oshodi, Lagos', state: 'Lagos', lga: 'Oshodi-Isolo', regionType: 'LGA', isCapital: false, aliases: ['oshodi'] },
  { canonicalName: 'Apapa', displayName: 'Apapa, Lagos', state: 'Lagos', lga: 'Apapa LGA', regionType: 'LGA', isCapital: false, aliases: ['apapa'] },
  { canonicalName: 'Ebute Metta', displayName: 'Ebute Metta, Lagos', state: 'Lagos', lga: 'Lagos Mainland', regionType: 'DISTRICT', isCapital: false, aliases: ['ebute metta', 'ebute-metta'] },
  { canonicalName: 'Mushin', displayName: 'Mushin, Lagos', state: 'Lagos', lga: 'Mushin LGA', regionType: 'LGA', isCapital: false, aliases: ['mushin'] },
  { canonicalName: 'Epe', displayName: 'Epe, Lagos', state: 'Lagos', lga: 'Epe LGA', regionType: 'LGA', isCapital: false, aliases: ['epe'] },
  { canonicalName: 'Badagry', displayName: 'Badagry, Lagos', state: 'Lagos', lga: 'Badagry LGA', regionType: 'LGA', isCapital: false, aliases: ['badagry'] },

  // Rivers State & Port Harcourt
  { canonicalName: 'PH', displayName: 'Port Harcourt, Rivers', state: 'Rivers', lga: 'Port Harcourt LGA', regionType: 'CITY', isCapital: true, aliases: ['port harcourt', 'ph', 'porthacourt', 'portharcourt', 'ph city', 'port-harcourt', 'phc', 'p/h', 'i dey ph', 'i dey port harcourt', 'i dey stay ph', 'send am ph', 'send am to ph', 'bring am come ph', 'make una send am ph', 'una dey deliver ph?'] },
  { canonicalName: 'PH', displayName: 'Rumuola, Port Harcourt, Rivers', state: 'Rivers', lga: 'Obio-Akpor', regionType: 'DISTRICT', isCapital: false, aliases: ['rumuola', 'around rumuola'] },
  { canonicalName: 'Rivers', displayName: 'Rivers State', state: 'Rivers', lga: undefined, regionType: 'STATE', isCapital: false, aliases: ['rivers', 'rivers state'] },

  // Oyo State
  { canonicalName: 'Ibadan', displayName: 'Ibadan, Oyo', state: 'Oyo', lga: 'Ibadan North', regionType: 'CITY', isCapital: true, aliases: ['ibadan', 'ibd'] },
  { canonicalName: 'Oyo', displayName: 'Oyo State', state: 'Oyo', lga: undefined, regionType: 'STATE', isCapital: false, aliases: ['oyo', 'oyo state', 'ogbomoso'] },

  // Ogun State
  { canonicalName: 'Abeokuta', displayName: 'Abeokuta, Ogun', state: 'Ogun', lga: 'Abeokuta South', regionType: 'CITY', isCapital: true, aliases: ['abeokuta'] },
  { canonicalName: 'Ogun', displayName: 'Ogun State', state: 'Ogun', lga: undefined, regionType: 'STATE', isCapital: false, aliases: ['ogun', 'ogun state', 'ijebu ode', 'sagamu', 'sango ota'] },

  // Edo State
  { canonicalName: 'Benin City', displayName: 'Benin City, Edo', state: 'Edo', lga: 'Oredo', regionType: 'CITY', isCapital: true, aliases: ['benin', 'benin city', 'bnc'] },
  { canonicalName: 'Edo', displayName: 'Edo State', state: 'Edo', lga: undefined, regionType: 'STATE', isCapital: false, aliases: ['edo', 'edo state'] },

  // Delta State
  { canonicalName: 'Asaba', displayName: 'Asaba, Delta', state: 'Delta', lga: 'Oshimili South', regionType: 'CITY', isCapital: true, aliases: ['asaba'] },
  { canonicalName: 'Warri', displayName: 'Warri, Delta', state: 'Delta', lga: 'Warri South', regionType: 'CITY', isCapital: false, aliases: ['warri', 'effurun'] },
  { canonicalName: 'Delta', displayName: 'Delta State', state: 'Delta', lga: undefined, regionType: 'STATE', isCapital: false, aliases: ['delta', 'delta state'] },

  // Kano State
  { canonicalName: 'Kano', displayName: 'Kano, Kano State', state: 'Kano', lga: 'Kano Municipal', regionType: 'CITY', isCapital: true, aliases: ['kano', 'kano city'] },
  { canonicalName: 'Kano', displayName: 'Kano State', state: 'Kano', lga: undefined, regionType: 'STATE', isCapital: false, aliases: ['kano state'] },

  // Kaduna State
  { canonicalName: 'Kaduna', displayName: 'Kaduna, Kaduna State', state: 'Kaduna', lga: 'Kaduna North', regionType: 'CITY', isCapital: true, aliases: ['kaduna', 'zaria', 'kdn'] },
  { canonicalName: 'Kaduna', displayName: 'Kaduna State', state: 'Kaduna', lga: undefined, regionType: 'STATE', isCapital: false, aliases: ['kaduna state'] },

  // Enugu State
  { canonicalName: 'Enugu', displayName: 'Enugu, Enugu State', state: 'Enugu', lga: 'Enugu North', regionType: 'CITY', isCapital: true, aliases: ['enugu', '042', 'nsukka'] },
  { canonicalName: 'Enugu', displayName: 'Enugu State', state: 'Enugu', lga: undefined, regionType: 'STATE', isCapital: false, aliases: ['enugu state'] },

  // Plateau State
  { canonicalName: 'Jos', displayName: 'Jos, Plateau', state: 'Plateau', lga: 'Jos North', regionType: 'CITY', isCapital: true, aliases: ['jos', 'j-town'] },
  { canonicalName: 'Plateau', displayName: 'Plateau State', state: 'Plateau', lga: undefined, regionType: 'STATE', isCapital: false, aliases: ['plateau', 'plateau state'] },

  // Kwara State
  { canonicalName: 'Ilorin', displayName: 'Ilorin, Kwara', state: 'Kwara', lga: 'Ilorin West', regionType: 'CITY', isCapital: true, aliases: ['ilorin'] },
  { canonicalName: 'Kwara', displayName: 'Kwara State', state: 'Kwara', lga: undefined, regionType: 'STATE', isCapital: false, aliases: ['kwara', 'kwara state'] },

  // Ondo State
  { canonicalName: 'Akure', displayName: 'Akure, Ondo', state: 'Ondo', lga: 'Akure South', regionType: 'CITY', isCapital: true, aliases: ['akure'] },
  { canonicalName: 'Ondo', displayName: 'Ondo State', state: 'Ondo', lga: undefined, regionType: 'STATE', isCapital: false, aliases: ['ondo', 'ondo state'] },

  // Imo State
  { canonicalName: 'Owerri', displayName: 'Owerri, Imo', state: 'Imo', lga: 'Owerri Municipal', regionType: 'CITY', isCapital: true, aliases: ['owerri'] },
  { canonicalName: 'Imo', displayName: 'Imo State', state: 'Imo', lga: undefined, regionType: 'STATE', isCapital: false, aliases: ['imo', 'imo state'] },

  // Akwa Ibom State
  { canonicalName: 'Uyo', displayName: 'Uyo, Akwa Ibom', state: 'Akwa Ibom', lga: 'Uyo LGA', regionType: 'CITY', isCapital: true, aliases: ['uyo'] },
  { canonicalName: 'Akwa Ibom', displayName: 'Akwa Ibom State', state: 'Akwa Ibom', lga: undefined, regionType: 'STATE', isCapital: false, aliases: ['akwa ibom', 'akwa ibom state', 'eket'] },

  // Cross River State
  { canonicalName: 'Calabar', displayName: 'Calabar, Cross River', state: 'Cross River', lga: 'Calabar Municipal', regionType: 'CITY', isCapital: true, aliases: ['calabar'] },
  { canonicalName: 'Cross River', displayName: 'Cross River State', state: 'Cross River', lga: undefined, regionType: 'STATE', isCapital: false, aliases: ['cross river', 'cross river state'] },

  // Anambra State
  { canonicalName: 'Awka', displayName: 'Awka, Anambra', state: 'Anambra', lga: 'Awka South', regionType: 'CITY', isCapital: true, aliases: ['awka'] },
  { canonicalName: 'Onitsha', displayName: 'Onitsha, Anambra', state: 'Anambra', lga: 'Onitsha North', regionType: 'CITY', isCapital: false, aliases: ['onitsha'] },
  { canonicalName: 'Anambra', displayName: 'Anambra State', state: 'Anambra', lga: undefined, regionType: 'STATE', isCapital: false, aliases: ['anambra', 'anambra state', 'nnewi'] },

  // Abia State
  { canonicalName: 'Umuahia', displayName: 'Umuahia, Abia', state: 'Abia', lga: 'Umuahia North', regionType: 'CITY', isCapital: true, aliases: ['umuahia'] },
  { canonicalName: 'Aba', displayName: 'Aba, Abia', state: 'Abia', lga: 'Aba South', regionType: 'CITY', isCapital: false, aliases: ['aba'] },
  { canonicalName: 'Abia', displayName: 'Abia State', state: 'Abia', lga: undefined, regionType: 'STATE', isCapital: false, aliases: ['abia', 'abia state'] },

  // Adamawa State
  { canonicalName: 'Yola', displayName: 'Yola, Adamawa', state: 'Adamawa', lga: 'Yola North', regionType: 'CITY', isCapital: true, aliases: ['yola'] },
  { canonicalName: 'Adamawa', displayName: 'Adamawa State', state: 'Adamawa', lga: undefined, regionType: 'STATE', isCapital: false, aliases: ['adamawa', 'adamawa state'] },

  // Bauchi State
  { canonicalName: 'Bauchi', displayName: 'Bauchi, Bauchi State', state: 'Bauchi', lga: 'Bauchi LGA', regionType: 'CITY', isCapital: true, aliases: ['bauchi', 'bauchi state'] },

  // Bayelsa State
  { canonicalName: 'Yenagoa', displayName: 'Yenagoa, Bayelsa', state: 'Bayelsa', lga: 'Yenagoa LGA', regionType: 'CITY', isCapital: true, aliases: ['yenagoa'] },
  { canonicalName: 'Bayelsa', displayName: 'Bayelsa State', state: 'Bayelsa', lga: undefined, regionType: 'STATE', isCapital: false, aliases: ['bayelsa', 'bayelsa state'] },

  // Benue State
  { canonicalName: 'Makurdi', displayName: 'Makurdi, Benue', state: 'Benue', lga: 'Makurdi LGA', regionType: 'CITY', isCapital: true, aliases: ['makurdi'] },
  { canonicalName: 'Benue', displayName: 'Benue State', state: 'Benue', lga: undefined, regionType: 'STATE', isCapital: false, aliases: ['benue', 'benue state'] },

  // Borno State
  { canonicalName: 'Maiduguri', displayName: 'Maiduguri, Borno', state: 'Borno', lga: 'Maiduguri Metropolitan', regionType: 'CITY', isCapital: true, aliases: ['maiduguri'] },
  { canonicalName: 'Borno', displayName: 'Borno State', state: 'Borno', lga: undefined, regionType: 'STATE', isCapital: false, aliases: ['borno', 'borno state'] },

  // Ebonyi State
  { canonicalName: 'Abakaliki', displayName: 'Abakaliki, Ebonyi', state: 'Ebonyi', lga: 'Abakaliki LGA', regionType: 'CITY', isCapital: true, aliases: ['abakaliki'] },
  { canonicalName: 'Ebonyi', displayName: 'Ebonyi State', state: 'Ebonyi', lga: undefined, regionType: 'STATE', isCapital: false, aliases: ['ebonyi', 'ebonyi state'] },

  // Ekiti State
  { canonicalName: 'Ado-Ekiti', displayName: 'Ado-Ekiti, Ekiti', state: 'Ekiti', lga: 'Ado-Ekiti LGA', regionType: 'CITY', isCapital: true, aliases: ['ado-ekiti', 'ado ekiti', 'ado'] },
  { canonicalName: 'Ekiti', displayName: 'Ekiti State', state: 'Ekiti', lga: undefined, regionType: 'STATE', isCapital: false, aliases: ['ekiti', 'ekiti state'] },

  // Gombe State
  { canonicalName: 'Gombe', displayName: 'Gombe, Gombe State', state: 'Gombe', lga: 'Gombe LGA', regionType: 'CITY', isCapital: true, aliases: ['gombe', 'gombe state'] },

  // Jigawa State
  { canonicalName: 'Dutse', displayName: 'Dutse, Jigawa', state: 'Jigawa', lga: 'Dutse LGA', regionType: 'CITY', isCapital: true, aliases: ['dutse'] },
  { canonicalName: 'Jigawa', displayName: 'Jigawa State', state: 'Jigawa', lga: undefined, regionType: 'STATE', isCapital: false, aliases: ['jigawa', 'jigawa state'] },

  // Katsina State
  { canonicalName: 'Katsina', displayName: 'Katsina, Katsina State', state: 'Katsina', lga: 'Katsina LGA', regionType: 'CITY', isCapital: true, aliases: ['katsina', 'katsina state'] },

  // Kebbi State
  { canonicalName: 'Birnin Kebbi', displayName: 'Birnin Kebbi, Kebbi', state: 'Kebbi', lga: 'Birnin Kebbi LGA', regionType: 'CITY', isCapital: true, aliases: ['birnin kebbi', 'birnin-kebbi'] },
  { canonicalName: 'Kebbi', displayName: 'Kebbi State', state: 'Kebbi', lga: undefined, regionType: 'STATE', isCapital: false, aliases: ['kebbi', 'kebbi state'] },

  // Kogi State
  { canonicalName: 'Lokoja', displayName: 'Lokoja, Kogi', state: 'Kogi', lga: 'Lokoja LGA', regionType: 'CITY', isCapital: true, aliases: ['lokoja'] },
  { canonicalName: 'Kogi', displayName: 'Kogi State', state: 'Kogi', lga: undefined, regionType: 'STATE', isCapital: false, aliases: ['kogi', 'kogi state'] },

  // Nasarawa State
  { canonicalName: 'Lafia', displayName: 'Lafia, Nasarawa', state: 'Nasarawa', lga: 'Lafia LGA', regionType: 'CITY', isCapital: true, aliases: ['lafia'] },
  { canonicalName: 'Nasarawa', displayName: 'Nasarawa State', state: 'Nasarawa', lga: undefined, regionType: 'STATE', isCapital: false, aliases: ['nasarawa', 'nasarawa state'] },

  // Niger State
  { canonicalName: 'Minna', displayName: 'Minna, Niger', state: 'Niger', lga: 'Chanchaga', regionType: 'CITY', isCapital: true, aliases: ['minna'] },
  { canonicalName: 'Niger', displayName: 'Niger State', state: 'Niger', lga: undefined, regionType: 'STATE', isCapital: false, aliases: ['niger state'] },

  // Osun State
  { canonicalName: 'Osogbo', displayName: 'Osogbo, Osun', state: 'Osun', lga: 'Osogbo LGA', regionType: 'CITY', isCapital: true, aliases: ['osogbo', 'oshogbo'] },
  { canonicalName: 'Osun', displayName: 'Osun State', state: 'Osun', lga: undefined, regionType: 'STATE', isCapital: false, aliases: ['osun', 'osun state', 'ile-ife', 'ife'] },

  // Sokoto State
  { canonicalName: 'Sokoto', displayName: 'Sokoto, Sokoto State', state: 'Sokoto', lga: 'Sokoto North', regionType: 'CITY', isCapital: true, aliases: ['sokoto', 'sokoto state'] },

  // Taraba State
  { canonicalName: 'Jalingo', displayName: 'Jalingo, Taraba', state: 'Taraba', lga: 'Jalingo LGA', regionType: 'CITY', isCapital: true, aliases: ['jalingo'] },
  { canonicalName: 'Taraba', displayName: 'Taraba State', state: 'Taraba', lga: undefined, regionType: 'STATE', isCapital: false, aliases: ['taraba', 'taraba state'] },

  // Yobe State
  { canonicalName: 'Damaturu', displayName: 'Damaturu, Yobe', state: 'Yobe', lga: 'Damaturu LGA', regionType: 'CITY', isCapital: true, aliases: ['damaturu'] },
  { canonicalName: 'Yobe', displayName: 'Yobe State', state: 'Yobe', lga: undefined, regionType: 'STATE', isCapital: false, aliases: ['yobe', 'yobe state'] },

  // Zamfara State
  { canonicalName: 'Gusau', displayName: 'Gusau, Zamfara', state: 'Zamfara', lga: 'Gusau LGA', regionType: 'CITY', isCapital: true, aliases: ['gusau'] },
  { canonicalName: 'Zamfara', displayName: 'Zamfara State', state: 'Zamfara', lga: undefined, regionType: 'STATE', isCapital: false, aliases: ['zamfara', 'zamfara state'] },
];

/**
 * Pure National Geography Resolver.
 * Resolves input text strictly to geographic identity (canonical name, state, lga, regionType, confidence).
 * DOES NOT inject vendor-specific delivery pricing or coverage.
 * ONLY THE VENDOR CONFIGURATION CAN DETERMINE DELIVERY PRICE.
 */
export function resolveNigerianLocation(
  msgText: string,
  aiAskedForLocation?: boolean
): ResolvedNigerianLocation | undefined {
  const normalized = msgText.toLowerCase().trim();

  // Handle ambiguous location queries (e.g. standalone "victoria" without island context)
  if (/\bvictoria\b/i.test(normalized) && !/\b(island|vgc|garden)\b/i.test(normalized)) {
    return {
      input: msgText,
      name: 'VI',
      canonicalName: 'VI',
      displayName: 'Victoria Island, Lagos',
      parsed: 'Victoria Island, Lagos',
      state: 'Lagos',
      lga: 'Eti-Osa',
      regionType: 'NEIGHBORHOOD',
      confidence: 0.5,
      matchedAlias: normalized,
      locationAmbiguous: true,
      possibleLocations: [
        {
          input: msgText,
          canonicalName: 'VI',
          displayName: 'Victoria Island, Lagos',
          parsed: 'Victoria Island, Lagos',
          state: 'Lagos',
          lga: 'Eti-Osa',
          regionType: 'NEIGHBORHOOD',
          confidence: 0.9,
          matchedAlias: 'victoria island',
        },
        {
          input: msgText,
          canonicalName: 'VGC',
          displayName: 'Victoria Garden City, Lagos',
          parsed: 'Victoria Garden City, Lagos',
          state: 'Lagos',
          lga: 'Eti-Osa',
          regionType: 'ESTATE',
          confidence: 0.8,
          matchedAlias: 'victoria garden city',
        },
      ],
    };
  }

  // Strip Pidgin / conversational prefixes to isolate location
  const cleanText = normalized
    .replace(/\b(i\s+dey|i\s+stay|i\s+live|deliver|send|ship|bring\s+am|make\s+una\s+bring\s+am|make\s+una\s+send\s+am|take\s+am|how\s+much|how\s+long|cost|rate|for|to|in|at|around|reach|make\s+you|abeg|una\s+dey|you\s+fit)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const hasExplicitContext =
    /\b(?:deliver(?:y|ed)?|send|going|ship|post|bring|take|cost|rate|fee|how\s+much\s+to|deliver\s+to|address|stay\s+for|live\s+for|dey\s+for|dey\s+in|dey|stay\s+in|live\s+in|based\s+in|address\s+is|to|go)\b/i.test(normalized) ||
    aiAskedForLocation;

  // Flatten entries and aliases, sorted by alias length descending
  const allAliasPairs: { entry: NigerianLocationInfo; alias: string }[] = [];
  for (const entry of GEOGRAPHIC_ENTRIES) {
    for (const alias of entry.aliases) {
      allAliasPairs.push({ entry, alias });
    }
  }
  allAliasPairs.sort((a, b) => b.alias.length - a.alias.length);

  for (const { entry, alias } of allAliasPairs) {
    const escapedAlias = alias.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const aliasRegex = new RegExp(`(?:^|[^a-zA-Z0-9-])${escapedAlias}(?:$|[^a-zA-Z0-9-])`, 'i');

    if (aliasRegex.test(normalized) || aliasRegex.test(cleanText)) {
      const wordCount = msgText.trim().split(/\s+/).length;
      if (hasExplicitContext || wordCount <= 5 || alias === normalized) {
        return {
          input: msgText,
          name: entry.canonicalName,
          canonicalName: entry.canonicalName,
          displayName: entry.displayName,
          parsed: entry.displayName,
          state: entry.state,
          lga: entry.lga,
          regionType: entry.regionType,
          isState: entry.regionType === 'STATE',
          isCapital: entry.isCapital,
          confidence: alias === normalized ? 0.98 : 0.9,
          matchedAlias: alias,
        };
      }
    }
  }

  return undefined;
}
