# Technology Stack

## Frontend (React)
- **Framework**: React 18+ with functional components and hooks
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS for mobile-first responsive design
- **State Management**: Context API + useReducer for complex state
- **Routing**: React Router v6 for client-side navigation
- **HTTP Client**: Axios for API communication
- **UI Components**: Custom components with focus on mobile-first design

## Backend (Node.js)
- **Runtime**: Node.js 18+ with Express.js framework
- **Authentication**: JWT tokens with refresh token strategy
- **File Upload**: Multer for handling file uploads
- **PDF Generation**: PDFKit or Puppeteer for invoice generation
- **Email**: Nodemailer for notifications
- **Validation**: Joi or express-validator for request validation
- **Security**: Helmet, CORS, rate limiting

## Database (MongoDB)
- **Database**: MongoDB with Mongoose ODM
- **Schema Design**: Embedded documents for related data
- **Indexing**: Proper indexing for performance
- **Aggregation**: MongoDB aggregation pipeline for reports

## Development Tools
- **Package Manager**: npm
- **Linting**: ESLint with Airbnb config
- **Formatting**: Prettier
- **Testing**: Jest + React Testing Library
- **Environment**: dotenv for configuration

## Common Commands
```bash
# Install dependencies
npm install

# Run development servers
npm run dev          # Start both frontend and backend
npm run dev:client   # Frontend only (port 3000)
npm run dev:server   # Backend only (port 5000)

# Database
npm run db:seed      # Seed initial data
npm run db:reset     # Reset database

# Testing
npm test             # Run all tests
npm run test:watch   # Watch mode

# Build for production
npm run build        # Build frontend
npm start           # Start production server
```

## Mobile-First Approach
- Responsive design with Tailwind CSS breakpoints
- Touch-friendly UI components
- Progressive Web App (PWA) capabilities
- Optimized for mobile performance
- Offline functionality where applicable

## Code Quality Standards
- ESLint + Prettier for consistent code formatting
- Husky pre-commit hooks for code quality
- Component-based architecture
- RESTful API design principles
- Error handling and logging
- Input validation and sanitization