# Allied Steel Dashboard - Application Documentation

## Overview
A comprehensive fleet management and load assignment dashboard built with Next.js 15, React 19, and modern web technologies. The application manages vehicle tracking, load assignments, route planning, and real-time fleet monitoring for Allied Steel operations.

## Technology Stack

### Core Framework
- **Next.js 15.4.6** - React framework with App Router
- **React 19.1.0** - UI library with latest features
- **TypeScript/JavaScript** - Mixed codebase (JSX files)

### Styling & UI
- **Tailwind CSS v4** - Utility-first CSS framework
- **Shadcn/ui** - Component library built on Radix UI
- **Radix UI** - Headless UI components
- **Lucide React** - Icon library
- **CSS Variables** - Custom color system with light/dark themes

### State Management
- **Zustand** - Lightweight state management
- **React Context** - Global application state
- **React Hook Form** - Form state management

### Data & APIs
- **Supabase** - Backend as a Service
- **TanStack Table** - Data table management
- **Custom API Routes** - Next.js API endpoints

### Maps & Geolocation
- **Mapbox GL** - Interactive maps
- **Geocoding Services** - Address to coordinates conversion

### Drag & Drop
- **@dnd-kit** - Modern drag and drop library

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication routes
│   ├── (dashboard)/              # Main dashboard routes
│   │   ├── [page_id]/           # Dynamic page routing
│   │   ├── @header/             # Parallel route - header
│   │   ├── @sidebar/            # Parallel route - sidebar
│   │   └── layout.jsx           # Dashboard layout
│   ├── api/                     # API routes
│   └── globals.css              # Global styles
├── components/
│   ├── forms/                   # Form components
│   ├── layout/                  # Layout components
│   │   ├── assignment/          # Load assignment components
│   │   └── dashboard/           # Dashboard-specific components
│   ├── single-pages/            # Individual page components
│   └── ui/                      # Reusable UI components
├── context/                     # React Context providers
│   ├── actions/                 # Action creators
│   ├── apis/                    # API functions
│   ├── initial-states/          # Initial state definitions
│   ├── providers/               # Context providers
│   └── reducers/                # State reducers
├── hooks/                       # Custom React hooks
├── lib/                         # Utility libraries
└── config/                      # Configuration files
```

## Key Features

### 1. Fleet Management Dashboard
- **Real-time vehicle tracking** with live GPS data
- **Status monitoring** (moving, stationary, delayed, depot, offline)
- **Driver information** and assignment tracking
- **Vehicle capacity** and load monitoring
- **Route visualization** on interactive maps

### 2. Load Assignment System
- **Drag-and-drop interface** for assigning orders to vehicles
- **Capacity management** with visual indicators
- **Route optimization** and planning
- **Customer grouping** by location and route
- **Real-time updates** across multiple views

### 3. Interactive Maps
- **Mapbox integration** for route visualization
- **Vehicle markers** with real-time positioning
- **Geofencing** and depot detection
- **Address geocoding** and route planning

### 4. Data Management
- **CRUD operations** for all entities (vehicles, drivers, customers, orders)
- **Advanced filtering** and search capabilities
- **Data tables** with sorting and pagination
- **Export functionality** (Excel templates)

## Component Architecture

### Layout Components
- **Sidebar Navigation** - Collapsible sidebar with route-based navigation
- **Header** - Top navigation with user controls and notifications
- **Page Container** - Consistent page layout wrapper
- **Detail Action Bar** - Action buttons for individual pages

### Dashboard Components
- **Card View** - Grid layout for vehicle cards with live data
- **Map View** - Interactive map with vehicle tracking
- **Statistics Cards** - KPI displays with animated counters
- **Filter Panels** - Advanced filtering controls

### Assignment Components
- **Vehicle Card** - Detailed vehicle information with drag-drop zones
- **Unassigned List** - Bucket for unassigned orders
- **Assignment Board** - Main drag-drop interface
- **Progress Indicators** - Capacity and completion tracking

### Form Components
- **Dynamic Forms** - Auto-generated forms based on data schemas
- **Address Autocomplete** - Geocoding-enabled address inputs
- **File Upload** - Excel template processing
- **Validation** - Zod schema validation

## Styling System

### Color Scheme
```css
/* Light Theme */
--primary: oklch(0.21 0.006 285.885)     /* Dark blue */
--secondary: oklch(0.967 0.001 286.375)  /* Light gray */
--accent: oklch(0.967 0.001 286.375)     /* Light gray */
--muted: oklch(0.967 0.001 286.375)      /* Light gray */
--background: oklch(1 0 0)               /* White */
--foreground: oklch(0.141 0.005 285.823) /* Dark text */

