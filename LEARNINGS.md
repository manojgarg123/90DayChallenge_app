# Project Learnings — 90DayChallenge PWA

Lessons learned building this project. Reference before starting a new Supabase + Vite + React project.

---

## 1. Supabase Edge Functions — 401 "Invalid JWT" / "Invalid Token or Protected Header formatting"

**Root cause:** Supabase introduced new asymmetric API keys (`sbp_...` format) in 2025/2026. The legacy built-in JWT gateway check only understands the old HS256 JWT format. Passing the new publishable key as `Authorization: Bearer` fails because it is not a JWT.

**Fix — disable the built-in JWT check (pick one):**

a) **Dashboard** (no redeploy): Edge Functions → your function → toggle off "Enforce JWT Verification"

b) **CLI deploy flag:**
```bash
supabase functions deploy your-function --no-verify-jwt
```

c) **Config file** — create `supabase/config.toml` (main project level, NOT inside the function folder):
```toml
[functions.your-function-name]
verify_jwt = false
```

**Frontend call pattern that works (no JWT needed):**
```typescript
const res = await fetch(`${SUPABASE_URL}/functions/v1/your-function`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,   // no Authorization header needed
  },
  body: JSON.stringify({ payload }),
})
```

**Do NOT do this:**
- Do not use `supabase.functions.invoke()` when the project uses new asymmetric keys — it sends the session JWT which also fails the legacy check
- Do not pass the anon/publishable key as `Authorization: Bearer` — it is not a JWT

---

## 2. Supabase Key Names Changed

Supabase now calls the anon key the **"Publishable API key"** in the dashboard. Support both names in `.env`:

```typescript
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY
```

`.env.example`:
```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key-here
```

---

## 3. Vite 8 + Rolldown Breaking Changes

`npm audit fix --force` silently upgrades Vite 5 → 8. Vite 8 uses rolldown and has breaking changes:

- `@vitejs/plugin-react@4.x` is incompatible with Vite 8 — use `@vitejs/plugin-react@6.0.1`
- `manualChunks` as a plain object is removed — must be a function:

```typescript
// vite.config.ts — CORRECT for Vite 8
manualChunks(id) {
  if (id.includes('react-dom')) return 'react-vendor'
  if (id.includes('recharts')) return 'charts'
}

// WRONG — object form removed in Vite 8
manualChunks: {
  vendor: ['react', 'react-dom']
}
```

**Pin all versions exactly** (no `^`) in `package.json` to prevent silent upgrades:
```json
"vite": "8.0.3",
"@vitejs/plugin-react": "6.0.1"
```

---

## 4. npm Vulnerabilities — vite-plugin-pwa

`vite-plugin-pwa` pulls in `workbox-build` → `serialize-javascript` with known CVEs. Remove it and use a manual `public/manifest.json` instead for PWA support.

Use `overrides` in `package.json` to force safe versions of transitive dependencies:
```json
"overrides": {
  "lodash": "4.17.21",
  "esbuild": "0.25.0"
}
```

---

## 5. Blank Page When .env is Missing

If `supabase.ts` throws when env vars are missing, React crashes before rendering and shows a blank page with no error.

**Pattern — never throw in module scope:**
```typescript
// supabase.ts
export const isMissingConfig = !supabaseUrl || !supabaseAnonKey

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',  // fallback, no throw
  supabaseAnonKey || 'placeholder',
)
```

In `main.tsx`, check `isMissingConfig` before mounting React and show a helpful HTML error screen instead.

---

## 6. Edge Function Error Handling — Never Swallow Errors Silently

Always surface errors visibly in the UI during development. Silent catch blocks that fall back to defaults make debugging impossible.

```typescript
// BAD — hides the real error
catch (err) {
  setPlan(generateFallbackPlan(goal))  // user has no idea what went wrong
}

// GOOD — show the error
const [analyzeError, setAnalyzeError] = useState<string | null>(null)

catch (err) {
  setAnalyzeError(err instanceof Error ? err.message : String(err))
  setPlan(generateFallbackPlan(goal))
}

// In JSX:
{analyzeError && (
  <div className="error-banner">{analyzeError}</div>
)}
```

For Supabase `functions.invoke()`, the raw error body is in `error.context`:
```typescript
const ctx = (error as any).context
if (ctx) {
  const body = await ctx.json()
  detail = body.details || body.error || JSON.stringify(body)
}
```

Use raw `fetch()` instead of `functions.invoke()` for full visibility into status codes and response bodies.

---

## 7. React Router — Redirecting Away from a Route Breaks Navigation

If `AppShell` redirects users with an active challenge away from `/onboarding`, creating a new challenge becomes impossible.

Use `location.state` to pass intent flags:
```typescript
// AppShell.tsx — allow /onboarding if newChallenge flag is set
if (user && location.pathname === '/onboarding' && challenge) {
  if (!location.state?.newChallenge) {
    navigate('/dashboard', { replace: true })
  }
}

// HistoryPage.tsx — pass the flag when navigating
navigate('/onboarding', { state: { newChallenge: true } })
```

---

## 8. Windows Corporate Laptop Setup

- **SSL proxy error during npm install:** `npm config set strict-ssl false`
- **Packages installed on Linux, not working on Windows:** Delete `node_modules` and `package-lock.json`, reinstall with `npm install --legacy-peer-deps`
- **git pull blocked by local changes:** `git checkout -- package.json package-lock.json` then `git pull`

---

## 9. Claude API vs Claude.ai Subscription

A **Claude.ai Pro/Team subscription** does NOT include Anthropic API access. They are separate products billed separately.

- Claude.ai subscription → chat at claude.ai
- Anthropic API access → console.anthropic.com → API Keys → keys start with `sk-ant-...`

Always clarify this upfront when a project requires server-side Claude API calls.

---

## 10. Supabase Edge Function — ANTHROPIC_API_KEY Setup

The `ANTHROPIC_API_KEY` must be added as a **Supabase Secret** (not a regular env var):
- Dashboard → Edge Functions → Secrets → Add `ANTHROPIC_API_KEY`

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are automatically available inside all Edge Functions — no need to add them as secrets.

---

## Quick Start Checklist for Next Supabase + Vite Project

- [ ] Pin all package versions exactly (no `^`) to prevent silent upgrades
- [ ] Add `overrides` for lodash and esbuild in package.json
- [ ] Use `isMissingConfig` pattern — never throw in module scope
- [ ] Support both `VITE_SUPABASE_PUBLISHABLE_KEY` and `VITE_SUPABASE_ANON_KEY`
- [ ] Create `supabase/config.toml` with `verify_jwt = false` for any Edge Function that doesn't need user auth
- [ ] Deploy Edge Functions with `--no-verify-jwt` flag
- [ ] Call Edge Functions via raw `fetch()` with `apikey` header only
- [ ] Add `ANTHROPIC_API_KEY` to Supabase Secrets before testing AI features
- [ ] Always surface errors visibly in UI — no silent fallbacks during development
- [ ] Use `location.state` flags when navigating to routes that have redirect guards
