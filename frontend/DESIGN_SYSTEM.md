# Margin — Design System

Dark-mode-first visual language for the Margin document study workspace. All tokens below are the single source of truth for UI work. Implement by copying the `:root` block into `app/globals.css` and applying Tailwind patterns as specified.

---

## 1. Color Palette

Margin uses a restrained, near-monochrome palette with one desaturated slate-blue accent. No purple, orange, neon, or decorative gradients.

### Semantic tokens

| Token | Role |
|-------|------|
| `--bg-base` | App shell, page background |
| `--bg-elevated` | Sidebars, split panels, input wells |
| `--bg-card` | Cards, citation blocks, modals |
| `--border` | All borders (1px) |
| `--accent` | Primary interactive, focus rings, links, active highlights |
| `--accent-hover` | Hover state for accent surfaces |
| `--text-primary` | Headings, body, button labels on accent |
| `--text-secondary` | Metadata, captions, helper text |
| `--text-muted` | Placeholders, disabled, hints |
| `--destructive` | Errors only |
| `--success` | Success states only (badges, confirmations) |

### Status badge tints (derived from destructive/success, not new hues)

| Token | Role |
|-------|------|
| `--status-processing-bg` | Muted yellow surface |
| `--status-processing-text` | Muted yellow label |
| `--status-ready-bg` | Muted green surface |
| `--status-ready-text` | Muted green label |
| `--status-failed-bg` | Muted red surface |
| `--status-failed-text` | Muted red label |

### `globals` — copy into `app/globals.css`

Replace the existing `:root` / `.dark` color definitions with this block. **Dark is default on `:root`**; do not rely on a light theme.

```css
:root {
  /* Background scale — near-black, subtle steps */
  --bg-base: #0a0a0b;
  --bg-elevated: #111113;
  --bg-card: #18181b;

  /* Border — single subtle edge */
  --border: #27272a;

  /* Primary accent — desaturated slate-blue */
  --accent: #5b7c99;
  --accent-hover: #6b8fad;
  --accent-muted: #3d5266;

  /* Text scale */
  --text-primary: #f4f4f5;
  --text-secondary: #a1a1aa;
  --text-muted: #52525b;

  /* Semantic — errors and success only */
  --destructive: #9f4f4f;
  --destructive-foreground: #f4f4f5;
  --success: #4a7c59;
  --success-foreground: #d4e8da;

  /* Status badges — muted, not bright */
  --status-processing-bg: #2a2618;
  --status-processing-text: #a89b5c;
  --status-ready-bg: #152019;
  --status-ready-text: #6b9a7a;
  --status-failed-bg: #261818;
  --status-failed-text: #b87a7a;

  /* shadcn/ui bridge (Section 8) */
  --background: var(--bg-base);
  --foreground: var(--text-primary);
  --card: var(--bg-card);
  --card-foreground: var(--text-primary);
  --popover: var(--bg-card);
  --popover-foreground: var(--text-primary);
  --primary: var(--accent);
  --primary-foreground: #fafafa;
  --secondary: var(--bg-elevated);
  --secondary-foreground: var(--text-secondary);
  --muted: var(--bg-elevated);
  --muted-foreground: var(--text-secondary);
  --accent-foreground: var(--text-primary);
  /* --destructive-foreground defined above in semantic tokens */
  --input: var(--bg-elevated);
  --ring: var(--accent);
  --radius: 0.375rem;

  /* Typography (Section 2) — wired in layout.tsx */
  --font-sans: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-geist-mono), ui-monospace, monospace;

  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;

  --leading-xs: 1rem;
  --leading-sm: 1.25rem;
  --leading-base: 1.5rem;
  --leading-lg: 1.75rem;
  --leading-xl: 1.75rem;
  --leading-2xl: 2rem;
  --leading-3xl: 2.25rem;

  /* Motion (Section 7) */
  --transition-fast: 150ms;
  --ease-default: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Optional: force dark on html — no light theme */
html {
  color-scheme: dark;
}
```

### Tailwind `@theme` extensions (add to `globals.css` `@theme inline`)

```css
@theme inline {
  --color-bg-base: var(--bg-base);
  --color-bg-elevated: var(--bg-elevated);
  --color-bg-card: var(--bg-card);
  --color-border-default: var(--border);
  --color-accent: var(--accent);
  --color-accent-hover: var(--accent-hover);
  --color-text-primary: var(--text-primary);
  --color-text-secondary: var(--text-secondary);
  --color-text-muted: var(--text-muted);
  --color-destructive: var(--destructive);
  --color-success: var(--success);
  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
}
```

