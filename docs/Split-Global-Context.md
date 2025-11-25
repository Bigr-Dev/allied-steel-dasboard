# Task: Split Global Context into Domain Providers

You are working on the **Allied Steel Dashboard** frontend, built with Next.js (App Router), React, React Context, Zustand, and shadcn/ui.  
The current global context is described as a single `GlobalContext` storing branches, customers, drivers, vehicles, orders, assignment_preview, plus UI state such as selectedVehicle, mapView, filters, etc. :contentReference[oaicite:1]{index=1}  
Context files live under `src/context/`:

- `src/context/global-context.js`
- `src/context/providers/`
- `src/context/actions/`
- `src/context/initial-states/`
- `src/context/reducers/` :contentReference[oaicite:2]{index=2}

The Assignment & Loads documentation shows that assignment-related state and initial state are defined in:

- `src/context/global-context.jsx`
- `src/context/initial-states/assignment-state.js` :contentReference[oaicite:3]{index=3}

## Goal

**Refactor the single global context into feature/domain-specific providers** while preserving behaviour:

- Keep **public API of hooks and components the same** (no breaking changes for pages).
- Create smaller, focused providers for:
  - `BranchesProvider`
  - `CustomersProvider`
  - `DriversProvider`
  - `VehiclesProvider`
  - `Orders/LoadsProvider`
  - `AssignmentProvider`
  - `UIStateProvider` (for things like `mapView`, filters, selectedVehicle)

Zustand stores and other state (live telemetry, map store, etc.) must remain intact. :contentReference[oaicite:4]{index=4}

## Steps

1. **Inspect current global context**

   - Open `src/context/global-context.js` (or `.jsx`) and identify:
     - The shape of the state (as documented in APP_DOCUMENTATION and ASSIGNMENT docs). :contentReference[oaicite:5]{index=5} :contentReference[oaicite:6]{index=6}
     - Which parts are:
       - Entity data (branches, customers, drivers, vehicles, orders/loads)
       - Assignment state (`assignment`, `assignment_preview`)
       - UI state (`selectedVehicle`, `mapView`, filters, etc.)

2. **Create domain-specific context files**

   Under `src/context/providers/`, create:

   - `branches-provider.jsx`
   - `customers-provider.jsx`
   - `drivers-provider.jsx`
   - `vehicles-provider.jsx`
   - `orders-provider.jsx` (or `loads-provider.jsx`)
   - `assignment-provider.jsx`
   - `ui-provider.jsx`

   Each provider should:

   - Use `React.createContext` + `useReducer` or `useState` as per current pattern.
   - Initialise its state using the relevant slice from files like `src/context/initial-states/*.js`. :contentReference[oaicite:7]{index=7}

3. **Move reducers and actions into domain-specific locations**

   - In `src/context/reducers/` and `src/context/actions/`, identify reducers/actions currently manipulating:
     - Branches data
     - Customers data
     - Vehicles
     - Drivers
     - Orders/loads
     - Assignment preview/data
     - UI-only state (filters, selected vehicle, etc.)
   - Group them into separate modules, e.g.:
     - `reducers/branches-reducer.js`
     - `reducers/vehicles-reducer.js`
     - `reducers/assignment-reducer.js`
     - `reducers/ui-reducer.js`
   - Wire these reducers into respective providers.

4. **Introduce a `RootAppProvider` that composes all domain providers**

   - Create `src/context/providers/root-app-provider.jsx`:
     ```jsx
     export function RootAppProvider({ children }) {
       return (
         <BranchesProvider>
           <CustomersProvider>
             <DriversProvider>
               <VehiclesProvider>
                 <OrdersProvider>
                   <AssignmentProvider>
                     <UIProvider>{children}</UIProvider>
                   </AssignmentProvider>
                 </OrdersProvider>
               </VehiclesProvider>
             </DriversProvider>
           </CustomersProvider>
         </BranchesProvider>
       )
     }
     ```
   - Replace existing usage of `GlobalProvider` in top-level layout (e.g. `src/app/(dashboard)/layout.jsx`) with `RootAppProvider`. :contentReference[oaicite:8]{index=8}

5. **Preserve existing hooks / exports**

   If there are existing hooks like `useGlobalContext()` used throughout:

   - Create a compatibility layer in `src/context/global-context.js` that:
     - Internally uses the new providers/contexts.
     - Exposes selectors that combine data from domain contexts.
   - This ensures components/pages do not break immediately.

6. **Gradual migration (optional but preferred)**

   - Internally, start updating components to use the new domain-specific hooks:
     - `useBranches()`, `useCustomers()`, `useVehicles()`, `useAssignment()` etc.
   - Keep `useGlobalContext()` for backwards compatibility but mark as `@deprecated` in comments.

## Constraints

- Do **not** change external behaviour of any page or component.
- Do **not** convert files to TypeScript; keep everything in JavaScript/JSX.
- Ensure that all providers work correctly with existing Zustand stores and WebSocket/supabase logic. :contentReference[oaicite:9]{index=9}

## Deliverables

- New domain-specific providers in `src/context/providers/`.
- Updated reducers/actions organised by domain.
- A `RootAppProvider` composing all domain providers.
- `global-context.js` kept as a compatibility layer (for now) so existing imports do not break.
- All tests and pages still build and run as before.
