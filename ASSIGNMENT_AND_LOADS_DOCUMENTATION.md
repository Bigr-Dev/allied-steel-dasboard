# Assignment and Loads System Documentation

## Table of Contents
1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Assignment System](#assignment-system)
4. [Loads System](#loads-system)
5. [Data Flow](#data-flow)
6. [Component Architecture](#component-architecture)
7. [Styling and UI](#styling-and-ui)
8. [API Integration](#api-integration)

## Overview

The Assignment and Loads system is a comprehensive vehicle and order management platform built with Next.js 14, featuring real-time tracking, drag-and-drop assignment capabilities, and Excel export functionality.

## Technology Stack

### Core Framework
- **Next.js 14** - App Router with Server Components
- **React 18** - Client-side interactivity
- **TypeScript/JavaScript** - Type safety and development

### UI Components & Styling
- **shadcn/ui** - Component library built on Radix UI
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library
- **@dnd-kit** - Drag and drop functionality

### State Management
- **Zustand** - Lightweight state management
- **React Context** - Global state provider
- **React Hooks** - Local component state

### Data & APIs
- **ExcelJS** - Excel file generation and manipulation
- **WebSocket** - Real-time TCP feed integration
- **Fetch API** - HTTP requests to backend

### Additional Libraries
- **date-fns** - Date manipulation
- **clsx** - Conditional class names
- **react-hook-form** - Form handling

## Assignment System

### Core Functionality

The Assignment system manages vehicle-to-order assignments with the following capabilities:

#### 1. Plan Management
- Create and manage delivery plans
- Set delivery dates and branch scope
- Track plan status (planning, committed, completed)

#### 2. Vehicle Assignment
- Assign orders to vehicles/drivers
- Real-time capacity monitoring
- Drag-and-drop order management
- Automatic capacity calculations

#### 3. Route Optimization
- Group orders by route and suburb
- Visual route badges and indicators
- Capacity utilization tracking

### Data Structure

#### Plan Object
```javascript
{
  "id": "uuid",
  "plan_name": "string",
  "delivery_start": "YYYY-MM-DD",
  "delivery_end": "YYYY-MM-DD", 
  "scope_all_branches": boolean,
  "status": "planning|committed|completed",
  "notes": "string",
  "created_at": "ISO timestamp",
  "updated_at": "ISO timestamp"
}
```

#### Unit Object
```javascript
{
  "planned_unit_id": "uuid",
  "plan_id": "uuid",
  "vehicle_assignment_id": "uuid",
  "vehicle_id": "uuid",
  "driver_id": "uuid",
  "vehicle": {
    "registration": "string",
    "fleet_number": "string",
    "category": "string",
    "capacity": number
  },
  "driver": {
    "name": "string"
  },
  "summary": {
    "orders_assigned": number,
    "items_assigned": number,
    "total_quantity": number,
    "total_weight": number
  },
  "orders": [Order]
}
```

### Key Components

#### 1. LoadAssignment (`/src/components/layout/assignment/load-assignment.jsx`)
**Purpose**: Main assignment interface with vehicle cards and unassigned items

**Features**:
- Tabbed interface (Vehicle Assignment / Unassigned Items)
- Search and filtering
- Capacity visualization with progress bars
- Route grouping and badges
- Click navigation to detailed views

**Data Sources**:
- `assignment_preview` from global context
- Real-time updates via WebSocket

#### 2. AssignmentBoard (`/src/components/layout/assignment/AssignmentBoard.jsx`)
**Purpose**: Drag-and-drop assignment interface

**Features**:
- Draggable order items
- Droppable vehicle cards
- Real-time capacity updates
- Visual feedback for drag operations

#### 3. VehicleCard (`/src/components/layout/assignment/VehicleCard.jsx`)
**Purpose**: Individual vehicle display with assigned orders

**Features**:
- Collapsible route sections
- Order grouping by route/suburb
- Capacity indicators
- Action menu (unassign all, change vehicle, assign driver)

#### 4. UnassignedList (`/src/components/layout/assignment/UnassignedList.jsx`)
**Purpose**: Display and manage unassigned orders

**Features**:
- Order grouping by order number
- Draggable order groups
- Combined weight/item counts
- Search and filtering

### State Management

#### Global Context (`/src/context/global-context.jsx`)
```javascript
const GlobalContext = {
  assignment: {
    data: AssignmentData,
    loading: boolean,
    error: string
  },
  assignment_preview: AssignmentData,
  setAssignmentPreview: function
}
```

#### Assignment State (`/src/context/initial-states/assignment-state.js`)
```javascript
const initialAssignmentState = {
  titleSection: {
    title: "Load Assignment Plans",
    description: "Manage planned vehicle assignments",
    button: { text: "Create Assignment Plan", icon: PlusIcon }
  },
  tableInfo: {
    title: "Assignment Plans",
    filterColumn: "id",
    filterPlaceholder: "Search plans..."
  },
  columns: function, // DataTable column definitions
  data: { plans: [], loading: false },
  loading: false,
  error: null
}
```

### API Endpoints

#### Plans API (`/src/app/api/plans/`)
- `GET /api/plans` - List all plans
- `POST /api/plans` - Create new plan or get plan details
- `DELETE /api/plans/[planId]` - Delete plan

#### Vehicle Assignment API (`/src/app/api/vehicle-assignment/`)
- `POST /api/vehicle-assignment` - Auto-assign loads
- `POST /api/vehicle-assignment/move` - Move items between vehicles
- `POST /api/vehicle-assignment/commit` - Commit assignments

#### Export API (`/src/app/api/plans/export-load-plan/`)
- `POST /api/plans/export-load-plan` - Generate Excel load plan
- `GET /api/plans/export-load-plan` - Download template

## Loads System

### Core Functionality

The Loads system manages individual order items and their assignment status:

#### 1. Order Management
- Track individual sales orders
- Monitor delivery dates and routes
- Customer and suburb organization

#### 2. Item Tracking
- Individual line items within orders
- Weight and quantity tracking
- Assignment status monitoring

#### 3. Route Organization
- Group by delivery routes
- Suburb-level organization
- Geographic optimization

### Data Structure

#### Order Object
```javascript
{
  "order_id": "uuid",
  "sales_order_id": number,
  "sales_order_number": "string",
  "delivery_date": "YYYY-MM-DD",
  "branch_id": "uuid",
  "route_name": "string",
  "suburb_name": "string", 
  "customer_name": "string",
  "total_weight": number,
  "total_quantity": number,
  "lines": [LineItem]
}
```

#### Line Item Object
```javascript
{
  "line_id": "uuid",
  "product_code": "string",
  "description": "string",
  "quantity": number,
  "weight": number,
  "assigned_quantity": number,
  "assigned_weight": number
}
```

### Key Components

#### 1. OrdersTable (`/src/components/loads/OrdersTable.jsx`)
**Purpose**: Display and manage sales orders

**Features**:
- Sortable columns
- Search and filtering
- Status indicators
- Action buttons

#### 2. DraggableItemRow (`/src/components/layout/assignment/DraggableItemRow.jsx`)
**Purpose**: Individual draggable order item

**Features**:
- Drag handle
- Item details display
- Weight/quantity indicators
- Assignment status

#### 3. ItemRow (`/src/components/layout/assignment/ItemRow.jsx`)
**Purpose**: Static display of order items

**Features**:
- Read-only item information
- Formatted weight/quantity
- Customer details

### Load Assignment Process

#### 1. Order Creation
```javascript
// Orders are created from sales system
const order = {
  sales_order_number: "7186076",
  delivery_date: "2025-11-03",
  customer_name: "Customer Name",
  route_name: "Route A",
  suburb_name: "Suburb Name",
  total_weight: 1500,
  lines: [...]
}
```

#### 2. Assignment Flow
```javascript
// 1. Load unassigned orders
const unassigned = await fetchUnassignedOrders(planId)

// 2. Drag order to vehicle
const movePayload = {
  order_id: "uuid",
  from_unit_id: null, // unassigned
  to_unit_id: "vehicle-uuid",
  weight: 1500
}

// 3. Update assignments
await moveOrderToVehicle(movePayload)

// 4. Refresh assignment data
setAssignmentPreview(updatedData)
```

## Data Flow

### 1. Initial Load
```
Page Load → Global Context → API Call → Assignment Data → Component Render
```

### 2. Real-time Updates
```
WebSocket → TCP Feed → Live Store (Zustand) → Component Re-render
```

### 3. Assignment Changes
```
User Action → API Call → Context Update → Component Re-render → WebSocket Broadcast
```

### 4. Export Process
```
Export Request → API Processing → Excel Generation → File Download
```

## Component Architecture

### Directory Structure
```
src/
├── components/
│   ├── layout/
│   │   └── assignment/
│   │       ├── AssignmentBoard.jsx
│   │       ├── load-assignment.jsx
│   │       ├── VehicleCard.jsx
│   │       ├── UnassignedList.jsx
│   │       ├── DraggableItemRow.jsx
│   │       └── ItemRow.jsx
│   ├── loads/
│   │   └── OrdersTable.jsx
│   └── single-pages/
│       ├── load-assignment-single.jsx
│       └── load-assignment-preview-single.jsx
├── context/
│   ├── global-context.jsx
│   ├── initial-states/
│   │   └── assignment-state.js
│   └── providers/
├── app/
│   └── api/
│       ├── plans/
│       ├── vehicle-assignment/
│       └── orders/
└── hooks/
    └── assignment-plan/
```

### Component Hierarchy
```
LoadAssignment
├── Tabs (shadcn/ui)
│   ├── TabsContent (Vehicle Assignment)
│   │   ├── DetailCard
│   │   │   ├── Search Input
│   │   │   └── Vehicle Cards Grid
│   │   │       └── Card (per vehicle)
│   │   │           ├── CardHeader
│   │   │           │   ├── Vehicle Info
│   │   │           │   ├── Driver Info
│   │   │           │   └── Badges
│   │   │           └── CardContent
│   │   │               ├── Route Badges
│   │   │               └── Capacity Progress
│   └── TabsContent (Unassigned Items)
│       └── DetailCard
│           └── DataTable
└── AssignmentBoard (drag-drop context)
```

## Styling and UI

### Design System

#### Color Palette
```css
/* Primary Colors */
--primary: #003e69;        /* Allied Steel Blue */
--primary-foreground: #ffffff;

/* Status Colors */
--destructive: #ef4444;    /* Over capacity */
--amber-500: #f59e0b;      /* Near capacity */
--muted-foreground: #6b7280; /* Secondary text */

/* Background */
--background: #ffffff;
--muted: #f9fafb;
--accent: #f3f4f6;
```

#### Typography
```css
/* Headers */
.text-xl { font-size: 1.25rem; }
.font-bold { font-weight: 700; }
.uppercase { text-transform: uppercase; }

/* Body Text */
.text-sm { font-size: 0.875rem; }
.text-xs { font-size: 0.75rem; }
.font-medium { font-weight: 500; }
```

#### Layout Classes
```css
/* Grid Layouts */
.grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
.md:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.lg:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }

/* Spacing */
.gap-4 { gap: 1rem; }
.p-4 { padding: 1rem; }
.space-y-4 > * + * { margin-top: 1rem; }
```

### Component Styling

#### Vehicle Cards
```jsx
<Card className="cursor-pointer hover:shadow-lg transition-shadow">
  <CardHeader className="pb-3">
    {/* Vehicle and driver info */}
  </CardHeader>
  <CardContent className="flex flex-col min-h-[150px] justify-between">
    {/* Route badges and capacity */}
  </CardContent>
</Card>
```

#### Progress Bars
```jsx
<ProgressBar
  value={capacityPercentage}
  className={
    isOverCapacity
      ? 'bg-destructive'
      : isNearCapacity
      ? 'bg-amber-500'
      : 'bg-primary'
  }
/>
```

#### Status Badges
```jsx
<Badge variant="secondary" className="text-xs">
  {vehicle.type}
</Badge>
<Badge variant="outline" className="text-xs">
  {unit?.summary?.orders_assigned || 0} orders
</Badge>
```

### Responsive Design

#### Breakpoints
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

#### Grid Responsiveness
```jsx
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
```

#### Text Responsiveness
```jsx
<span className="hidden sm:inline">Cards</span>
```

## API Integration

### Data Fetching Pattern
```javascript
// Custom fetch wrapper
import { fetchData } from '@/lib/fetch'

const loadAssignmentData = async (planId) => {
  try {
    const response = await fetchData(`plans/`, 'POST', {
      plan_id: planId,
      include_nested: true,
      include_idle: true
    })
    return response
  } catch (error) {
    console.error('Failed to load assignment data:', error)
    throw error
  }
}
```

### WebSocket Integration
```javascript
// Real-time TCP feed
const ws = new WebSocket(wsUrl)

ws.onmessage = (event) => {
  const data = JSON.parse(event.data)
  const packets = parseRawTcpData(data.rawMessage)
  const filtered = packets.filter(p => 
    targetPlates.includes(p.Plate?.toUpperCase())
  )
  upsertPackets(filtered) // Update Zustand store
}
```

### Excel Export Integration
```javascript
// Generate and download Excel file
const exportLoadPlan = async (assignmentData) => {
  const response = await fetch('/api/plans/export-load-plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(assignmentData)
  })
  
  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'load-plan.xlsx'
  a.click()
}
```

### Error Handling
```javascript
// Global error handling pattern
try {
  const result = await apiCall()
  return result
} catch (error) {
  console.error('API Error:', error)
  toast({
    title: 'Error',
    description: error.message,
    variant: 'destructive'
  })
  throw error
}
```

## Key Features Summary

### Assignment System
- ✅ Drag-and-drop order assignment
- ✅ Real-time capacity monitoring
- ✅ Route-based organization
- ✅ Excel export functionality
- ✅ Search and filtering
- ✅ Responsive design
- ✅ WebSocket integration

### Loads System  
- ✅ Order management
- ✅ Item tracking
- ✅ Status monitoring
- ✅ Route optimization
- ✅ Customer organization
- ✅ Weight/quantity tracking
- ✅ Assignment workflow

This documentation provides a comprehensive overview of the Assignment and Loads system architecture, enabling recreation of these features with full understanding of the data flow, component structure, and styling approach.