# CodeCraft — AI Developer Tools Directory & Platform

CodeCraft is an AI-powered developer tools directory, interactive workspace, and community prompt platform built with Next.js 16 (App Router), React, Supabase, and SCSS modules.

---

## Key Features

1. **AI Tools Catalog & Taxonomy (`/ai-tools`)**:
   - Curated directory across 18 specialized taxonomy categories (Development, Design, Image, Video, Audio, Writing, Productivity, etc.).
   - Multi-attribute search, pricing filters (`Free`, `Freemium`, `Paid`), platform filters, and sorting (`Featured`, `Name A-Z`, `Newest`).
   - Detailed tool pages (`/ai-tools/tool/[slug]`) with full overviews, pros/cons, key features, pricing models, verified badges, outbound links, and related tool recommendations.
   - Interactive community upvotes, bookmarking to user profiles, and reviews.

2. **AI Prompts & Tricks Library (`/ai-prompts-tricks`)**:
   - Community-submitted and admin-moderated AI prompts, tricks, slash commands, and prompting techniques.
   - Filtering by content type, target AI model (Claude, GPT-4o, Cursor, etc.), and category.
   - One-click copy with visual feedback and detailed prompt walkthroughs (`/ai-prompts-tricks/[id]`).

3. **Rule-Based Toolkit Builder (`/build-toolkit`)**:
   - Interactive questionnaire to discover tailored tool stacks based on work goal, experience level, budget, and priority.

4. **Built-in Developer & Design Workspace (`/tools`)**:
   - In-browser productivity tools: Color Palette Generator, Gradient Generator, Box Shadow Generator, Image Optimizer, Code Snippets, Project Suggestions, and Brainstorming canvas.

5. **CodeCraft Studio Administration (`/studio`)**:
   - **Tools Manager (`/studio/tools`)**: JSON-backed CRUD operations, schema validation, and atomic category writes.
   - **JSON Importer**: Safe bulk JSON import with conflict resolution, canonical schema mapping, and a selective side-by-side **Image Review & Update** workflow.
   - **Suggestions Review Queue (`/studio/suggestions`)**: Moderate community tool suggestions and prompt submissions with one-click approval and canonical catalog publishing.
   - **Platform Analytics & Telemetry (`/studio/analytics`)**: Live metrics on page views, outbound clicks, click-through rates (CTR %), upvotes, reviews, and saved tools.

6. **Authentication & User Profile (`/profile`, `/login`)**:
   - Supabase email/password authentication, session synchronization, and saved tool bookmark collections (`/profile/bookmarks`).

---

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **Frontend**: React 19, SCSS Modules, React Icons
- **Backend & APIs**: Next.js Route Handlers (`app/api/**`), Server Actions
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, RLS, Storage)
- **Catalog Data Source**: JSON files in `data/ai-tools/` mapped via `lib/catalog-categories.js`

---

## Project Structure

```text
codecraft/
├── app/                           # Next.js App Router routes & API endpoints
│   ├── ai-prompts-tricks/         # Prompts & Tricks directory & detail pages
│   ├── ai-tools/                  # AI Tools catalog, categories, and comparison
│   ├── api/                       # API Route Handlers (admin, tools, user, prompts)
│   ├── auth/                      # OAuth & email confirmation callbacks
│   ├── build-toolkit/             # Interactive toolkit recommendation builder
│   ├── login/                     # Auth login & signup server actions
│   ├── profile/                   # User profile & saved bookmarks dashboard
│   ├── studio/                    # Protected Studio admin panel & analytics
│   ├── tools/                     # Built-in generator workspace
│   └── layout.jsx                 # Root layout, theme, and navigation
├── components/                    # Modular React client/server components
│   ├── admin/                     # Studio components (ToolsManager, Importer, Analytics)
│   ├── ai-tools/                  # Catalog components (Cards, Filters, Upvote, Bookmark)
│   ├── prompts/                   # Prompts library & card components
│   ├── tools_components/          # Built-in interactive generator widgets
│   └── user/                      # Profile & saved tools dashboard
├── data/                          # JSON catalog data files & SQL schemas
│   ├── ai-tools/*.json            # 18 category tool JSON files (source of truth)
│   ├── categories.json            # Category registry & descriptions
│   └── supabase_migration.sql     # Database migration script (tables, indexes, RLS)
├── lib/                           # Core utilities, validation, & Supabase clients
│   ├── canonical-tool-schema.js   # Canonical schema definition & normalization
│   ├── catalog-categories.js      # Explicit category-to-file registry
│   ├── data-fetchers.js           # Server-side catalog fetchers
│   ├── tool-json-validation.js    # JSON import validation & conflict classification
│   └── supabase/                  # Supabase browser, server, and admin clients
└── styles/                        # Global SCSS tokens, variables, and typography
```

---

## Getting Started

### 1. Prerequisites
- Node.js 18.17+ or Node.js 20+
- npm, yarn, or pnpm
- A [Supabase](https://supabase.com/) project (for authentication, bookmarks, analytics, and prompts)

### 2. Installation
```bash
git clone <repository-url>
cd codecraft
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Configure your credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_EMAILS=admin@example.com
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Database Setup
Apply the database schema in your Supabase SQL Editor:
- Execute `data/supabase_migration.sql` to create all required tables (`user_profiles`, `saved_tools`, `tool_upvotes`, `tool_reviews`, `analytics_tool_views`, `analytics_tool_clicks`, `tool_suggestions`, `prompt_submissions`) along with Row Level Security (RLS) policies.

### 5. Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Testing & Quality Assurance

Run the automated Node.js test suite covering schema normalization, validation, import classification, suggestions moderation, and catalog filtering:
```bash
npm test
```
Or run directly with Node test runner:
```bash
node --test lib/*.test.js
```

---

## License
MIT License. Created for the CodeCraft Platform.
