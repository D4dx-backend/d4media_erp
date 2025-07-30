# D4 Media Task Management System

A comprehensive task management system for D4 Media digital agency with multiple departments including Studio Booking, Graphic Design, Video Editing, Events, and Google/Zoom Services.

## Features

### Core Functionality

- **Multi-Department Management**: Studio Booking, Graphic Design, Video Editing, Events, Google/Zoom Services
- **Role-Based Access Control**: Super Admin, Department Admin, Department Staff, Reception, and Client roles
- **Studio Booking System**: Inquiry management, confirmation, and automated invoice generation
- **Task Management**: Creation, assignment, progress tracking across all departments
- **Billing & Invoicing**: Task-based and periodic billing with PDF generation
- **Client Portal**: Real-time project visibility and communication
- **Comprehensive Reporting**: Daily, weekly, monthly analytics and insights

### Technical Features

- **Mobile-First Design**: Responsive UI optimized for mobile devices
- **Real-Time Updates**: Live task status and notification system
- **File Management**: Upload and manage project assets
- **PDF Generation**: Automated invoice and report generation
- **Email Integration**: Automated notifications and communications

## Technology Stack

- **Frontend**: React 18+ with Vite, Tailwind CSS
- **Backend**: Node.js with Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT with refresh tokens
- **File Storage**: Local storage with Multer

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Start development servers
npm run dev

# Access the application
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
```

## User Roles

1. **Super Admin**: Full system access and management
2. **Reception/Office Staff**: Front-line task entry and client management
3. **Department Admin**: Department-specific administrative access
4. **Department Staff**: Task execution and progress updates
5. **Client**: Project tracking and feedback

## Departments

- **Studio Booking**: Equipment and space reservation management
- **Graphic Design**: Creative project workflow
- **Video Editing**: Video production pipeline
- **Events**: Shoots, edits, and event coordination
- **Google/Zoom Services**: Digital service management

## Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.production.example .env
# Edit .env with your configuration

# Run development mode
npm run dev          # Both frontend and backend
npm run dev:client   # Frontend only
npm run dev:server   # Backend only

# Testing
npm test

# Build for production
npm run build
```

## Deployment

The application is designed for deployment with:

- **Frontend**: Netlify (or similar static hosting)
- **Backend**: DigitalOcean App Platform (or similar Node.js hosting)
- **Database**: MongoDB Atlas (or self-hosted MongoDB)

### Quick Deployment Setup

1. **Environment Variables**: Set required environment variables for CORS configuration

   ```bash
   CLIENT_URL=https://your-frontend-domain.com
   ALLOWED_ORIGINS=https://your-frontend-domain.com
   VITE_API_URL=https://your-backend-domain.com/api/v1
   ```

2. **CORS Configuration**: Critical for cross-origin communication

   - Frontend and backend must be configured with matching domains
   - See [Deployment Guide](./docs/DEPLOYMENT_GUIDE.md) for detailed instructions

3. **Database**: Configure MongoDB connection string
   ```bash
   MONGODB_URI=your-mongodb-connection-string
   ```

For complete deployment instructions, see the [Deployment Guide](./docs/DEPLOYMENT_GUIDE.md).

## Project Structure

```
├── client/          # React frontend
├── server/          # Node.js backend
├── shared/          # Shared utilities
├── docs/           # Documentation
└── .kiro/          # AI assistant configuration
```

## Contributing

1. Follow the established coding standards
2. Write tests for new features
3. Update documentation as needed
4. Follow mobile-first design principles

## License

Private - D4 Media Internal Use
