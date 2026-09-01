# CodeCraft Product Features Audit & Implementation Plan

## Context
CodeCraft is an AI-powered developer tools directory and workspace built with Next.js 16 (App Router), React 18, SCSS, and Supabase. The user requested an audit of 13 key product features, ensuring existing features are preserved and reused while any gaps or missing workflows are cleanly developed without disrupting working functionality.

---

## Complete Audit Matrix (Existing vs Required)

| # | Product Requirement | Current Status | Implemented & Reused Code | Necessary Enhancements |
|---|---|---|---|---|
| **1** | **AI Tool Taxonomy** (Category → Subcategory → Tags → Use Cases; 6 core categories) | ✅ Complete | `data/categories.json`, `data/ai-tools/*.json`, `lib/catalog-categories.js`, `lib/canonical-tool-schema.js` | None (fully compliant and tested). |
| **2** | **AI Tools Filtering** (Category, Subcategory, Pricing, Platform, Use Case, Tags) | ✅ Complete | `components/ai-tools/ToolFilterBar.jsx`, `lib/catalog-filtering.js`, `lib/catalog-filtering.test.js` | None (dynamic subcategories, active chips, and facet dropdowns fully operational). |
| **3** | **Build Your Toolkit** (Deterministic rule-based recommendations, workflow stages) | ✅ Complete | `lib/toolkit-recommender.js`, `app/build-toolkit/page.jsx`, `components/ai-tools/ToolkitBuilder.jsx` | None (deterministic scoring, goal profiles, stack sharing, batch saves tested). |
| **4** | **User Onboarding** (Skippable 3-step personalization: role, exp, interests, tech, goals, budget, platform) | ✅ Complete | `app/onboarding/page.jsx`, `app/api/user/profile/route.js`, `data/supabase_migration.sql` | None (saves to Supabase `user_profiles` with skip option). |
| **5** | **Profile** (Personalization / Preferences section, Saved Tools, Contributions) | ✅ Complete | `components/user/ProfileDashboard.jsx`, `app/profile/page.jsx`, `app/api/user/profile/route.js` | Add Saved Prompts/Knowledge tab/toggle to Saved items view. |
| **6 & 7** | **AI Knowledge & Discovery** (Prompts, Tricks, Slash Commands, Techniques, Guides, Search, Facets, Copy, Save) | ⚠️ Mostly Complete (Minor Gaps) | `data/default-prompts.json`, `components/prompts/PromptLibrary.jsx`, `app/ai-prompts-tricks/page.jsx`, `app/api/prompts/route.js` | 1. Add `useCase` and `tag` filter dropdowns in `PromptLibrary` & API.<br>2. Add Save button on prompt cards and detail pages.<br>3. Track copy events to `analytics_prompt_events`.<br>4. Add `/ai-knowledge` route. |
| **8** | **Contributions** (Users submit tools & prompts/tricks with `pending/approved/rejected`, admin-only moderation) | ✅ Complete | `app/contribute/page.jsx`, `components/contributions/ContributionForms.jsx`, `app/api/contributions/*`, `app/api/admin/suggestions/route.js`, `components/admin/SuggestionsManager.jsx` | None (tested with `lib/suggestions.test.js`). |
| **9** | **JSON Import** (Validate → Preview → Detect new/existing → Confirm → Selective image update) | ✅ Complete | `components/admin/BulkToolJsonImport.jsx`, `lib/tool-json-validation.js`, `app/api/admin/tools/import/route.js` | None (tested with `lib/import-integration.test.js`). |
| **10** | **Analytics** (Tool views/clicks/saves, prompt views/copies/saves; non-blocking) | ⚠️ Mostly Complete | `app/api/track/*`, `app/api/contributions/prompts/[id]`, `app/studio/analytics/page.jsx` | Connect client copy event to analytics API; add `export const dynamic = 'force-dynamic'` to `/studio/analytics`. |
| **11** | **Saved Tools & Knowledge** (Unified bookmarking system for tools and knowledge) | ⚠️ Mostly Complete | `components/ai-tools/BookmarkButton.jsx`, `app/api/user/bookmarks/route.js`, `data/supabase_migration.sql` | Expose saved prompts alongside saved tools in `ProfileDashboard`. |
| **12** | **Hybrid Architecture** (JSON for catalog, Supabase for auth/user/saves/reviews/analytics) | ✅ Complete | Repository-wide architecture adhering to hybrid boundaries. | None. |
| **13** | **Constraints** (No Studio AI Tools redesign, no LLM recs, no multi-admin, preserve dark/light theme) | ✅ Complete | Verified all constraints respected. | None. |

