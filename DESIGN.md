# VeedUndo Design System

## Color Palette

### Light Theme
- Background: `#FFF7ED` (warm cream)
- Surface: `#FFFFFF` (white cards)
- Primary: `#EA580C` (burnt orange)
- Primary hover: `#C2410C` (dark orange)
- Text: `#0F172A` (near-black slate)
- Text muted: `#64748B` (slate gray)
- Border: `#FCEAE1` (warm peach)
- Destructive: `#DC2626` (red)
- Success: `#10B981` (green)

### Dark Theme
- Background: `#0F172A` (dark slate)
- Surface: `#1E293B` (elevated slate)
- Primary: `#F97316` (orange)
- Text: `#F8FAFC` (white)
- Border: `#334155` (slate border)

## Typography
- Font: Inter (Google Fonts, variable)
- Scale: text-xs(12) → text-sm(14) → text-base(16) → text-lg(18) → text-xl(20) → text-2xl(24) → text-3xl(30) → text-4xl(36) → text-5xl(48) → text-6xl(60)
- Heading weight: font-bold (700)
- Body weight: default (400)
- Label weight: font-medium (500)

## Components
- Cards: rounded-2xl, border, bg-surface
- Buttons: rounded-full (primary), rounded-lg (secondary)
- Badges: rounded-full pills with alpha backgrounds
- Form inputs: rounded-xl, border, bg-surface
- Skeleton loading: shimmer animation

## Layout
- Max widths: 6xl (browse), 4xl (dashboard), 3xl (detail), 2xl (post), md (auth)
- Grid: sm:grid-cols-2 lg:grid-cols-3
- Spacing: 4px increments, 16px dominant
- Footer: sticky bottom via mt-auto

## Animations
- Transitions: 150ms ease-out
- Card hover: shadow-lg + border color
- Image zoom: scale-105, 300ms
- Press effect: scale-0.97, 100ms
- Reduced motion: disable all animations
