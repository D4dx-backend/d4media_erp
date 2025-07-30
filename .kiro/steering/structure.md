# D4 Media Project Structure

## Full Project Structure
```
d4-media-task-management/
├── .kiro/                     # Kiro AI configuration
│   └── steering/              # AI guidance documents
├── client/                    # React frontend
│   ├── public/               # Static assets
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── common/       # Shared components
│   │   │   ├── forms/        # Form components
│   │   │   └── layout/       # Layout components
│   │   ├── pages/            # Page components
│   │   │   ├── auth/         # Authentication pages
│   │   │   ├── dashboard/    # Dashboard pages
│   │   │   ├── tasks/        # Task management pages
│   │   │   ├── studio/       # Studio booking pages
│   │   │   └── reports/      # Reporting pages
│   │   ├── hooks/            # Custom React hooks
│   │   ├── context/          # React Context providers
│   │   ├── services/         # API service functions
│   │   ├── utils/            # Utility functions
│   │   ├── constants/        # Application constants
│   │   └── styles/           # Global styles
│   ├── package.json
│   └── vite.config.js
├── server/                    # Node.js backend
│   ├── src/
│   │   ├── controllers/      # Route controllers
│   │   ├── models/           # Mongoose models
│   │   ├── routes/           # Express routes
│   │   ├── middleware/       # Custom middleware
│   │   ├── services/         # Business logic services
│   │   ├── utils/            # Utility functions
│   │   ├── config/           # Configuration files
│   │   └── validators/       # Request validators
│   ├── uploads/              # File upload directory
│   ├── package.json
│   └── server.js
├── shared/                    # Shared utilities/types
├── docs/                      # Project documentation
├── package.json               # Root package.json for scripts
├── README.md
└── .env.example
```

## Naming Conventions
- **Files**: camelCase for JavaScript files (userController.js)
- **Components**: PascalCase for React components (TaskCard.jsx)
- **Directories**: kebab-case for folders (task-management/)
- **Constants**: UPPER_SNAKE_CASE (USER_ROLES)
- **Database**: camelCase for fields, PascalCase for models

## Component Organization
- Group components by feature/domain
- Keep related components together
- Use index.js files for clean imports
- Separate container and presentation components

## API Structure
- RESTful endpoints with clear resource naming
- Consistent response formats
- Proper HTTP status codes
- Version API endpoints (/api/v1/)

## File Organization Principles
- Feature-based organization over file-type organization
- Keep related files close together
- Use barrel exports (index.js) for clean imports
- Separate concerns (UI, business logic, data access)

## Mobile-First Structure
- Components designed for mobile screens first
- Responsive breakpoints in Tailwind config
- Touch-friendly component sizing
- Progressive enhancement for larger screens