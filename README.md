# CodeCanvas — Your AI & Developer Toolkit

<p align="center">
  <img src="https://raw.githubusercontent.com/sivakumar6678/codecraft/main/public/logo.png" alt="CodeCanvas Logo" width="80" height="80" onerror="this.style.display='none'"/>
</p>

<p align="center">
  <strong>Discover. Build. Learn.</strong><br>
  The curated directory of 131+ AI tools across 18 taxonomy categories, interactive developer utilities, 48+ community AI prompts, deterministic stack recommender, and administrative studio.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.3.3-black?style=flat-square&logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React-18.2.0-blue?style=flat-square&logo=react" alt="React 18" />
  <img src="https://img.shields.io/badge/Supabase-SSR%20Auth-3ECF8E?style=flat-square&logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/Tests-99%20Passing-brightgreen?style=flat-square" alt="Tests" />
  <img src="https://img.shields.io/badge/ESLint-0%20Errors-success?style=flat-square" alt="ESLint" />
  <img src="https://img.shields.io/badge/License-MIT-purple?style=flat-square" alt="License" />
</p>

---

## 🌟 Key Platform Features

### 1. 🗂️ AI Tools Catalog & Directory (`/ai-tools`)
- **131 Curated AI Tools** across 18 specialized taxonomy categories (Development, Design, Image, Video, Audio, Writing, Productivity, Business AI, Security, DevOps, etc.).
- **Multi-Attribute Search & Filtering**: Filter by category, subcategory, pricing (`Free`, `Freemium`, `Paid`, `Contact for pricing`), platforms (`Web`, `Mac`, `Windows`, `Linux`, `CLI`, `VS Code`), and tags.
- **Detailed Tool Pages (`/ai-tools/tool/[slug]`)**: Specs, pros/cons, key features, pricing models, verified badges, outbound links with telemetry tracking, and Schema.org `SoftwareApplication` JSON-LD.
- **Community Interaction**: 1–5 star ratings, reviews, discussion threads, optimistic upvoting, and authenticated bookmark collections.
- **Side-by-Side Comparison (`/ai-tools/compare`)**: Compare specs and feature matrices between multiple tools.

### 2. 💡 AI Prompts & Knowledge Library (`/ai-knowledge`)
- **48+ Curated Prompts, Tricks & Techniques** targeted at leading AI models (Claude 3.5 Sonnet, GPT-4o, Cursor, Gemini 1.5 Pro, DeepSeek V3, etc.).
- **Interactive Prompt Cards**: Variable replacement (`{{variable}}`), one-click copying with visual feedback, and Schema.org `CreativeWork` metadata.

### 3. 🎯 Build Your Kit — Staged Workflow Recommender (`/build-toolkit`)
- **5-Stage Interactive Recommender**: `Goal -> Context -> Workflow -> Tool Selection -> Review Kit`.
- **Deterministic Affinity Scoring**: Tiered matching (Tier 1 exact match, Tier 2 tag match, Tier 3 category match, Tier 4 popular tool fallback) with strict budget constraint enforcement.

### 4. 🛠️ Built-in Developer Workspace (`/tools`, `/workspace`)
- In-browser productivity utilities:
  - **Color Palette Generator** (`/tool/palette`)
  - **CSS Gradient Generator** (`/tool/gradients`)
  - **CSS Box Shadow Generator** (`/tool/shadows`)
  - **Image Optimizer** (`/tool/images`)
  - **Code Snippets Library** (`/tool/code`)
  - **Project Blueprint Generator** (`/tool/ideas`)
  - **Brainstorming Canvas** (`/tool/brainstorming`)
- **AI Workspace Assistant (`/workspace`)**: Proxy to Google Gemini with sliding-window rate limiting (10 req/min/IP) and output protection.

### 5. ⚡ CodeCanvas Studio Admin Suite (`/studio`)
- **Tools Manager (`/studio/tools`)**: Full CRUD management with schema validation and search.
- **JSON Import Suite**: Bulk JSON importer with duplicate detection, canonical normalization, and side-by-side **Image Review & Update** workflow.
- **Knowledge Manager (`/studio/knowledge`)**: Manage and publish AI prompts and guides.
- **Submissions Queue (`/studio/contributions`)**: Moderate community-submitted tools and prompts with one-click publishing.
- **Platform Analytics (`/studio/analytics`)**: Real-time aggregated metrics on page views, outbound clicks, click-through rates (CTR %), upvotes, reviews, and saves.
- **System Settings (`/studio/settings`)**: Health indicators for Supabase and Gemini connections.

### 6. 👤 User Profiles & Personalization (`/profile`, `/users`, `/onboarding`)
- Supabase SSR cookie authentication (email/password, OAuth callbacks, password recovery).
- User profile dashboard with custom bio, experience level, tech stack, interests, and saved bookmarks (`/profile/bookmarks`).
- Public Users Directory (`/users`) with role filtering and pagination.

---

## 🏗️ Architecture & Tech Stack

- **Framework**: [Next.js 16.3.3](https://nextjs.org/) (App Router, Turbopack)
- **Frontend**: React 18.2.0, SCSS Modules, React Icons, Framer Motion
- **Backend & APIs**: Next.js Server Route Handlers (`app/api/**`), Server Actions
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, RLS, Storage)
- **Data Architecture**: Dual persistence — reads from Supabase with instant fallback to static JSON files in `data/ai-tools/` if the database is unpopulated or offline.
- **Rate Limiting**: Sliding-window in-memory token bucket (`lib/rate-limit.js`)
- **SEO & Structured Data**: Dynamic Schema.org JSON-LD (`lib/seo-schema.js`), dynamic `sitemap.xml`, and `robots.txt`

