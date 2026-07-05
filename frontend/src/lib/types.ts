export interface District {
  id: string;
  name: string;
  created_at: string;
}

export interface SubDistrict {
  id: string;
  district_id: string;
  name: string;
  created_at: string;
}

export interface Listing {
  id: string;
  sub_district_id: string;
  rent_min: number;
  rent_max: number;
  price: number | null;
  house_type: HouseType;
  description: string | null;
  poster_type: PosterType;
  poster_email: string;
  poster_phone: string | null;
  poster_whatsapp: string | null;
  status: ListingStatus;
  listing_mode: ListingMode;
  property_category: PropertyCategory;
  bedrooms: number | null;
  furnishing: Furnishing | null;
  area_sqft: number | null;
  image_urls: string[];
  expires_at: string;
  renewed_at: string;
  created_at: string;
  flag_count: number;
}

export interface ListingWithLocation extends Listing {
  sub_districts: SubDistrict & { districts: District };
}

export type ListingMode = "rent" | "sell";

export type Furnishing = "unfurnished" | "semi_furnished" | "furnished";

export type PropertyCategory = "residential" | "commercial" | "land";

export const PROPERTY_CATEGORY_LABELS: Record<PropertyCategory, string> = {
  residential: "Residential",
  commercial: "Commercial",
  land: "Land",
};

export const CATEGORY_HOUSE_TYPES: Record<PropertyCategory, HouseType[]> = {
  residential: ["single_room", "pg_room", "1bhk", "2bhk", "3bhk", "4bhk", "apartment", "independent_house", "studio", "villa"],
  commercial: ["apartment", "independent_house", "commercial"],
  land: ["plot", "farm_house"],
};

export const FURNISHING_LABELS: Record<Furnishing, string> = {
  unfurnished: "Unfurnished",
  semi_furnished: "Semi-Furnished",
  furnished: "Furnished",
};

export type HouseType =
  | "single_room"
  | "pg_room"
  | "1bhk"
  | "2bhk"
  | "3bhk"
  | "4bhk"
  | "apartment"
  | "independent_house"
  | "studio"
  | "villa"
  | "plot"
  | "commercial"
  | "farm_house";

export type PosterType = "owner" | "broker";

export type ListingStatus = "active" | "expired" | "flagged" | "rented" | "sold";

export interface ListingFlag {
  id: string;
  listing_id: string;
  flagger_email: string;
  created_at: string;
}

export const HOUSE_TYPE_LABELS: Record<HouseType, string> = {
  single_room: "Single Room",
  pg_room: "PG / Paying Guest",
  "1bhk": "1 BHK",
  "2bhk": "2 BHK",
  "3bhk": "3 BHK",
  "4bhk": "4 BHK",
  apartment: "Apartment",
  independent_house: "Independent House",
  studio: "Studio",
  villa: "Villa",
  plot: "Plot / Land",
  commercial: "Commercial",
  farm_house: "Farm House",
};

export const RENT_HOUSE_TYPES: HouseType[] = [
  "single_room",
  "pg_room",
  "1bhk",
  "2bhk",
  "3bhk",
  "4bhk",
  "apartment",
  "independent_house",
  "studio",
  "villa",
];

export const SELL_HOUSE_TYPES: HouseType[] = [
  "apartment",
  "independent_house",
  "villa",
  "plot",
  "commercial",
  "farm_house",
  "studio",
];

export const LISTING_MODE_LABELS: Record<ListingMode, string> = {
  rent: "For Rent",
  sell: "For Sale",
};
