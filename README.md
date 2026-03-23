# create-better-system

CLI to scaffold new projects from the [Better System](https://github.com/brunogilferro/better-system) template.

## What it does

1. Clones the Better System monorepo template
2. Asks 5 questions about your project
3. Fills in design tokens, fonts, and CSS variables automatically
4. Leaves you with a ready-to-code project

---

## Usage

```bash
npx create-better-system
```

Or install globally:

```bash
npm install -g create-better-system
create-better-system
```

---

## Questions asked

| Question | Default | Notes |
|----------|---------|-------|
| Project name | — | Used as folder name and package name |
| Color theme | Dark only | Dark / Light / Both (with toggle) |
| Heading font | Poppins | Any Google Font name |
| Primary accent color | `#D4AF37` | Main brand color |
| Secondary accent color | `#38bdf8` | Secondary highlights |

---

## After creation

```bash
# 1. Enter the project folder
cd <project-name>

# 2. Install dependencies
pnpm install

# 3. Set up backend environment
cp apps/backend/.env.example apps/backend/.env
# Edit apps/backend/.env and set APP_KEY and any other required values

# 4. Run database migrations
cd apps/backend
node ace migration:run

# 5. Start the project
cd ../..
pnpm dev
```

Frontend runs on `http://localhost:3000`
Backend runs on `http://localhost:3333`

---

## What gets configured automatically

- `docs/figma-design-rules.md` — filled with your design tokens
- `apps/frontend/app/globals.css` — CSS variables set from your tokens
- `apps/frontend/app/layout.tsx` — heading font imported from `next/font/google`
- `package.json` — project name updated

---

## Using AI in your project

Once the project is open in Cursor, the AI already knows your architecture, design tokens, and rules.

### Create a complete feature (backend + frontend)

```
new-feature: courses with name, description and price
```

The AI will generate the migration, model, validator, service, controller, route, types, hook, and page automatically.

---

### Implement a screen from Figma

```
figma-to-next-screen: [paste Figma link here]
```

The AI reads the design, creates an architecture plan, implements with shadcn + your design tokens, and refines against the Figma screenshot.

---

### Generate only the backend for a resource (new table)

```
backend-from-schema: product with name (string), price (number), stock (integer)
```

Generates migration, model, validator, transformer, service, controller, and route.

---

### Generate backend from an existing database table

```bash
# First, pull the current schema from the database
cd apps/backend && node ace db:pull
```

Then in Cursor:

```
database-to-feature: tabela products
```

Generates model (enhanced from db:pull), validator, transformer, service, controller, and route. **No migration created** — the table already exists.

For tables that already exist, you can also use:

```
backend-from-schema: product [existing table] with name, price, stock
```

---

### Write tests

```
write-tests: apps/backend/app/services/product_service.ts
```

Generates unit and integration tests following the project's conventions.

---

## Template includes

- **Frontend**: Next.js 16, React 19, Tailwind v4, shadcn/ui (14 components), React Query
- **Backend**: AdonisJS v7 with auth (signup, login, logout, profile)
- **Type-safe API**: Tuyau client pre-configured in `lib/api.ts`
- **Cursor AI skills**: `figma-to-next-screen`, `backend-from-schema`, `new-feature`, `write-tests`
- **Cursor AI rules**: frontend, backend, accessibility, commits
- **Docs**: design-system, components-registry, data-pattern, api-conventions, error-handling, state-management, figma-design-rules

---

## Requirements

- Node.js 18+
- pnpm
