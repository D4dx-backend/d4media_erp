import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getTaskById, deleteTask } from '../../services/taskService';
import TaskForm from '../../components/tasks/TaskForm';
import TaskProgress from '../../components/tasks/TaskProgress';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchTask();
  }, [id]);

  const fetchTask = async () => {
    try {
      setLoading(true);
      const response = await getTaskById(id);
      setTask(response.data);
    } catch (error) {
      console.error('Error fetching task:', error);
      setError(error.response?.data?.error || 'Failed to load task details');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskUpdate = (updatedTask) => {
    setTask(updatedTask);
    setIsEditing(false);
  };

  const handleProgressUpdate = (updatedData) => {
    setTask(prev => ({
      ...prev,
      ...updatedData
    }));
  };

  const handleDeleteTask = async () => {
    try {
      setLoading(true);
      await deleteTask(id);
      navigate('/tasks', { state: { message: 'Task deleted successfully' } });
    } catch (error) {
      console.error('Error deleting task:', error);
      setError(error.response?.data?.error || 'Failed to delete task');
      setLoading(false);
    }
  };

  // Format date to readable string
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Helper function to determine status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-200 text-gray-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'review':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  // Helper function to determine priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'urgent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && !task) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-md">
        <h2 className="text-lg font-medium mb-2">Error</h2>
        <p>{error}</p>
        <Link to="/tasks" className="text-red-700 hover:text-red-900 underline mt-2 inline-block">
          Back to Tasks
        </Link>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="bg-yellow-50 text-yellow-700 p-4 rounded-md">
        <h2 className="text-lg font-medium mb-2">Task Not Found</h2>
        <p>The requested task could not be found.</p>
        <Link to="/tasks" className="text-yellow-700 hover:text-yellow-900 underline mt-2 inline-block">
          Back to Tasks
        </Link>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div>
        <div className="mb-4">
          <Link to="/tasks" className="text-blue-600 hover:text-blue-800">
            &larr; Back to Tasks
          </Link>
        </div>
        <TaskForm 
          task={task} 
          onSuccess={handleTaskUpdate} 
          onCancel={() => setIsEditing(false)} 
        />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <Link to="/tasks" className="text-blue-600 hover:text-blue-800">
          &larr; Back to Tasks
        </Link>
      </div>

      {/* Task Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
          <div className="flex space-x-2">
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Edit
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Delete
            </button>
          </div>
        </div>

        {/* Status and Priority */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(task.status)}`}>
            {task.status.replace('_', ' ')}
          </span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </span>
          {task.isUrgent && (
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
              Urgent
            </span>
          )}
        </div>

        {/* Description */}
        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-2">Description</h2>
          <p className="text-gray-700 whitespace-pre-line">{task.description}</p>
        </div>

        {/* Task Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Department</h3>
            <p className="text-gray-900">{task.department?.name || 'Unassigned'}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Task Type</h3>
            <p className="text-gray-900">{task.taskType}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Assigned To</h3>
            <p className="text-gray-900">{task.assignedTo?.name || 'Unassigned'}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Created By</h3>
            <p className="text-gray-900">{task.createdBy?.name || 'Unknown'}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Client</h3>
            <p className="text-gray-900">
              {task.client?.name ? `${task.client.name} ${task.client.company ? `(${task.client.company})` : ''}` : 'None'}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Due Date</h3>
            <p className={`${task.isOverdue ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
              {formatDate(task.dueDate)}
              {task.isOverdue && ' (Overdue)'}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Created</h3>
            <p className="text-gray-900">{formatDate(task.createdAt)}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
            <p className="text-gray-900">{formatDate(task.updatedAt)}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Estimated Hours</h3>
            <p className="text-gray-900">{task.estimatedHours}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Actual Hours</h3>
            <p className="text-gray-900">{task.actualHours || 0}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Billing</h3>
            <p className="text-gray-900">
              {task.billing?.billable ? `$${task.billing.rate}/hr` : 'Non-billable'}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Tags</h3>
            <div className="flex flex-wrap gap-1 mt-1">
              {task.tags && task.tags.length > 0 ? (
                task.tags.map((tag, index) => (
                  <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-gray-500">No tags</span>
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-600">Progress</span>
            <span className="text-sm font-medium text-gray-900">{task.progress?.percentage || 0}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${task.progress?.percentage || 0}%` }}
            ></div>
          </div>
        </div>
        
        {/* Department-Specific Fields */}
        {task.departmentSpecific && Object.keys(task.departmentSpecific).length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              {task.department?.name} Specific Details
            </h2>
            
            {/* Graphic Design Fields */}
            {task.department?.code === 'DESIGN' && (
              <div className="space-y-4">
                {/* Design Brief */}
                {task.departmentSpecific.designBrief && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Design Brief</h3>
                    <p className="text-gray-700 whitespace-pre-line mt-1">{task.departmentSpecific.designBrief}</p>
                  </div>
                )}
                
                {/* Format Specifications */}
                {task.departmentSpecific.formatSpecifications && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Format Specifications</h3>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      {task.departmentSpecific.formatSpecifications.width && (
                        <div>
                          <span className="text-xs text-gray-500">Width:</span>
                          <p className="text-gray-900">{task.departmentSpecific.formatSpecifications.width}px</p>
                        </div>
                      )}
                      {task.departmentSpecific.formatSpecifications.height && (
                        <div>
                          <span className="text-xs text-gray-500">Height:</span>
                          <p className="text-gray-900">{task.departmentSpecific.formatSpecifications.height}px</p>
                        </div>
                      )}
                      {task.departmentSpecific.formatSpecifications.colorMode && (
                        <div>
                          <span className="text-xs text-gray-500">Color Mode:</span>
                          <p className="text-gray-900">{task.departmentSpecific.formatSpecifications.colorMode.toUpperCase()}</p>
                        </div>
                      )}
                      {task.departmentSpecific.formatSpecifications.fileFormat && (
                        <div>
                          <span className="text-xs text-gray-500">File Format:</span>
                          <p className="text-gray-900">{task.departmentSpecific.formatSpecifications.fileFormat.toUpperCase()}</p>
                        </div>
                      )}
                      {task.departmentSpecific.formatSpecifications.resolution && (
                        <div>
                          <span className="text-xs text-gray-500">Resolution:</span>
                          <p className="text-gray-900">{task.departmentSpecific.formatSpecifications.resolution} DPI</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Client Approval */}
                {task.departmentSpecific.clientApproval && task.departmentSpecific.clientApproval.required && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Client Approval</h3>
                    <div className="mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        task.departmentSpecific.clientApproval.status === 'approved' ? 'bg-green-100 text-green-800' :
                        task.departmentSpecific.clientApproval.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        task.departmentSpecific.clientApproval.status === 'revision_requested' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {task.departmentSpecific.clientApproval.status.replace('_', ' ')}
                      </span>
                      
                      {(task.departmentSpecific.clientApproval.status === 'rejected' || 
                        task.departmentSpecific.clientApproval.status === 'revision_requested') && 
                        task.departmentSpecific.clientApproval.feedback && (
                        <div className="mt-2">
                          <span className="text-xs text-gray-500">Feedback:</span>
                          <p className="text-gray-700 whitespace-pre-line">{task.departmentSpecific.clientApproval.feedback}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Video Editing Fields */}
            {task.department?.code === 'VIDEO' && (
              <div className="space-y-4">
                {/* Technical Requirements */}
                {task.departmentSpecific.technicalRequirements && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Technical Requirements</h3>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      {task.departmentSpecific.technicalRequirements.resolution && (
                        <div>
                          <span className="text-xs text-gray-500">Resolution:</span>
                          <p className="text-gray-900">{task.departmentSpecific.technicalRequirements.resolution}</p>
                        </div>
                      )}
                      {task.departmentSpecific.technicalRequirements.format && (
                        <div>
                          <span className="text-xs text-gray-500">Format:</span>
                          <p className="text-gray-900">{task.departmentSpecific.technicalRequirements.format.toUpperCase()}</p>
                        </div>
                      )}
                      {task.departmentSpecific.technicalRequirements.frameRate && (
                        <div>
                          <span className="text-xs text-gray-500">Frame Rate:</span>
                          <p className="text-gray-900">{task.departmentSpecific.technicalRequirements.frameRate} fps</p>
                        </div>
                      )}
                      {task.departmentSpecific.technicalRequirements.duration && (
                        <div>
                          <span className="text-xs text-gray-500">Duration:</span>
                          <p className="text-gray-900">{task.departmentSpecific.technicalRequirements.duration}</p>
                        </div>
                      )}
                      {task.departmentSpecific.technicalRequirements.aspectRatio && (
                        <div>
                          <span className="text-xs text-gray-500">Aspect Ratio:</span>
                          <p className="text-gray-900">{task.departmentSpecific.technicalRequirements.aspectRatio}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Rendering Progress */}
                {task.departmentSpecific.renderingProgress && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Rendering Progress</h3>
                    <div className="mt-1">
                      <div className="flex justify-between items-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          task.departmentSpecific.renderingProgress.status === 'completed' ? 'bg-green-100 text-green-800' :
                          task.departmentSpecific.renderingProgress.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          task.departmentSpecific.renderingProgress.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {task.departmentSpecific.renderingProgress.status.replace('_', ' ')}
                        </span>
                        <span className="text-sm font-medium">{task.departmentSpecific.renderingProgress.percentage}%</span>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                        <div 
                          className="bg-blue-600 h-1.5 rounded-full" 
                          style={{ width: `${task.departmentSpecific.renderingProgress.percentage}%` }}
                        ></div>
                      </div>
                      
                      {task.departmentSpecific.renderingProgress.notes && (
                        <p className="text-gray-700 text-sm mt-2">{task.departmentSpecific.renderingProgress.notes}</p>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Deliverables */}
                {task.departmentSpecific.deliverables && task.departmentSpecific.deliverables.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Deliverable Formats</h3>
                    <div className="mt-1 space-y-2">
                      {task.departmentSpecific.deliverables.map((deliverable, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <div>
                            <span className="text-gray-900">{deliverable.format.toUpperCase()} • {deliverable.resolution}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            deliverable.completed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {deliverable.completed ? 'Completed' : 'Pending'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Events Fields */}
            {task.department?.code === 'EVENTS' && (
              <div className="space-y-4">
                {/* Event Type */}
                {task.departmentSpecific.eventType && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Event Type</h3>
                    <p className="text-gray-900 mt-1">
                      {task.departmentSpecific.eventType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                  </div>
                )}
                
                {/* Production Phase */}
                {task.departmentSpecific.productionPhase && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Production Phase</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium mt-1 inline-block ${
                      task.departmentSpecific.productionPhase === 'pre' ? 'bg-blue-100 text-blue-800' :
                      task.departmentSpecific.productionPhase === 'production' ? 'bg-yellow-100 text-yellow-800' :
                      task.departmentSpecific.productionPhase === 'post' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {task.departmentSpecific.productionPhase === 'pre' ? 'Pre-Production' :
                       task.departmentSpecific.productionPhase === 'production' ? 'Production' :
                       task.departmentSpecific.productionPhase === 'post' ? 'Post-Production' :
                       task.departmentSpecific.productionPhase}
                    </span>
                  </div>
                )}
                
                {/* Location */}
                {task.departmentSpecific.location && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Location Details</h3>
                    <div className="mt-1">
                      {task.departmentSpecific.location.name && (
                        <p className="text-gray-900 font-medium">{task.departmentSpecific.location.name}</p>
                      )}
                      
                      {task.departmentSpecific.location.address && (
                        <p className="text-gray-700 text-sm">{task.departmentSpecific.location.address}</p>
                      )}
                      
                      <div className="flex flex-wrap gap-2 mt-1">
                        {task.departmentSpecific.location.indoorOutdoor && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                            {task.departmentSpecific.location.indoorOutdoor.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        )}
                        
                        {task.departmentSpecific.location.capacity && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                            Capacity: {task.departmentSpecific.location.capacity}
                          </span>
                        )}
                      </div>
                      
                      {task.departmentSpecific.location.notes && (
                        <div className="mt-2">
                          <span className="text-xs text-gray-500">Notes:</span>
                          <p className="text-gray-700 text-sm">{task.departmentSpecific.location.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Equipment */}
                {task.departmentSpecific.equipment && task.departmentSpecific.equipment.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Equipment Needed</h3>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {task.departmentSpecific.equipment.map((item, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Vendors */}
                {task.departmentSpecific.vendors && task.departmentSpecific.vendors.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Vendors</h3>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {task.departmentSpecific.vendors.map((vendor, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {vendor}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Task Progress and Time Tracking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TaskProgress 
          taskId={task._id} 
          initialProgress={task.progress?.percentage || 0}
          onUpdate={handleProgressUpdate}
        />
        
        {/* Attachments Section */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Attachments</h3>
          
          {/* File Upload Form */}
          <div className="mb-4 p-4 border-2 border-dashed border-gray-300 rounded-md text-center">
            <p className="text-gray-600 mb-2">Drag and drop files here or click to upload</p>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
              Upload Files
            </button>
            <p className="text-xs text-gray-500 mt-2">Max file size: 10MB</p>
          </div>
          
          {/* Attachments List */}
          {task.attachments && task.attachments.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {task.attachments.map((attachment, index) => (
                <li key={index} className="py-3 flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{attachment.originalName}</p>
                      <p className="text-xs text-gray-500">
                        {(attachment.size / 1024).toFixed(2)} KB • Uploaded by {attachment.uploadedBy?.name || 'Unknown'}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button className="text-blue-600 hover:text-blue-800">
                      Download
                    </button>
                    <button className="text-red-600 hover:text-red-800">
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-center py-4">No attachments yet</p>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this task? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTask}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-red-300"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskDetail;