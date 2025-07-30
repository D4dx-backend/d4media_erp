const ActivityLog = require('../models/ActivityLog');
const AuditTrail = require('../models/AuditTrail');

// Middleware to log user activities
const logActivity = (action, resource) => {
  return async (req, res, next) => {
    const startTime = Date.now();
    
    // Store original res.json to capture response
    const originalJson = res.json;
    let responseData = null;
    let success = true;
    let errorMessage = null;

    res.json = function(data) {
      responseData = data;
      success = data.success !== false;
      if (!success) {
        errorMessage = data.message || data.error;
      }
      return originalJson.call(this, data);
    };

    // Continue with the request
    res.on('finish', async () => {
      try {
        const duration = Date.now() - startTime;
        
        // Get client IP
        const ipAddress = req.ip || 
          req.connection.remoteAddress || 
          req.socket.remoteAddress ||
          (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
          req.headers['x-forwarded-for']?.split(',')[0] ||
          'unknown';

        // Get user agent
        const userAgent = req.headers['user-agent'] || 'unknown';

        // Get session ID if available
        const sessionId = req.sessionID || req.headers['x-session-id'];

        // Determine resource ID
        let resourceId = null;
        if (req.params.id) {
          resourceId = req.params.id;
        } else if (responseData?.data?._id) {
          resourceId = responseData.data._id;
        } else if (responseData?.data?.id) {
          resourceId = responseData.data.id;
        }

        // Create activity log entry
        const activityData = {
          user: req.user?._id || req.user?.id,
          action,
          resource,
          resourceId,
          details: {
            description: generateActivityDescription(action, resource, req, responseData),
            metadata: {
              method: req.method,
              url: req.originalUrl,
              query: req.query,
              params: req.params,
              responseStatus: res.statusCode
            }
          },
          ipAddress,
          userAgent,
          sessionId,
          success,
          errorMessage,
          duration,
          timestamp: new Date()
        };

        // Only log if user is authenticated (except for login/register)
        if (req.user || ['login', 'register'].includes(action)) {
          await ActivityLog.create(activityData);
        }

      } catch (error) {
        console.error('Error logging activity:', error);
        // Don't fail the request if logging fails
      }
    });

    next();
  };
};

// Middleware to log audit trail for invoices and quotations
const logAuditTrail = (documentType) => {
  return async (req, res, next) => {
    // Store original res.json to capture response
    const originalJson = res.json;
    let responseData = null;
    let success = true;

    res.json = function(data) {
      responseData = data;
      success = data.success !== false;
      return originalJson.call(this, data);
    };

    res.on('finish', async () => {
      try {
        if (!success || !req.user || !responseData?.data) {
          return;
        }

        const document = responseData.data;
        const action = determineAuditAction(req.method, req.route?.path, req.body);
        
        if (!action) return;

        // Get document number
        const documentNumber = document.invoiceNumber || document.quotationNumber;
        if (!documentNumber) return;

        // Determine changes for update operations
        let changes = [];
        if (action === 'updated' && req.body) {
          changes = generateChangeLog(req.body, req.originalDocument);
        }

        // Create audit trail entry
        const auditData = {
          documentType,
          documentId: document._id || document.id,
          documentNumber,
          action,
          performedBy: req.user._id || req.user.id,
          changes,
          metadata: {
            ipAddress: req.ip || req.headers['x-forwarded-for']?.split(',')[0] || 'unknown',
            userAgent: req.headers['user-agent'] || 'unknown',
            sessionId: req.sessionID || req.headers['x-session-id'],
            clientInfo: {
              name: document.clientDetails?.name || document.client?.name,
              email: document.clientDetails?.email || document.client?.email,
              phone: document.clientDetails?.phone || document.client?.phone
            },
            totalAmount: document.total,
            status: document.status,
            reason: req.body.reason || req.body.notes,
            additionalInfo: {
              method: req.method,
              url: req.originalUrl,
              userRole: req.user.role
            }
          },
          timestamp: new Date()
        };

        await AuditTrail.create(auditData);

      } catch (error) {
        console.error('Error logging audit trail:', error);
        // Don't fail the request if logging fails
      }
    });

    next();
  };
};

// Helper function to generate activity description
function generateActivityDescription(action, resource, req, responseData) {
  const resourceName = resource.replace('_', ' ');
  const actionName = action.replace('_', ' ');
  
  switch (action) {
    case 'login':
      return `User logged in successfully`;
    case 'logout':
      return `User logged out`;
    case 'register':
      return `New user registered`;
    case 'invoice_create':
      return `Created invoice ${responseData?.data?.invoiceNumber || ''}`;
    case 'invoice_update':
      return `Updated invoice ${responseData?.data?.invoiceNumber || ''}`;
    case 'invoice_delete':
      return `Deleted invoice`;
    case 'invoice_status_change':
      return `Changed invoice status to ${responseData?.data?.status || ''}`;
    case 'invoice_send':
      return `Sent invoice ${responseData?.data?.invoiceNumber || ''} to customer`;
    case 'quotation_create':
      return `Created quotation ${responseData?.data?.quotationNumber || ''}`;
    case 'quotation_update':
      return `Updated quotation ${responseData?.data?.quotationNumber || ''}`;
    case 'quotation_convert_to_invoice':
      return `Converted quotation to invoice`;
    default:
      return `Performed ${actionName} on ${resourceName}`;
  }
}

// Helper function to determine audit action
function determineAuditAction(method, path, body) {
  if (method === 'POST') {
    if (path?.includes('/convert-to-invoice')) return 'converted';
    if (path?.includes('/send')) return 'sent';
    return 'created';
  }
  if (method === 'PUT' || method === 'PATCH') {
    if (path?.includes('/status')) return 'status_changed';
    return 'updated';
  }
  if (method === 'DELETE') return 'deleted';
  if (method === 'GET' && path?.includes('/pdf')) return 'pdf_generated';
  if (method === 'GET' && path?.includes('/print')) return 'printed';
  
  return null;
}

// Helper function to generate change log
function generateChangeLog(newData, oldData) {
  if (!oldData) return [];
  
  const changes = [];
  const fieldsToTrack = [
    'status', 'total', 'subtotal', 'tax', 'discount', 'dueDate',
    'clientDetails', 'items', 'notes', 'terms', 'validUntil'
  ];

  fieldsToTrack.forEach(field => {
    if (newData[field] !== undefined && newData[field] !== oldData[field]) {
      changes.push({
        field,
        oldValue: oldData[field],
        newValue: newData[field],
        changeType: oldData[field] === undefined ? 'added' : 'modified'
      });
    }
  });

  return changes;
}

// Middleware to capture original document for updates
const captureOriginalDocument = (Model) => {
  return async (req, res, next) => {
    if (req.params.id && (req.method === 'PUT' || req.method === 'PATCH')) {
      try {
        req.originalDocument = await Model.findById(req.params.id);
      } catch (error) {
        console.error('Error capturing original document:', error);
      }
    }
    next();
  };
};

module.exports = {
  logActivity,
  logAuditTrail,
  captureOriginalDocument
};