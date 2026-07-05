import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function daysLeft(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = d.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export function timeAgo(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const secs = Math.floor((now.getTime() - d.getTime()) / 1000)

  if (secs < 60) return "Just now"
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return "Yesterday"
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 4) return `${weeks}w ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

export function shareListing(listing: { title?: string; description?: string | null; id?: string }) {
  const url = typeof window !== 'undefined' ? window.location.origin + '/listing/' + listing.id : ''
  const title = listing.title || listing.description || 'Check out this listing!'
  if (navigator.share) {
    navigator.share({ title, url }).catch(() => {})
  } else {
    navigator.clipboard.writeText(url)
    alert("Link copied!")
  }
}

// Recently viewed listings (localStorage)
const RECENTLY_VIEWED_KEY = "veedundo-recently-viewed";
const MAX_RECENT = 6;

export function addRecentlyViewed(listingId: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    const filtered = ids.filter((id) => id !== listingId);
    filtered.unshift(listingId);
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(filtered.slice(0, MAX_RECENT)));
  } catch {}
}

export function getRecentlyViewed(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
