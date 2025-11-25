# Task: Create a Unified API Client Layer for the Frontend

The Allied Steel Dashboard currently uses multiple API entry points, including:

- `src/lib/api-client.js` (main API client) :contentReference[oaicite:10]{index=10}
- Context-level API functions under `src/context/apis/` :contentReference[oaicite:11]{index=11}
- Hooks under `src/hooks/` (e.g. `hooks/assignment-plan`, `hooks/loads`) that sometimes call `fetch` directly. :contentReference[oaicite:12]{index=12}
- Next.js API routes under `src/app/api/**` (plans, loads, auto-assign, vehicle-assignment, etc.) :contentReference[oaicite:13]{index=13}

## Goal

Introduce a **single, unified frontend API layer** under `src/lib/api/` that:

- Wraps all HTTP calls to backend/Next API routes.
- Provides clear, reusable functions per domain:
  - `planning-api.js`
  - `loads-api.js`
  - `vehicles-api.js`
  - `drivers-api.js`
  - `branches-api.js`
  - `customers-api.js`
  - `assignment-api.js` (auto-assign, move, commit) :contentReference[oaicite:14]{index=14}
- Is consumed by:
  - Context providers
  - Hooks
  - Components when needed

No TypeScript; only JavaScript.

## Steps

1. **Inspect `src/lib/api-client.js`**

   - Identify:
     - Base URL logic
     - Common headers (JSON, auth tokens, etc.)
     - Error handling patterns
   - Extract a core `request` function:

     ```js
     // src/lib/api/base-client.js
     export async function apiRequest(
       path,
       { method = 'GET', body, headers = {} } = {}
     ) {
       // implement using existing logic from api-client.js
     }
     ```

2. **Create domain-specific API modules**

   Under `src/lib/api/`, create:

   - `planning-api.js`
     - `getPlans()`
     - `getPlan(planId)`
     - `createPlan(payload)`
     - `deletePlan(planId)`
     - `autoAssignPlan(planId, options)`
     - `bulkAssign(planId, payload)` :contentReference[oaicite:15]{index=15}
   - `loads-api.js`
     - `getLoads(filters)`
     - `getOrders()`
   - `vehicles-api.js`
     - `getVehicles()`
   - `drivers-api.js`
     - `getDrivers()`
   - `branches-api.js`
     - `getBranches()`
   - `customers-api.js`
     - `getCustomers()`
   - `assignment-api.js`
     - `autoAssignLoads(payload)` → `POST /api/vehicle-assignment`
     - `moveAssignment(payload)` → `POST /api/vehicle-assignment/move`
     - `commitAssignments(payload)` → `POST /api/vehicle-assignment/commit` :contentReference[oaicite:16]{index=16}

   Each function should:

   - Use `apiRequest` internally.
   - Return parsed JSON (or throw on error).

3. **Refactor context `apis` to consume unified API**

   - In `src/context/apis/`, replace direct `fetch`/hard-coded URLs with imports from the domain API files.
   - Example:

     ```js
     // BEFORE
     const res = await fetch('/api/plans', { method: 'GET' })

     // AFTER
     import { getPlans } from '@/lib/api/planning-api'

     const plans = await getPlans()
     ```

4. **Refactor hooks to use the unified API**

   - In `src/hooks/assignment-plan/` and `src/hooks/loads/`, replace direct API calls with domain API functions.
   - Ensure that all high-level logic (retry, local state) stays in hooks, while low-level HTTP details live in `src/lib/api`.

5. **Keep backwards compatibility**

   - If other parts of the codebase import `src/lib/api-client.js` directly:
     - Keep `api-client.js` as a small wrapper that re-exports `apiRequest` or selected domain functions.
     - Mark it as `@deprecated` in comments for future cleanup.

6. **Centralise error handling**

   - Implement a consistent pattern in `apiRequest` for:
     - Handling non-2xx responses.
     - Parsing JSON safely.
     - Throwing a unified error object (e.g. `{ message, status, details }`).
   - Ensure that existing error UX (e.g. `toast({ title: 'Error', description: error.message })`) still works. :contentReference[oaicite:17]{index=17}

## Constraints

- Do not change the paths or methods of the Next.js API routes under `src/app/api/**`.
- No TypeScript; keep everything in `.js` / `.jsx`.
- No change to component behaviour; this is just a wiring/structure change.

## Deliverables

- `src/lib/api/base-client.js` with a reusable `apiRequest` function.
- Domain-specific modules under `src/lib/api/`.
- Updated context `apis` and hooks to use the new unified API layer.
- `src/lib/api-client.js` reduced to a thin compatibility wrapper (if still used).
