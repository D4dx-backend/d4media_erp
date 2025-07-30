# Activity Tracking & Audit Trail System

This document describes the comprehensive activity tracking and audit trail system implemented for the D4 Media Task Management System.

## Overview

The system provides two levels of tracking:
1. **Activity Logs** - General user activities and system events
2. **Audit Trails** - Detailed document-specific change tracking for invoices and quotations

## Features

### 🔍 Activity Logging
- **Login/Logout tracking** - Monitor user authentication events
- **Action tracking** - Track all CRUD operations across the system
- **Performance monitoring** - Record response times and success/failure rates
- **IP and session tracking** - Security monitoring capabilities
- **Automatic cleanup** - Old logs are automatically deleted after 1 year

### 📋 Audit Trails
- **Document-specific tracking** - Detailed change logs for invoices and quotations
- **Change detection** - Track field-level changes with old/new values
- **User attribution** - Know exactly who made what changes
- **Compliance ready** - 7-year retention for legal requirements
- **Metadata capture** - Additional context like IP, user agent, amounts, etc.

### 🎯 User Interface
- **Personal Activity History** - Users can view their own activities
- **System Activities Dashboard** - Admins can monitor all system activities
- **Document Audit Trails** - View complete change history for invoices/quotations
- **Advanced Filtering** - Filter by date, action, resource, user, etc.
- **Real-time Updates** - Activities are logged in real-time

## Technical Implementation

### Backend Components

#### Models
- `ActivityLog.js` - General activity tracking model
- `AuditTrail.js` - Document-specific audit trail model

#### Middleware
- `activityLogger.js` - Automatic activity logging middleware
- Applied to all protected routes for comprehensive tracking

#### Controllers
- `activityController.js` - API endpoints for activity data
- Handles filtering, pagination, and statistics

#### Routes
- `activityRoutes.js` - RESTful API endpoints
- Role-based access control for sensitive data

### Frontend Components

#### Pages
- `ActivityHistory.jsx` - Personal activity history page
- `SystemActivities.jsx` - System-wide activity monitoring (Admin only)

#### Components
- `AuditTrail.jsx` - Reusable audit trail component
- `QuotationDetailModal.jsx` - Enhanced quotation details with audit trail

### Database Schema

#### Activity Log Schema
```javascript
{
  user: ObjectId,           // User who performed the action
  action: String,           // Action performed (login, invoice_create, etc.)
  resource: String,         // Resource affected (user, invoice, quotation, etc.)
  resourceId: ObjectId,     // ID of the affected resource
  details: {
    description: String,    // Human-readable description
    oldValues: Mixed,       // Previous values (for updates)
    newValues: Mixed,       // New values (for updates)
    metadata: Mixed         // Additional context
  },
  ipAddress: String,        // Client IP address
  userAgent: String,        // Client user agent
  sessionId: String,        // Session identifier
  success: Boolean,         // Whether the action succeeded
  errorMessage: String,     // Error message if failed
  duration: Number,         // Response time in milliseconds
  timestamp: Date           // When the action occurred
}
```

#### Audit Trail Schema
```javascript
{
  documentType: String,     // 'invoice' or 'quotation'
  documentId: ObjectId,     // Document ID
  documentNumber: String,   // Document number (INV-001, QUO-001)
  action: String,           // Action performed
  performedBy: ObjectId,    // User who performed the action
  changes: [{
    field: String,          // Field that changed
    oldValue: Mixed,        // Previous value
    newValue: Mixed,        // New value
    changeType: String      // 'added', 'modified', 'removed'
  }],
  metadata: {
    ipAddress: String,
    userAgent: String,
    clientInfo: Object,     // Client details
    totalAmount: Number,    // Document amount
    status: String,         // Document status
    reason: String,         // Reason for change
    additionalInfo: Mixed
  },
  timestamp: Date
}
```

## API Endpoints

### Activity Logs
- `GET /api/v1/activities/user/:userId?` - Get user activities
- `GET /api/v1/activities/system` - Get system activities (Admin only)
- `GET /api/v1/activities/stats` - Get activity statistics
- `GET /api/v1/activities/login-history` - Get login history (Admin only)

### Audit Trails
- `GET /api/v1/activities/audit/:documentType/:documentId` - Get document audit trail
- `GET /api/v1/activities/audit/user/:userId?` - Get user audit activities
- `GET /api/v1/activities/audit/stats` - Get audit statistics

## Usage Examples

### Viewing Personal Activity History
1. Navigate to "Activity History" in the sidebar
2. Use filters to narrow down results by date, action, or resource
3. View detailed information about each activity

### Monitoring System Activities (Admin)
1. Navigate to "System Activities" in the sidebar (Super Admin only)
2. View all user activities across the system
3. Access statistics and trends
4. Monitor login history and security events

### Viewing Document Audit Trail
1. Open any invoice or quotation detail page
2. The audit trail is automatically displayed
3. See complete change history with user attribution
4. View metadata like IP addresses and timestamps

### Quotation Audit Trail
1. In Quotation Management, click the "👁️" (eye) icon
2. Switch to the "Audit Trail" tab in the modal
3. View complete change history for the quotation

## Security Features

### Access Control
- Users can only view their own activities (unless admin)
- Super admins can view all system activities
- Department admins can view department-specific activities
- Audit trails are visible to authorized users only

### Data Protection
- Sensitive data is not logged in activity details
- IP addresses and user agents are captured for security
- Session tracking helps identify suspicious activities
- Automatic data retention policies

### Compliance
- 7-year retention for audit trails (legal requirement)
- 1-year retention for general activity logs
- Immutable audit records
- Complete change tracking for financial documents

## Performance Considerations

### Database Optimization
- Proper indexing on frequently queried fields
- TTL indexes for automatic data cleanup
- Aggregation pipelines for statistics
- Pagination for large result sets

### Middleware Efficiency
- Asynchronous logging to avoid blocking requests
- Error handling to prevent logging failures from affecting operations
- Minimal performance impact on API responses

## Monitoring & Maintenance

### Health Checks
- Monitor activity log creation rates
- Check for failed logging attempts
- Verify automatic cleanup processes
- Monitor database performance

### Regular Tasks
- Review activity patterns for security issues
- Archive old data if needed
- Update retention policies as required
- Monitor storage usage

## Testing

Run the activity logging test:
```bash
cd server
node test-activity-logging.js
```

This will:
- Test activity log creation
- Test audit trail creation
- Verify database queries
- Clean up test data

## Future Enhancements

### Planned Features
- Real-time activity notifications
- Advanced analytics and reporting
- Export capabilities for compliance
- Integration with external monitoring tools
- Machine learning for anomaly detection

### Potential Improvements
- GraphQL API for complex queries
- Elasticsearch integration for advanced search
- Data visualization dashboards
- Mobile app support
- API rate limiting based on activity patterns

## Troubleshooting

### Common Issues
1. **Activities not being logged**: Check middleware configuration
2. **Performance issues**: Review database indexes
3. **Storage concerns**: Verify TTL index configuration
4. **Access denied errors**: Check user roles and permissions

### Debug Mode
Enable debug logging by setting `NODE_ENV=development` to see detailed activity logging information.

## Support

For questions or issues related to the activity tracking system, please:
1. Check this documentation first
2. Review the test file for examples
3. Check the server logs for errors
4. Contact the development team

---

**Last Updated**: January 2025
**Version**: 1.0.0
**Maintainer**: D4 Media Development Team