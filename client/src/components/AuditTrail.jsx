import React, { useState, useEffect } from 'react';
import { activityService } from '../services/activityService';
import { 
  DocumentTextIcon, 
  UserIcon, 
  ClockIcon,
  EyeIcon,
  PencilIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const AuditTrail = ({ documentType, documentId, documentNumber }) => {
  const [auditTrail, setAuditTrail] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (documentType && documentId) {
      fetchAuditTrail();
    }
  }, [documentType, documentId]);

  const fetchAuditTrail = async () => {
    try {
      setLoading(true);
      const response = await activityService.getDocumentAuditTrail(documentType, documentId);
      setAuditTrail(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch audit trail');
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'created':
        return <PencilIcon className="h-4 w-4 text-green-500" />;
      case 'updated':
        return <PencilIcon className="h-4 w-4 text-blue-500" />;
      case 'status_changed':
        return <CheckCircleIcon className="h-4 w-4 text-yellow-500" />;
      case 'sent':
        return <DocumentTextIcon className="h-4 w-4 text-purple-500" />;
      case 'printed':
        return <DocumentTextIcon className="h-4 w-4 text-gray-500" />;
      case 'pdf_generated':
        return <DocumentTextIcon className="h-4 w-4 text-red-500" />;
      case 'converted':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'deleted':
        return <XCircleIcon className="h-4 w-4 text-red-500" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'created':
        return 'text-green-600 bg-green-50';
      case 'updated':
        return 'text-blue-600 bg-blue-50';
      case 'status_changed':
        return 'text-yellow-600 bg-yellow-50';
      case 'sent':
        return 'text-purple-600 bg-purple-50';
      case 'printed':
        return 'text-gray-600 bg-gray-50';
      case 'pdf_generated':
        return 'text-red-600 bg-red-50';
      case 'converted':
        return 'text-green-600 bg-green-50';
      case 'deleted':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatAction = (action) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const renderChanges = (changes) => {
    if (!changes || changes.length === 0) return null;

    return (
      <div className="mt-2 space-y-1">
        {changes.map((change, index) => (
          <div key={index} className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
            <span className="font-medium">{change.field}:</span>
            {change.changeType === 'added' ? (
              <span className="text-green-600 ml-1">Added "{change.newValue}"</span>
            ) : change.changeType === 'removed' ? (
              <span className="text-red-600 ml-1">Removed "{change.oldValue}"</span>
            ) : (
              <span className="ml-1">
                Changed from "<span className="text-red-600">{change.oldValue}</span>" to "
                <span className="text-green-600">{change.newValue}</span>"
              </span>
            )}
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex space-x-3">
                <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <XCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <DocumentTextIcon className="h-6 w-6 mr-2 text-blue-600" />
          Audit Trail
          {documentNumber && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              for {documentType} #{documentNumber}
            </span>
          )}
        </h3>
      </div>

      <div className="p-6">
        {auditTrail.length === 0 ? (
          <div className="text-center py-8">
            <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No audit trail available</p>
          </div>
        ) : (
          <div className="flow-root">
            <ul className="-mb-8">
              {auditTrail.map((entry, index) => (
                <li key={entry._id}>
                  <div className="relative pb-8">
                    {index !== auditTrail.length - 1 && (
                      <span
                        className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                        aria-hidden="true"
                      />
                    )}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${getActionColor(entry.action)}`}>
                          {getActionIcon(entry.action)}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">
                            <span className="font-medium">{entry.performedBy?.name}</span>
                            <span className="ml-1">{formatAction(entry.action)}</span>
                            {entry.metadata?.reason && (
                              <span className="text-gray-600 ml-1">- {entry.metadata.reason}</span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {entry.performedBy?.email} • {entry.performedBy?.role?.replace(/_/g, ' ')}
                          </p>
                          
                          {/* Show changes if any */}
                          {renderChanges(entry.changes)}
                          
                          {/* Show metadata */}
                          {entry.metadata && (
                            <div className="mt-2 text-xs text-gray-500">
                              {entry.metadata.totalAmount && (
                                <span className="mr-4">Amount: ₹{entry.metadata.totalAmount.toLocaleString()}</span>
                              )}
                              {entry.metadata.status && (
                                <span className="mr-4">Status: {entry.metadata.status}</span>
                              )}
                              {entry.metadata.ipAddress && (
                                <span>IP: {entry.metadata.ipAddress}</span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          <time dateTime={entry.timestamp}>
                            {new Date(entry.timestamp).toLocaleString()}
                          </time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditTrail;