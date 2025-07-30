# D4 Media Task Management System - Design Document

## Overview

The D4 Media Task Management System is designed as a modern, mobile-first web application using React frontend, Node.js/Express backend, and MongoDB database. The system follows a role-based architecture with real-time updates, comprehensive task management, and integrated billing functionality.

## Architecture

### System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │    │  Node.js API    │    │   MongoDB       │
│   (Frontend)    │◄──►│   (Backend)     │◄──►│   (Database)    │
│                 │    │                 │    │                 │
│ - Components    │    │ - Express       │    │ - Collections   │
│ - State Mgmt    │    │ - Middleware    │    │ - Indexes       │
│ - Routing       │    │ - Controllers   │    │ - Aggregation   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack
- **Frontend**: React 18+ with Vite, Tailwind CSS, React Query
- **Backend**: Node.js with Express.js, JWT authentication
- **Database**: MongoDB with Mongoose ODM
- **File Storage**: Local file system with Multer
- **PDF Generation**: PDFKit for invoices and reports
- **Email**: Nodemailer for notifications

## Components and Interfaces

### Frontend Component Architecture

#### Layout Components
```
App
├── AuthLayout (Login/Register)
├── DashboardLayout
│   ├── Header (Navigation, User Menu)
│   ├── Sidebar (Department Navigation)
│   └── MainContent
│       ├── Dashboard
│       ├── TaskManagement
│       ├── StudioBooking
│       ├── Reports
│       └── Settings
```

#### Core Components
- **TaskCard**: Display task information with status indicators
- **TaskForm**: Create/edit tasks with department-specific fields
- **BookingCalendar**: Studio availability and booking interface
- **UserManagement**: Role assignment and permission control
- **ReportGenerator**: Dynamic report creation and export
- **InvoiceGenerator**: PDF invoice creation with task breakdown
- **NotificationCenter**: Real-time notification display
- **FileUploader**: Drag-and-drop file upload with progress

#### Mobile-First Design Patterns
- **Bottom Navigation**: Primary navigation for mobile devices
- **Swipe Gestures**: Task status updates and quick actions
- **Pull-to-Refresh**: Data synchronization on mobile
- **Responsive Cards**: Adaptive layout for different screen sizes
- **Touch-Friendly Controls**: Minimum 44px touch targets

### Backend API Architecture

#### RESTful API Endpoints
```
/api/v1/
├── auth/
│   ├── POST /login
│   ├── POST /register
│   ├── POST /refresh
│   └── POST /logout
├── users/
│   ├── GET /profile
│   ├── PUT /profile
│   └── GET /department/:id/users
├── departments/
│   ├── GET /
│   ├── POST /
│   ├── PUT /:id
│   └── DELETE /:id
├── tasks/
│   ├── GET /
│   ├── POST /
│   ├── PUT /:id
│   ├── DELETE /:id
│   └── POST /:id/progress
├── studio/
│   ├── GET /bookings
│   ├── POST /bookings
│   ├── PUT /bookings/:id
│   └── GET /availability
├── invoices/
│   ├── GET /
│   ├── POST /
│   └── GET /:id/pdf
└── reports/
    ├── GET /daily
    ├── GET /weekly
    └── GET /monthly
```

#### Middleware Stack
1. **Security**: Helmet, CORS, Rate Limiting
2. **Authentication**: JWT verification
3. **Authorization**: Role-based access control
4. **Validation**: Request data validation with Joi
5. **Logging**: Request/response logging with Morgan
6. **Error Handling**: Centralized error processing

## Data Models

### User Model
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  role: Enum['super_admin', 'department_admin', 'department_staff', 'reception', 'client'],
  department: ObjectId (ref: Department),
  phone: String,
  avatar: String,
  isActive: Boolean,
  company: String, // for clients
  notifications: {
    email: Boolean,
    taskUpdates: Boolean,
    deadlineReminders: Boolean
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Department Model
```javascript
{
  _id: ObjectId,
  name: String (unique),
  code: String (unique),
  description: String,
  admin: ObjectId (ref: User),
  isActive: Boolean,
  settings: {
    defaultTaskPriority: Enum['low', 'medium', 'high'],
    autoAssignment: Boolean,
    requireApproval: Boolean
  },
  taskTypes: [{
    name: String,
    estimatedHours: Number,
    billingRate: Number
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### Task Model
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  department: ObjectId (ref: Department),
  assignedTo: ObjectId (ref: User),
  createdBy: ObjectId (ref: User),
  client: ObjectId (ref: User),
  priority: Enum['low', 'medium', 'high', 'urgent'],
  status: Enum['pending', 'in_progress', 'review', 'completed', 'cancelled'],
  taskType: String,
  estimatedHours: Number,
  actualHours: Number,
  dueDate: Date,
  startDate: Date,
  completedDate: Date,
  attachments: [{
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    mimetype: String,
    uploadedBy: ObjectId (ref: User),
    uploadedAt: Date
  }],
  progress: {
    percentage: Number (0-100),
    notes: [{
      note: String,
      addedBy: ObjectId (ref: User),
      addedAt: Date
    }]
  },
  billing: {
    rate: Number,
    billable: Boolean,
    invoiced: Boolean,
    invoiceId: ObjectId (ref: Invoice)
  },
  departmentSpecific: Mixed, // flexible field for department-specific data
  tags: [String],
  createdAt: Date,
  updatedAt: Date
}
```

### Studio Booking Model
```javascript
{
  _id: ObjectId,
  client: ObjectId (ref: User),
  contactPerson: {
    name: String,
    phone: String,
    email: String
  },
  bookingDate: Date,
  timeSlot: {
    startTime: String,
    endTime: String
  },
  duration: Number, // hours
  purpose: String,
  requirements: String,
  teamSize: Number,
  equipment: [{
    name: String,
    quantity: Number,
    rate: Number
  }],
  status: Enum['inquiry', 'confirmed', 'in_progress', 'completed', 'cancelled'],
  pricing: {
    baseRate: Number,
    equipmentCost: Number,
    additionalCharges: [{
      description: String,
      amount: Number
    }],
    discount: Number,
    totalAmount: Number
  },
  paymentStatus: Enum['pending', 'partial', 'paid', 'refunded'],
  invoice: ObjectId (ref: Invoice),
  createdBy: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

### Invoice Model
```javascript
{
  _id: ObjectId,
  invoiceNumber: String (unique),
  client: ObjectId (ref: User),
  type: Enum['task_based', 'studio_booking', 'periodic'],
  items: [{
    type: Enum['task', 'booking', 'additional'],
    reference: ObjectId, // Task or Booking ID
    description: String,
    quantity: Number,
    rate: Number,
    amount: Number
  }],
  subtotal: Number,
  discount: Number,
  tax: Number,
  total: Number,
  status: Enum['draft', 'sent', 'paid', 'overdue', 'cancelled'],
  dueDate: Date,
  paidDate: Date,
  notes: String,
  createdBy: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

## Error Handling

### Frontend Error Handling
- **API Errors**: Centralized error handling with React Query
- **Form Validation**: Real-time validation with error messages
- **Network Errors**: Offline detection and retry mechanisms
- **User Feedback**: Toast notifications for success/error states

### Backend Error Handling
```javascript
// Centralized error handler
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new ErrorResponse(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new ErrorResponse(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = new ErrorResponse(message, 400);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error'
  });
};
```

## Testing Strategy

### Frontend Testing
- **Unit Tests**: Component testing with React Testing Library
- **Integration Tests**: API integration and user flow testing
- **E2E Tests**: Critical user journeys with Cypress
- **Visual Tests**: Component visual regression testing

### Backend Testing
- **Unit Tests**: Controller and service function testing with Jest
- **Integration Tests**: API endpoint testing with Supertest
- **Database Tests**: Model validation and query testing
- **Security Tests**: Authentication and authorization testing

### Test Coverage Goals
- **Frontend**: 80% code coverage for components and utilities
- **Backend**: 90% code coverage for controllers and services
- **API**: 100% endpoint coverage with success and error scenarios

## Performance Optimization

### Frontend Optimization
- **Code Splitting**: Route-based lazy loading
- **Image Optimization**: WebP format with fallbacks
- **Caching**: React Query for API response caching
- **Bundle Optimization**: Tree shaking and minification

### Backend Optimization
- **Database Indexing**: Optimized queries with proper indexes
- **Caching**: Redis for session and frequently accessed data
- **Compression**: Gzip compression for API responses
- **Rate Limiting**: Prevent API abuse and ensure fair usage

### Database Optimization
```javascript
// Indexes for performance
db.tasks.createIndex({ department: 1, status: 1 });
db.tasks.createIndex({ assignedTo: 1, dueDate: 1 });
db.tasks.createIndex({ client: 1, createdAt: -1 });
db.users.createIndex({ email: 1 });
db.studioBookings.createIndex({ bookingDate: 1, "timeSlot.startTime": 1 });
```

## Security Implementation

### Authentication & Authorization
- **JWT Tokens**: Access tokens (15min) + Refresh tokens (7 days)
- **Password Security**: bcrypt with salt rounds of 12
- **Role-Based Access**: Middleware for route protection
- **Session Management**: Secure token storage and rotation

### Data Protection
- **Input Validation**: Joi schemas for all API inputs
- **SQL Injection Prevention**: Mongoose ODM protection
- **XSS Prevention**: Input sanitization and CSP headers
- **File Upload Security**: Type validation and virus scanning

### API Security
```javascript
// Security middleware stack
app.use(helmet()); // Security headers
app.use(cors(corsOptions)); // CORS configuration
app.use(rateLimit(rateLimitOptions)); // Rate limiting
app.use(mongoSanitize()); // NoSQL injection prevention
app.use(xss()); // XSS protection
```

## Deployment Architecture

### Production Environment
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │    │   Web Servers   │    │   Database      │
│   (Nginx)       │◄──►│   (Node.js)     │◄──►│   (MongoDB)     │
│                 │    │                 │    │                 │
│ - SSL/TLS       │    │ - PM2 Cluster   │    │ - Replica Set   │
│ - Static Files  │    │ - Health Checks │    │ - Backups       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Monitoring & Logging
- **Application Monitoring**: PM2 for process management
- **Error Tracking**: Centralized error logging
- **Performance Monitoring**: Response time and resource usage
- **Health Checks**: Automated system health verification