---

## Proposed Changes

### 1. AI Knowledge Filtering & Telemetry (`app/api/prompts/route.js`, `components/prompts/PromptLibrary.jsx`)
- Update `GET /api/prompts` to parse `useCase` and `tag` query parameters and filter both Supabase rows and fallback defaults.
- Update `PromptLibrary.jsx` to render Use-Case and Tag dropdown filters alongside Content Type, Model, and Category.
- Update `handleCopy` in `PromptLibrary.jsx` to fire non-blocking analytics event (`POST /api/contributions/prompts/[id]` with `{ action: 'copy' }`).

### 2. AI Knowledge Saving / Bookmarking (`components/prompts/SavePromptButton.jsx`, `components/prompts/PromptLibrary.jsx`, `app/ai-prompts-tricks/[id]/page.jsx`)
- Create a lightweight `SavePromptButton.jsx` (reusing optimistic state pattern from `BookmarkButton.jsx`) to allow authenticated users to save/unsave knowledge items via `POST /api/contributions/prompts/[id]`.
- Place `SavePromptButton` on prompt cards in `PromptLibrary.jsx` and on the `/ai-prompts-tricks/[id]` detail page.

### 3. AI Knowledge Route Alias (`app/ai-knowledge/page.jsx`)
- Create `app/ai-knowledge/page.jsx` with canonical title "AI Knowledge: Prompts, Tricks & Workflows", embedding `PromptLibrary` so both `/ai-knowledge` and `/ai-prompts-tricks` resolve cleanly.

### 4. Profile Dashboard Saved Knowledge Integration (`app/profile/page.jsx`, `components/user/ProfileDashboard.jsx`)
- In `app/profile/page.jsx`, query user's `saved_prompts` table in Supabase via `Promise.allSettled`.
- In `ProfileDashboard.jsx`, add sub-toggle / section under "Saved Items" to view both **Saved Tools** and **Saved AI Knowledge**, displaying saved prompts with direct copy, view, and remove actions.

### 5. Studio Analytics Server Optimization (`app/studio/analytics/page.jsx`)
- Add `export const dynamic = 'force-dynamic'` to prevent dynamic cookie rendering warnings during static generation.

### 6. Automated Testing (`lib/knowledge-and-analytics.test.js`)
- Add unit tests verifying:
  - Prompt use-case and tag filtering.
  - Prompt save/remove action handling.
  - Prompt copy event tracking payload structure.

### 7. Documentation (`.project-docs/DEVELOPMENT.md`)
- Record completed features, changes, and verification per `RULES.md`.

---

## Verification Plan

1. **Automated Unit Tests**:
   - Run `npm test` and verify that all existing 32 tests + new tests pass with 0 failures.

2. **Next.js Production Build**:
   - Run `npm run build` and ensure all 43+ routes build cleanly with 0 errors.

3. **End-to-End Flow Verification**:
   - **Authentication**: Check login, signup, session hydration.
   - **Onboarding & Profile Preferences**: Check `/onboarding` step navigation, skipping, and `/profile` preferences update.
   - **AI Tools Filtering**: Check category, subcategory, pricing, platform, use case, tags in `/ai-tools`.
   - **Build Your Toolkit**: Check `/build-toolkit` deterministic goal workflows and stack sharing.
   - **AI Knowledge & Discovery**: Check `/ai-knowledge` & `/ai-prompts-tricks`, filter by type/model/category/use-case/tag, copy prompt with visual feedback, and save prompt.
   - **Saved Items in Profile**: Verify saved tools and saved prompts render and can be removed.
   - **Contributions & Moderation**: Check `/contribute` form and `/studio/suggestions` moderation controls.
   - **JSON Import & Images**: Confirm conflict preview, selective image replacement, and canonical validation.
