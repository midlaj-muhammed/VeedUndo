import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import ListingDetailClient from "@/components/ListingDetailClient";
import { HOUSE_TYPE_LABELS, type HouseType } from "@/lib/types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { data: listing } = await supabase
    .from("listings")
    .select("*, sub_districts(*, districts(*))")
    .eq("id", id)
    .single();

  if (!listing) return { title: "Listing not found" };

  const subDistrict = listing.sub_districts;
  const district = subDistrict?.districts;
  const locationText = subDistrict ? (district ? `${subDistrict.name}, ${district.name}` : subDistrict.name) : district?.name || "";
  const houseType = HOUSE_TYPE_LABELS[listing.house_type as HouseType] || "Property";
  const isSell = listing.listing_mode === "sell";
  const title = isSell && listing.price
    ? `₹${listing.price.toLocaleString("en-IN")} ${houseType} in ${locationText} | For Sale`
    : `₹${listing.rent_min.toLocaleString("en-IN")}–${listing.rent_max.toLocaleString("en-IN")}/mo ${houseType} in ${locationText}`;
  const description = listing.description || isSell
    ? `${houseType} for sale in ${locationText}. ₹${listing.price?.toLocaleString("en-IN")} on VeedUndo.`
    : `${houseType} for rent in ${locationText}. ₹${listing.rent_min.toLocaleString("en-IN")}–${listing.rent_max.toLocaleString("en-IN")} per month on VeedUndo.`;
  const imageUrl = listing.image_urls?.[0];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://veedundo.com/listing/${id}`,
      siteName: "VeedUndo",
      images: imageUrl ? [{ url: imageUrl, width: 1200, height: 630 }] : [],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
  };
}

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: listing } = await supabase
    .from("listings")
    .select("*, sub_districts(*, districts(*))")
    .eq("id", id)
    .single();

  const houseType = HOUSE_TYPE_LABELS[listing.house_type as HouseType] || "Property";
  const locationText = listing.sub_districts ? (listing.sub_districts.districts ? `${listing.sub_districts.name}, ${listing.sub_districts.districts.name}` : listing.sub_districts.name) : "";
  const isSell = listing.listing_mode === "sell";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${houseType} in ${locationText}`,
    description: listing.description || `${houseType} for ${isSell ? "sale" : "rent"} in ${locationText}`,
    image: listing.image_urls?.[0],
    offers: {
      "@type": "Offer",
      price: isSell ? listing.price : listing.rent_min,
      priceCurrency: "INR",
      availability: listing.status === "active" ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      ...(isSell ? {} : {
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: listing.rent_min,
          priceCurrency: "INR",
          billingDuration: "P1M",
        },
      }),
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://veedundo.com" },
      { "@type": "ListItem", position: 2, name: isSell ? "For Sale" : "For Rent" },
      { "@type": "ListItem", position: 3, name: `${houseType} in ${locationText}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <ListingDetailClient initialListing={listing as any} />
    </>
  );
}