Usage examples: `bg-bg-base`, `bg-bg-card`, `text-text-secondary`, `border-border-default`.

---

## 2. Typography

### Font families

| Role | Font | Source | CSS variable |
|------|------|--------|----------------|
| UI, body, headings | **Geist Sans** | Google Fonts via `next/font` | `--font-geist-sans` |
| Code, IDs, technical strings | **Geist Mono** | Google Fonts via `next/font` | `--font-geist-mono` |

Already configured in `app/layout.tsx`:

```ts
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
```

Apply on `<html>`: `className={`${geistSans.variable} ${geistMono.variable} font-sans`}`.

### Type scale

| Name | Size | Line height | Tailwind | Typical use |
|------|------|-------------|----------|-------------|
| xs | 12px / 0.75rem | 16px | `text-xs leading-xs` | Badges, timestamps, legal |
| sm | 14px / 0.875rem | 20px | `text-sm leading-sm` | Labels, secondary UI, captions |
| base | 16px / 1rem | 24px | `text-base leading-base` | Body, chat messages, inputs |
| lg | 18px / 1.125rem | 28px | `text-lg leading-lg` | Card titles, panel headers |
| xl | 20px / 1.25rem | 28px | `text-xl leading-xl` | Page titles (dashboard) |
| 2xl | 24px / 1.5rem | 32px | `text-2xl leading-2xl` | Marketing / login headline |
| 3xl | 30px / 1.875rem | 36px | `text-3xl leading-3xl` | Hero login only |

### Font weight conventions

| Weight | Tailwind | Use |
|--------|----------|-----|
| 400 Regular | `font-normal` | Body copy, chat answers, descriptions |
| 500 Medium | `font-medium` | Buttons, nav links, emphasized labels |
| 600 Semibold | `font-semibold` | Card titles, logo, section headers |
| 700 Bold | `font-bold` | Avoid except rare emphasis; prefer semibold |

**Monospace:** `font-mono text-sm` for chunk IDs, API paths, debug strings only.

---

## 3. Spacing and Layout

### Spacing scale (Tailwind defaults — do not invent new values)

| Token | Value | Use |
|-------|-------|-----|
| `1` | 4px | Tight icon gaps |
| `2` | 8px | Inline icon + label |
| `3` | 12px | Input padding-y, small gaps |
| `4` | 16px | Card padding, panel padding (mobile) |
| `5` | 20px | — |
| `6` | 24px | Section gaps, desktop panel padding |
| `8` | 32px | Dashboard section margins |
| `10` | 40px | Large section spacing |

**Conventions**

- Card internal padding: `p-4` (16px)
- Gap between cards in grid: `gap-4` (16px)
- Gap between form label and input: `gap-2` (8px)
- Section margin (dashboard header → grid): `space-y-6` or `mb-6`
- Chat message stack: `space-y-4`
- Split panel internal padding: `p-4` mobile, `p-6` desktop (`lg:p-6`)

### Dashboard view

Centered content column, document grid, no full-bleed except optional top bar.

```
┌─────────────────────────────────────────────────────────────┐
│  max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Header: title + upload + sign out                    │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                    │
│  │  Card    │ │  Card    │ │  Card    │  grid gap-4        │
│  └──────────┘ └──────────┘ └──────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

**Tailwind shell**

```txt
main: min-h-screen bg-bg-base text-text-primary
container: mx-auto max-w-6xl px-4 py-6 sm:px-6 space-y-6
grid: grid gap-4 sm:grid-cols-2 xl:grid-cols-3
```

### Workspace view

Full viewport height, **no page scroll**. Left PDF ~60%, right chat ~40%. Each panel scrolls independently.

```
┌──────────────────────────────────────────────────────────────┐
│ header: shrink-0, border-b, px-6 py-4                          │
├──────────────────────────────┬───────────────────────────────┤
│ PDF panel 60%              │ Chat panel 40%                │
│ min-h-0 overflow-hidden    │ min-h-0 overflow-hidden       │
│ ┌────────────────────────┐ │ ┌───────────────────────────┐ │
│ │ overflow-y-auto        │ │ │ messages overflow-y-auto  │ │
│ │ (PDF pages)            │ │ │                           │ │
│ └────────────────────────┘ │ │ input fixed at bottom     │ │
│                              │ └───────────────────────────┘ │
└──────────────────────────────┴───────────────────────────────┘
```

**CSS / Tailwind structure**

```txt
main:
  flex h-screen flex-col overflow-hidden bg-bg-base