/* Status Colors */
--moving: #10b981      /* Green */
--stationary: #ef4444  /* Red */
--delayed: #f59e0b     /* Amber */
--depot: #003e69       /* Dark blue */
--offline: #9ca3af     /* Gray */
```

### Component Patterns
- **Card-based layouts** with consistent spacing
- **Badge system** for status indicators
- **Responsive grid** layouts (1-4 columns)
- **Hover effects** and transitions
- **Loading states** with skeletons and spinners

## State Management

### Global Context Structure
```javascript
{
  // Entity States
  branches: { data: [], loading: false, error: null },
  customers: { data: [], loading: false, error: null },
  drivers: { data: [], loading: false, error: null },
  vehicles: { data: [], loading: false, error: null },
  orders: { data: [], loading: false, error: null },
  
  // Assignment State
  assignment_preview: { plan: {}, units: [], unassigned_orders: [] },
  
  // UI State
  selectedVehicle: null,
  mapView: 'card', // 'card' | 'map'
  filters: { status: new Set(), lastSeen: 'all' }
}
```

### Zustand Stores
- **Live Store** - Real-time vehicle data
- **Map Store** - Map state and interactions
- **Filter Store** - UI filter states

## API Integration

### Endpoint Structure
```
/api/
├── branches/           # Branch management
├── customers/          # Customer data
├── drivers/           # Driver management
├── vehicles/          # Vehicle fleet
├── orders/            # Sales orders
├── plans/             # Assignment plans
├── loads/             # Load management
└── vehicle-assignment/ # Assignment operations
```

### Data Flow
1. **Server-side data fetching** in page components
2. **Client-side updates** via API calls
3. **Real-time synchronization** with Supabase
4. **Optimistic updates** for better UX

## Key Utilities

### Date/Time Handling
- **Flexible timestamp parsing** from multiple formats
- **Relative time display** (e.g., "5m ago", "Live")
- **Timezone-aware** date operations

### Geolocation Services
- **Address geocoding** with Mapbox API
- **Route calculation** and optimization
- **Geofence detection** for depots

### Data Processing
- **Customer grouping** by route and location
- **Capacity calculations** with overflow detection
- **Status derivation** from live GPS data

## Performance Optimizations

### React Optimizations
- **useMemo** for expensive calculations
- **useCallback** for stable function references
- **React.memo** for component memoization
- **Lazy loading** for heavy components

### Data Optimizations
- **Pagination** for large datasets
- **Debounced search** to reduce API calls
- **Local storage** for user preferences
- **Optimistic updates** for immediate feedback

## Responsive Design

### Breakpoints
- **Mobile**: < 640px (1 column)
- **Tablet**: 640px - 1024px (2 columns)
- **Desktop**: 1024px - 1280px (3 columns)
- **Large**: > 1280px (4 columns)

### Mobile Adaptations
- **Collapsible sidebar** on mobile
- **Touch-friendly** drag and drop
- **Responsive tables** with horizontal scroll
- **Mobile-optimized** forms and inputs

## Development Patterns

### Component Patterns
```jsx
// Compound components for complex UI
<VehicleCard>
  <VehicleCard.Header />
  <VehicleCard.Content />
  <VehicleCard.Actions />
</VehicleCard>

// Render props for data sharing
<DataProvider>
  {({ data, loading, error }) => (
    <DataTable data={data} loading={loading} />
  )}
</DataProvider>
```

### Hook Patterns
```javascript
// Custom hooks for data fetching
const { data, loading, error, refetch } = useVehicles()

// Custom hooks for UI state
const { isOpen, open, close } = useModal()

// Custom hooks for complex logic
const { assign, unassign, move } = useAssignmentPlan()
```

## Security Considerations

### Authentication
- **Supabase Auth** for user management
- **JWT tokens** for API authentication
- **Route protection** with middleware

### Data Validation
- **Zod schemas** for runtime validation
- **Input sanitization** for XSS prevention
- **API rate limiting** for abuse prevention

## Deployment & Build

### Build Configuration
```javascript
// next.config.mjs
{
  experimental: {
    turbo: true // Turbopack for faster builds
  },
  images: {
    domains: ['mapbox.com'] // External image domains
  }
}
```

### Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_MAPBOX_TOKEN=
```

## Browser Support
- **Modern browsers** (Chrome 90+, Firefox 88+, Safari 14+)
- **ES2020** features used throughout
- **Progressive enhancement** for older browsers

This documentation provides a comprehensive overview of the Allied Steel Dashboard application architecture, enabling developers to understand, maintain, and extend the system effectively.