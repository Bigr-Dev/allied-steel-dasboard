# Allied Steel Dashboard - File Structure

```
allied-steel-dasboard/
├── .next/                          # Next.js build output
├── public/                         # Static assets
│   ├── templates/                  # Excel templates
│   └── *.svg                      # Icon files
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── (auth)/
│   │   │   └── login/
│   │   ├── (dashboard)/
│   │   │   ├── [page_id]/         # Dynamic dashboard pages
│   │   │   │   ├── [id]/          # Item detail pages
│   │   │   │   ├── @statistics/   # Parallel route for stats
│   │   │   │   ├── @title/        # Parallel route for titles
│   │   │   │   └── create-plan/   # Plan creation pages
│   │   │   ├── @header/           # Parallel route for header
│   │   │   └── @sidebar/          # Parallel route for sidebar
│   │   ├── api/                   # API routes
│   │   │   ├── auto-assign/
│   │   │   ├── branches/
│   │   │   ├── customers/
│   │   │   ├── drivers/
│   │   │   ├── loads/
│   │   │   ├── plans/
│   │   │   │   └── [planId]/
│   │   │   │       ├── bulk-assign/
│   │   │   │       ├── unassign/
│   │   │   │       └── units/
│   │   │   ├── routes/
│   │   │   ├── users/
│   │   │   ├── vehicle-assignment/
│   │   │   └── vehicles/
│   │   └── globals.css
│   ├── assets/                    # Images and media
│   ├── components/
│   │   ├── forms/                 # Form components
│   │   │   └── trip-form/         # Trip form sections
│   │   ├── layout/                # Layout components
│   │   │   ├── assignment/        # Assignment-specific components
│   │   │   │   ├── AssignmentBoard.jsx
│   │   │   │   ├── DraggableItemRow.jsx
│   │   │   │   ├── load-assignment.jsx
│   │   │   │   ├── UnassignedList.jsx
│   │   │   │   └── VehicleCard.jsx
│   │   │   └── dashboard/         # Dashboard components
│   │   ├── loads/                 # Load management components
│   │   ├── map/                   # Map-related components
│   │   ├── single-pages/          # Individual page components
│   │   └── ui/                    # Reusable UI components
│   │       ├── data-table.jsx     # Data table component
│   │       ├── button.jsx
│   │       ├── card.jsx
│   │       └── ...               # Other UI components
│   ├── config/                    # Configuration files
│   │   ├── supabase.js
│   │   └── zustand.js
│   ├── constants/                 # App constants
│   │   ├── routes.js
│   │   └── types.js
│   ├── context/                   # React Context providers
│   │   ├── actions/               # Context actions
│   │   ├── apis/                  # API functions
│   │   ├── initial-states/        # Initial state definitions
│   │   ├── providers/             # Context providers
│   │   ├── reducers/              # State reducers
│   │   └── global-context.js      # Main global context
│   ├── hooks/                     # Custom React hooks
│   │   ├── assignment-plan/
│   │   ├── loads/
│   │   └── *.js                   # Various utility hooks
│   ├── lib/                       # Utility libraries
│   │   ├── api/
│   │   ├── api-client.js          # Main API client
│   │   ├── utils.js               # Utility functions
│   │   └── *.js                   # Other utilities
│   └── middleware/                # Next.js middleware
├── .env.local                     # Environment variables
├── .gitignore
├── components.json                # shadcn/ui config
├── jsconfig.json                  # JavaScript config
├── next.config.mjs                # Next.js configuration
├── package.json                   # Dependencies
├── postcss.config.mjs             # PostCSS config
├── README.md                      # Project documentation
└── test.json                      # Test data
```

## Key Directories

### `/src/app/`
- Next.js 13+ App Router structure
- API routes for backend functionality
- Parallel routes for complex layouts

### `/src/components/`
- **forms/**: Form components for data entry
- **layout/**: Layout and navigation components
- **assignment/**: Load assignment specific components
- **ui/**: Reusable UI components (shadcn/ui based)

### `/src/context/`
- Global state management using React Context
- Organized by feature (auth, loads, assignments, etc.)

### `/src/hooks/`
- Custom React hooks for data fetching and state management
- Feature-specific hooks organized in subdirectories

### `/src/lib/`
- Utility functions and API clients
- Configuration and helper functions

## Technology Stack
- **Framework**: Next.js 14+ with App Router
- **UI**: shadcn/ui components with Tailwind CSS
- **State**: React Context + Reducers
- **Database**: Supabase
- **Maps**: Mapbox GL
- **Drag & Drop**: @dnd-kit
- **Tables**: @tanstack/react-table