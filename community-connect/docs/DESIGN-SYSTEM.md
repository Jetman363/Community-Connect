# Community Connect Design System v1

## Color & theme

- Primary accent: `#2563EB` (`--accent`)
- Emergency: `--emergency`
- Surfaces: `--background`, `--card`, `--muted`, `--border`
- Dark mode via `.dark` class (ThemeProvider)

## Spacing tokens (`globals.css`)

| Token | Value |
|-------|-------|
| `--space-1` … `--space-8` | 4px → 32px scale |
| `--radius-sm` … `--radius-xl` | 8px → 20px |
| `--glass-blur` | 12px backdrop blur |

## Typography

| Class | Use |
|-------|-----|
| `.text-display` | Page heroes |
| `.text-title` | Section headers |
| `.text-body` | Default copy |
| `.text-caption` | Meta / timestamps |

## Components (`components/ui/`)

- **Button** — sizes `sm`, `default`, `lg`, `icon`; variants `default`, `outline`, `ghost`, `danger`
- **Card** — `Card`, `CardHeader`, `CardTitle`, `CardContent`; use `.glass-panel` for frosted surfaces
- **Skeleton** — loading placeholders on dashboard, search, discover
- **Toast** — variants `success`, `error`, `info` via `useToast()`

## Layout

- Sticky header with `backdrop-blur-xl`
- Mobile nav: 6 compact items (Home, Discover, Market, Groups, Alerts, Profile)
- `FloatingAssistant` on all main shell pages

## Motion

- Framer Motion: `PageTransition`, feed swipe, toast enter/exit
- Prefer `motion-safe:` utilities where Tailwind motion plugin is available