header:
  shrink-0 border-b border-border-default px-4 py-4 sm:px-6

content row:
  flex min-h-0 flex-1 overflow-hidden

pdf column (60%):
  flex min-h-0 w-[60%] flex-col overflow-hidden border-r border-border-default p-4 lg:p-6

pdf scroll inner:
  min-h-0 flex-1 overflow-y-auto overflow-x-hidden rounded-lg border border-border-default bg-bg-elevated

chat column (40%):
  flex min-h-0 w-[40%] flex-col overflow-hidden p-4 lg:p-6

chat messages:
  min-h-0 flex-1 overflow-y-auto

chat input area:
  shrink-0 border-t border-border-default pt-4
```

**Mobile (`max-lg`):** stack vertically — PDF `h-[45vh] flex-none`, chat `flex-1 min-h-0`. Page still `h-screen overflow-hidden`.

---

## 4. Component Styles

Specs are **Tailwind class patterns only** — no JSX. Compose with design tokens above.

### Card (document card, dashboard)

**Default**

```txt
block rounded-md border border-border-default bg-bg-card p-4
transition-[border-color,background-color] duration-150 ease-[cubic-bezier(0.4,0,0.2,1)]
```

**Hover** (ready documents only — use `Link`)

```txt
hover:border-accent/40 hover:bg-bg-elevated
```

**Title**

```txt
text-lg font-semibold text-text-primary break-words
```

**Metadata**

```txt
text-sm text-text-secondary space-y-1
```

**Non-interactive** (processing / failed)

```txt
cursor-default opacity-90
```

No `shadow-*`.

---

### Button — primary (upload, send)

```txt
inline-flex items-center justify-center gap-2
rounded-md bg-accent px-4 py-2
text-sm font-medium text-primary-foreground
transition-colors duration-150 ease-[cubic-bezier(0.4,0,0.2,1)]
hover:bg-accent-hover
disabled:opacity-50 disabled:pointer-events-none
```

No `rounded-full`. No shadow.

---

### Button — ghost (secondary: sign out, back, dismiss)

```txt
inline-flex items-center justify-center gap-2
rounded-md bg-transparent px-3 py-2
text-sm font-medium text-text-secondary
transition-colors duration-150
hover:bg-bg-elevated hover:text-text-primary
disabled:opacity-50
```

Outline variant (if needed): `border border-border-default` — no fill.

---

### Input (chat textarea, login email/password)

```txt
w-full resize-none rounded-md border border-border-default bg-bg-elevated
px-3 py-2 text-base text-text-primary placeholder:text-text-muted
outline-none transition-[border-color] duration-150
focus:border-accent
disabled:opacity-50 disabled:cursor-not-allowed
```

No `ring-*` glow, no `shadow-*` on focus. Optional: `focus-visible:ring-1 focus-visible:ring-accent` only if accessibility audit requires it.

---

### Badge (document status)

Base for all statuses:

```txt
inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium
```

| Status | Classes |
|--------|---------|
| processing | `bg-[var(--status-processing-bg)] text-[var(--status-processing-text)]` |
| ready | `bg-[var(--status-ready-bg)] text-[var(--status-ready-text)]` |
| failed | `bg-[var(--status-failed-bg)] text-[var(--status-failed-text)]` |

---

### Source card (citation below assistant message)

```txt
w-full rounded-md border border-border-default bg-bg-card
border-l-2 border-l-accent pl-3 pr-3 py-2 text-left
transition-[border-color,background-color] duration-150
hover:border-accent/50 hover:bg-bg-elevated cursor-pointer
```

**Page label**

```txt
text-xs font-medium text-accent
```

**Preview body**

```txt
mt-1 text-sm text-text-secondary line-clamp-2
```

**Similarity** (optional)

```txt
mt-1 text-xs text-text-muted
```

---

### Panel header (chat / workspace header)

```txt
shrink-0 border-b border-border-default bg-bg-base px-4 py-3 sm:px-6
flex items-center justify-between gap-4
```

**Title**

```txt
text-lg font-semibold text-text-primary
```

**Subtitle / back link**

```txt
text-sm text-text-secondary hover:text-text-primary transition-colors duration-150
```

No heavy shadows, no gradient headers, no large icons.

---

### Chat bubbles (reference)

| Role | Classes |
|------|---------|
| user | `max-w-[85%] rounded-md bg-accent px-4 py-3 text-sm text-primary-foreground` |
| assistant | `max-w-[85%] rounded-md bg-bg-card border border-border-default px-4 py-3 text-sm text-text-primary` |

---

## 5. Iconography

**Library:** `lucide-react` only (matches `components.json`).

### Icon map

| Action | Icon | Import |
|--------|------|--------|
| Upload | `Upload` | `lucide-react` |
| Document / file | `FileText` | `lucide-react` |
| Send message | `Send` | `lucide-react` |
| Page previous | `ChevronLeft` | `lucide-react` |
| Page next | `ChevronRight` | `lucide-react` |
| Close / dismiss | `X` | `lucide-react` |
| Loading | `Loader2` + `animate-spin` | `lucide-react` |
| Success | `Check` | `lucide-react` |
| Error | `AlertCircle` | `lucide-react` |
| Back to dashboard | `ArrowLeft` | `lucide-react` |
| Sign out | `LogOut` | `lucide-react` |

### Size conventions

| Context | Size | Tailwind |
|---------|------|----------|
| Inline with text (button label) | 16px | `size-4` |
| Action / toolbar | 18px | `size-[18px]` or `size-4.5` if configured |
| Empty state / feature | 24px | `size-6` |
| Large empty state | 32px | `size-8` |

**Color:** `text-text-secondary` default; `text-accent` for active; `text-destructive` for errors; `text-success` for success. Icons inherit unless semantic color is required.

**Stroke:** Lucide default `strokeWidth={2}`; use `strokeWidth={1.5}` only in dense UI (badges).

---

## 6. Logo

### `MarginLogo` component specification

**File:** `components/margin-logo.tsx` (to be created)

**Structure (describe JSX — do not implement here)**

1. Outer element: `span` or `Link`, `inline-flex items-center gap-2`, `select-none`.
2. **Mark** (left of wordmark): a minimal vertical bar — not an emoji, not an illustration.
   - Element: `span` with fixed dimensions `w-[3px] h-[1.1em] rounded-sm bg-accent`.
   - Reads as a “margin” line in the left margin of a page.
3. **Wordmark:** text node `Margin`.
   - Classes: `font-sans text-xl font-semibold tracking-tight text-text-primary` (navbar).
   - Variant prop `size`: `"sm"` → `text-lg`, `"md"` → `text-xl`, `"lg"` → `text-2xl` (login page only).
4. Optional `href` prop: when set, wrap in `Link` to `/dashboard`; otherwise `span`.

**Navbar usage:** `size="sm"`, mark + wordmark, no subtitle.

**Login usage:** `size="lg"`, centered in auth layout above form, `mb-8`.

**Accessibility:** `aria-label="Margin home"` when link; decorative mark `aria-hidden="true"`.

**Forbidden:** emoji, gradient text, box shadows, multiple colors on mark, complex SVG paths.

---

## 7. Animation and Interaction

### Timing

| Token | Value |
|-------|-------|
| `--transition-fast` | `150ms` |
| `--ease-default` | `cubic-bezier(0.4, 0, 0.2, 1)` |

Tailwind: `duration-150 ease-out` (maps to default easing).

### What should animate

| Interaction | Animation |
|-------------|-----------|
| Button hover | `transition-colors duration-150` background/border/text |
| Card hover | Border color + background only |
| Input focus | Border color to accent |
| Loading | `Loader2` with `animate-spin` |
| Streaming text | No per-token animation; optional single `opacity` fade-in on new assistant bubble only (`opacity-0 → opacity-100` over 150ms once) |
| Source card hover | Border/background per Card rules |

### What must NOT animate

- Route / page transitions
- Layout reflow (split panel resize, PDF load height)
- `scroll-behavior` on workspace shell (PDF panel may use `smooth` for citation scroll only)
- Bounce, spring, or duration &gt; 150ms
- Parallax, blur, scale transforms on hover (no `hover:scale-*`)

---

## 8. shadcn/ui Configuration

Map shadcn semantic variables to Margin tokens. Set `cssVariables: true` in `components.json` (already set). Apply dark values on `:root` (Section 1).

| shadcn variable | Maps to | Value / notes |
|-----------------|---------|----------------|
| `--background` | Page shell | `var(--bg-base)` |
| `--foreground` | Default text | `var(--text-primary)` |
| `--card` | Card surfaces | `var(--bg-card)` |
| `--card-foreground` | Text on cards | `var(--text-primary)` |
| `--popover` | Dropdowns / popovers | `var(--bg-card)` |
| `--popover-foreground` | Popover text | `var(--text-primary)` |
| `--primary` | Primary actions | `var(--accent)` |
| `--primary-foreground` | Text on primary | `#fafafa` |
| `--secondary` | Secondary surfaces | `var(--bg-elevated)` |
| `--secondary-foreground` | Secondary text | `var(--text-secondary)` |
| `--muted` | Muted backgrounds | `var(--bg-elevated)` |
| `--muted-foreground` | Muted text | `var(--text-secondary)` |
| `--accent` | Hover highlights in menus | `var(--bg-elevated)` |
| `--accent-foreground` | Text on accent rows | `var(--text-primary)` |
| `--destructive` | Errors | `var(--destructive)` |
| `--destructive-foreground` | Text on destructive | `var(--destructive-foreground)` |
| `--border` | All borders | `var(--border)` |
| `--input` | Input fill | `var(--bg-elevated)` |
| `--ring` | Focus ring color | `var(--accent)` |
| `--radius` | Base radius | `0.375rem` (6px) |

