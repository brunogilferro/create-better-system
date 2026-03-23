# create-better-system

CLI to scaffold new projects from the [Better System](https://github.com/brunogilferro/better-system) template.

## What it does

1. Clones the Better System monorepo template
2. Asks 5 questions about your project
3. Fills in design tokens, fonts, and CSS variables automatically
4. Leaves you with a ready-to-code project

## Usage

```bash
npx create-better-system
```

Or install globally:

```bash
npm install -g create-better-system
create-better-system
```

## Questions asked

| Question | Default | Notes |
|----------|---------|-------|
| Project name | — | Used as folder name and package name |
| Color theme | Dark only | Dark / Light / Both (with toggle) |
| Heading font | Poppins | Any Google Font name |
| Primary accent color | `#D4AF37` | Main brand color |
| Secondary accent color | `#38bdf8` | Secondary highlights |

## What gets configured

- `docs/figma-design-rules.md` — filled with your design tokens
- `apps/frontend/app/globals.css` — CSS variables set from your tokens
- `apps/frontend/app/layout.tsx` — heading font imported from `next/font/google`
- `package.json` — project name updated

## After creation

```bash
cd <project-name>
pnpm install
pnpm dev
```

## Template includes

- **Frontend**: Next.js 16, React 19, Tailwind v4, shadcn/ui (14 components pre-installed)
- **Backend**: AdonisJS v7 with auth (signup, login, logout, profile)
- **Type-safe API**: Tuyau client pre-configured
- **Cursor AI**: Rules and skills ready (figma-to-next-screen, backend-from-schema)
- **Docs**: design-system, components-registry, data-pattern, figma-design-rules

## Requirements

- Node.js 18+
- pnpm
