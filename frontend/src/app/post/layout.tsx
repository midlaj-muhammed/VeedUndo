import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Post a Property Listing",
  description: "List your property for rent or sale on VeedUndo. Reach thousands of buyers and tenants in Kerala — free and instant.",
};

export default function PostLayout({ children }: { children: React.ReactNode }) {
  return children;
}