**`components.json` recommendations**

```json
{
  "style": "base-nova",
  "tailwind": {
    "cssVariables": true,
    "baseColor": "neutral"
  },
  "iconLibrary": "lucide"
}
```

**Root layout:** add `className="dark"` on `<html>` **or** rely on `:root` tokens only (preferred: tokens on `:root`, `color-scheme: dark`).

**Button component:** extend shadcn `Button` variants to match Section 4 — `default` → primary accent, `ghost` → ghost spec, no `destructive` variant except delete actions.

---

## 9. Rules

Enforce on every PR and component review.

1. **No light backgrounds** — never use `bg-white`, `bg-gray-50`, or default shadcn light `:root` without overriding.
2. **No drop shadows** — no `shadow-sm`, `shadow-md`, `shadow-lg`, or custom box-shadows on cards, buttons, or panels.
3. **Maximum two semantic colors per component** — e.g. card = surface + border; primary button = accent + foreground text. Status badges are one semantic pair (bg + text).
4. **Border radius cap** — `rounded-md` (6px) default; `rounded-lg` (8px) max for panels; `rounded-full` only for badges and spinners, never for buttons.
5. **Font sizes** — only `text-xs` through `text-3xl` from the type scale; no arbitrary `text-[13px]`.
6. **Font weights** — only `font-normal`, `font-medium`, `font-semibold`; avoid `font-bold` except logo.
7. **Accent discipline** — `--accent` for interactive emphasis only; not for large background fills except primary buttons and user chat bubbles.
8. **No extra palette colors** — no purple, orange, pink, cyan, or rainbow gradients; charts (if added later) must use muted grays + accent only.
9. **Gradients** — forbidden except optional `bg-gradient-to-b from-bg-base to-bg-base` (imperceptible); no hero gradients.
10. **Icons** — Lucide only; no heroicons, no emoji, no custom SVG icon sets.
11. **Motion** — transitions ≤ 150ms; no layout animation libraries (Framer layout, etc.).
12. **Workspace scroll** — document scroll lives inside PDF panel; chat scroll inside message list; never on `body` for workspace route.
13. **Focus** — border color change only; no large glowing rings (`ring-4`, colored shadows).
14. **shadcn overrides** — when adding ui components, restyle variants to match Section 4; do not ship default light-theme contrast.

---

## Implementation checklist

When applying this system to the codebase:

- [ ] Replace `app/globals.css` `:root` colors with Section 1 block
- [ ] Set `html` to dark (`color-scheme: dark` or class `dark`)
- [ ] Extend `@theme inline` with Margin color aliases
- [ ] Update `workspace-view.tsx` layout per Section 3 (60/40 split, `h-screen`, `min-h-0`)
- [ ] Restyle `document-card`, `status-badge`, `source-card`, `chat-panel`, `button` per Section 4
- [ ] Add `MarginLogo` per Section 6
- [ ] Swap icons per Section 5 map

---

*Last updated: design system v1 — dark-first, Margin portfolio app.*
