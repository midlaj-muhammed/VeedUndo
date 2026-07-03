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
  house_type: HouseType;
  description: string | null;
  poster_type: PosterType;
  poster_email: string;
  poster_phone: string | null;
  poster_whatsapp: string | null;
  status: ListingStatus;
  image_urls: string[];
  expires_at: string;
  renewed_at: string;
  created_at: string;
  flag_count: number;
}

export interface ListingWithLocation extends Listing {
  sub_districts: SubDistrict & { districts: District };
}

export type HouseType =
  | "single_room"
  | "1bhk"
  | "2bhk"
  | "3bhk"
  | "4bhk"
  | "villa";

export type PosterType = "owner" | "broker";

export type ListingStatus = "active" | "expired" | "flagged" | "rented";

export interface ListingFlag {
  id: string;
  listing_id: string;
  flagger_email: string;
  created_at: string;
}

export const HOUSE_TYPE_LABELS: Record<HouseType, string> = {
  single_room: "Single Room",
  "1bhk": "1 BHK",
  "2bhk": "2 BHK",
  "3bhk": "3 BHK",
  "4bhk": "4 BHK",
  villa: "Villa",
};
