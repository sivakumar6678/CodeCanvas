# CodeCanvas — Production Deployment & Troubleshooting Guide

This guide provides the complete, step-by-step instructions for deploying CodeCanvas to production, configuring the database, setting environment variables, and diagnosing why a deployment might serve an older version.

---

## 🔍 Why is the Deployment Serving an Old Version? (Troubleshooting)

If your live website is showing an older version of CodeCanvas instead of your latest updates, check these five common causes:

### 1. Local Commits Have Not Been Pushed to the Remote Repository
Git changes made locally must be pushed to GitHub/GitLab before your hosting provider can build them.
```bash
# Check status
git status

# If you see "Your branch is ahead of 'origin/main'", push the changes:
git push origin main
```

### 2. The Hosting Platform is Tracking a Different Production Branch
Hosting platforms (like Vercel or Netlify) build from a designated **Production Branch**:
- **In Vercel**: Go to **Project Settings > Git > Production Branch**.
- Ensure the production branch is set to `main` (not `Version-1`, `Version---1`, or `master`).
- If you push to `main` while Vercel is watching `Version-1`, Vercel will not trigger a new production deployment.

### 3. Build Cache is Serving Stale Build Artifacts
Hosting platforms cache `.next/cache` and `node_modules` across builds. To force a clean build:
- **In Vercel**: Go to **Deployments** > Click the three dots `...` next to the latest commit > Select **Redeploy** > Check **"Clear build cache"**.
- **In Vercel CLI**: Run `vercel --prod --force`.

### 4. Custom Domain is Pinned to an Old Preview Deployment
- In your hosting provider dashboard (**Settings > Domains**), verify that your production domain (e.g. `yourdomain.com`) is assigned to the **Production** environment (branch: `main`), and not locked to a specific preview deployment or old commit hash.

### 5. Browser or CDN Caching
- Hard refresh your browser: `Ctrl + Shift + R` (Windows/Linux) or `Cmd + Shift + R` (Mac).
- If using Cloudflare or an external CDN proxy, navigate to Cloudflare > **Caching > Configuration > Purge Everything**.

---

## 📋 Full Step-by-Step Deployment Guide

### Step 1: Push Verified Code to Main
Ensure all tests pass and push the merged codebase to `main`:
```bash
# Verify local suite
npm test
npm run lint
npm run build

# Push to remote
git checkout main
git push origin main
```

---

### Step 2: Execute Supabase Database Migration
1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your production project.
3. Open the **SQL Editor** from the left navigation.
4. Open the migration file in this repository: [`data/supabase_migration.sql`](data/supabase_migration.sql).
5. Paste the entire SQL script into the Supabase SQL Editor and click **Run**.
6. Verify that all 14 tables and security triggers are created.

---

### Step 3: Configure Supabase Authentication URLs
1. In the Supabase Dashboard, navigate to **Authentication > URL Configuration**.
2. **Site URL**: Enter your live production domain:
   ```
   https://yourdomain.com
   ```
3. **Redirect URLs (Allowed Callback URLs)**: Add the following URLs:
   ```
   https://yourdomain.com/auth/callback
   https://yourdomain.com/reset-password
   https://yourdomain.com/login
   http://localhost:3000/auth/callback
   ```
4. Click **Save**.

---

### Step 4: Configure Production Environment Variables
In your hosting dashboard (Vercel / Netlify / Railway), add these environment variables:

| Variable | Scope | Value Description |
| :--- | :---: | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview | Your Supabase Project API URL (`https://xyz.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview | Your Supabase anon public API key |
| `SUPABASE_SERVICE_ROLE_KEY` | Production (Secret) | Your Supabase `service_role` private key |
| `GEMINI_API_KEY` | Production (Secret) | Google AI Studio Gemini API key (optional for `/workspace`) |
| `ADMIN_EMAILS` | Production (Secret) | Comma-separated admin email addresses |
| `NEXT_PUBLIC_SITE_URL` | Production | Canonical site origin (`https://yourdomain.com`) |

---

### Step 5: Trigger Production Build
1. In Vercel / Netlify, trigger a new build or push to `main`.
2. Ensure the build command is `npm run build` or `next build`.
3. Ensure the Node.js version is set to `20.x` or `18.x`.
4. Wait for the build to complete and confirm the green **Ready** status.

---

## 🧪 Post-Deployment Smoke Test Checklist

Once deployed, perform these immediate sanity checks on your live domain:

- [ ] **Home Page (`/`)**: Hero section loads, category chips navigate, and featured tools showcase displays.
- [ ] **AI Tools Directory (`/ai-tools`)**: All 131 tools render, filters work, and pagination functions.
- [ ] **Global Search (`Cmd+K` / `Ctrl+K`)**: Search palette opens and finds matching tools.
- [ ] **Tool Details (`/ai-tools/tool/cursor`)**: Overviews, specs, pros/cons, and outbound links work.
- [ ] **AI Knowledge (`/ai-knowledge`)**: Prompts render and one-click copy works.
- [ ] **Authentication**: Register a new user, log in, and verify session persistence.
- [ ] **Bookmarks & Reviews**: Bookmark a tool; verify it appears in `/profile/bookmarks`. Submit a review.
- [ ] **Studio Admin (`/studio`)**: Log in as an admin; verify access to Tools Manager, Submissions, and Analytics.
- [ ] **Sitemap & Robots**: Verify `https://yourdomain.com/sitemap.xml` and `https://yourdomain.com/robots.txt`.