---

## 📁 Project Structure

```text
codecraft/
├── app/                           # Next.js App Router routes & API handlers
│   ├── ai-knowledge/              # Prompts & knowledge directory and detail pages
│   ├── ai-tools/                  # AI Tools catalog, categories, and comparison
│   ├── api/                       # API Route Handlers (admin, tools, user, track, generate)
│   ├── auth/                      # OAuth & confirmation callback handlers
│   ├── build-toolkit/             # Staged toolkit recommendation builder
│   ├── login/                     # Auth login & signup server actions
│   ├── onboarding/                # 3-step user personalization onboarding
│   ├── profile/                   # User profile & saved bookmarks dashboard
│   ├── studio/                    # Protected Studio admin suite & analytics
│   ├── tools/                     # Built-in generator workspace
│   ├── users/                     # Public user directory
│   ├── layout.jsx                 # Root layout, fonts, and global metadata
│   ├── sitemap.js                 # Dynamic sitemap generator
│   └── robots.js                  # Search engine crawler policies
├── components/                    # Modular React client & server components
│   ├── admin/                     # Studio components (ToolsManager, Importer, Analytics)
│   ├── ai-tools/                  # Catalog components (Cards, Filters, Upvote, Bookmark)
│   ├── community/                 # Community submission modal & contributions
│   ├── prompts/                   # Prompts library & card components
│   ├── tools_components/          # Built-in interactive generator widgets
│   └── user/                      # Profile & saved tools dashboard
├── data/                          # JSON catalog data files & SQL schemas
│   ├── ai-tools/*.json            # 18 category tool JSON files (131 tools)
│   ├── categories.json            # Category registry & descriptions
│   ├── featured.json              # Curated featured tool slugs
│   ├── default-prompts.json       # 48 initial prompts and knowledge items
│   └── supabase_migration.sql     # Master idempotent SQL database migration
├── lib/                           # Core utilities, validation, & Supabase clients
│   ├── auth/                      # Server-side admin verification and auth guards
│   ├── canonical-tool-schema.js   # Canonical schema definition & normalization
│   ├── catalog-categories.js      # Explicit category-to-file registry
│   ├── data-fetchers.js           # Dual-persistence catalog fetchers with fallback
│   ├── rate-limit.js              # Sliding-window token bucket rate limiter
│   ├── recommendations.js         # Deterministic tool recommendation engine
│   ├── seo-schema.js              # Schema.org JSON-LD generator with XSS sanitization
│   ├── tool-json-validation.js    # JSON import validation & duplicate detection
│   └── supabase/                  # Supabase browser, server, and admin clients
├── .project-docs/                 # Comprehensive technical documentation
│   ├── PRD.md                     # Product Requirements Document
│   ├── ARCHITECTURE.md            # Technical Architecture Document
│   ├── DATA-MODEL.md              # Data Model & Schema Specification
│   └── DEVELOPMENT.md             # Development tracker and changelog
├── DEPLOYMENT.md                  # Step-by-step production deployment manual
└── RULES.md                       # AI Agent development rules and standards
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: `v18.18.0` or higher (Recommended: Node 20 LTS or Node 22)
- **npm** or **yarn** or **pnpm**
- A [Supabase](https://supabase.com/) project (for authentication, bookmarks, reviews, analytics, and prompts)

### 2. Installation
```bash
git clone https://github.com/sivakumar6678/codecraft.git
cd codecraft
npm install
```

### 3. Environment Variables
Create a `.env.local` file in the project root:
```bash
cp .env.example .env.local
```

Populate the required environment variables:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-private-key

# AI Workspace Generator (Optional)
GEMINI_API_KEY=your-google-gemini-api-key

# Admin Whitelist & Canonical Site Origin
ADMIN_EMAILS=your-admin-email@example.com
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Database Setup (Supabase)
1. Open your Supabase project's **SQL Editor**.
2. Run the master migration script located at [`data/supabase_migration.sql`](data/supabase_migration.sql).
3. In **Authentication > URL Configuration**, add `http://localhost:3000/auth/callback` to the **Redirect URLs**.

### 5. Running the Application
```bash
# Start Next.js development server with Turbopack
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Verification

CodeCanvas includes a comprehensive Node.js test suite and strict ESLint configuration:

```bash
# Run all 99 unit & integration tests
npm test

# Run ESLint check (0 errors required)
npm run lint

# Run Next.js production build (compiles all 60 routes)
npm run build
```

---

## 🚢 Production Deployment

For complete, step-by-step deployment instructions, hosting configuration, and troubleshooting stale deployments, see [DEPLOYMENT.md](DEPLOYMENT.md).

### Quick Deployment Summary (Vercel):
1. Push your latest code to the `main` branch:
   ```bash
   git push origin main
   ```
2. In **Vercel / Hosting Provider Dashboard**:
   - Verify the **Production Branch** is set to `main`.
   - Set the required Environment Variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAILS`, `NEXT_PUBLIC_SITE_URL`).
3. In **Supabase Dashboard**:
   - Run `data/supabase_migration.sql` in the SQL Editor.
   - Update **Site URL** and **Redirect URLs** in Authentication settings.
4. Deploy and execute the post-deployment smoke tests.

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.
