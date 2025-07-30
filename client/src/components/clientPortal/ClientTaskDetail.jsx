import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { getClientTaskDetails, addClientFeedback, getAttachmentDownloadUrl } from '../../services/clientPortalService';
import LoadingSpinner from '../common/LoadingSpinner';

const ClientTaskDetail = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    const fetchTaskDetails = async () => {
      try {
        setLoading(true);
        const response = await getClientTaskDetails(taskId);
        setTask(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to load task details. Please try again later.');
        console.error('Error fetching task details:', err);
      } finally {
        setLoading(false);
      }
    };

    if (taskId) {
      fetchTaskDetails();
    }
  }, [taskId]);

  const handleFeedbackSubmit = async (approved = false) => {
    if (!feedback.trim() && !approved) {
      alert('Please enter feedback before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      const response = await addClientFeedback(taskId, feedback, approved);
      setTask(response.data);
      setFeedback('');
      alert(approved ? 'Task approved successfully!' : 'Feedback submitted successfully!');
    } catch (err) {
      console.error('Error submitting feedback:', err);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-500">{error}</p>
        <button 
          className="mt-2 bg-red-100 text-red-700 px-4 py-2 rounded-md"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!task) {
    return null;
  }

  const isCompleted = task.status === 'completed';
  const isInReview = task.status === 'review';
  const canApprove = isInReview;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Link 
            to={`/client/projects/${task.department._id}`} 
            className="text-blue-600 hover:underline text-sm"
          >
            ← Back to Project
          </Link>
          <h1 className="text-2xl font-bold mt-2">{task.title}</h1>
        </div>
        <StatusBadge status={task.status} />
      </div>

      {/* Task Navigation */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'details'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('progress')}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'progress'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Progress & Notes
            </button>
            <button
              onClick={() => setActiveTab('files')}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'files'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Files
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'details' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium mb-2">Description</h2>
                <p className="text-gray-700 whitespace-pre-line">{task.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-lg font-medium mb-2">Task Details</h2>
                  <dl className="grid grid-cols-1 gap-2">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <dt className="text-gray-500">Department</dt>
                      <dd className="font-medium">{task.department.name}</dd>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <dt className="text-gray-500">Task Type</dt>
                      <dd className="font-medium">{task.taskType}</dd>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <dt className="text-gray-500">Priority</dt>
                      <dd className="font-medium capitalize">{task.priority}</dd>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <dt className="text-gray-500">Due Date</dt>
                      <dd className="font-medium">{new Date(task.dueDate).toLocaleDateString()}</dd>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <dt className="text-gray-500">Created By</dt>
                      <dd className="font-medium">{task.createdBy?.name || 'N/A'}</dd>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <dt className="text-gray-500">Assigned To</dt>
                      <dd className="font-medium">{task.assignedTo?.name || 'Unassigned'}</dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h2 className="text-lg font-medium mb-2">Progress</h2>
                  <div className="mb-4">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-500">Completion</span>
                      <span className="text-sm font-medium">{task.progress?.percentage || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${task.progress?.percentage || 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-500">Time</span>
                      <span className="text-sm font-medium">
                        {task.actualHours || 0} / {task.estimatedHours || 0} hours
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-green-600 h-2.5 rounded-full" 
                        style={{ 
                          width: `${task.estimatedHours ? Math.min(100, (task.actualHours / task.estimatedHours) * 100) : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>

                  {task.startDate && (
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <dt className="text-gray-500">Started</dt>
                      <dd className="font-medium">{new Date(task.startDate).toLocaleDateString()}</dd>
                    </div>
                  )}
                  
                  {task.completedDate && (
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <dt className="text-gray-500">Completed</dt>
                      <dd className="font-medium">{new Date(task.completedDate).toLocaleDateString()}</dd>
                    </div>
                  )}
                </div>
              </div>

              {/* Feedback Form */}
              {!isCompleted && (
                <div className="bg-gray-50 p-4 rounded-md mt-6">
                  <h2 className="text-lg font-medium mb-2">Provide Feedback</h2>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Enter your feedback or questions here..."
                    className="w-full border border-gray-300 rounded-md p-3 h-32"
                    disabled={submitting}
                  ></textarea>
                  <div className="flex justify-end mt-3 space-x-3">
                    <button
                      onClick={() => handleFeedbackSubmit(false)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                      disabled={submitting || !feedback.trim()}
                    >
                      {submitting ? 'Submitting...' : 'Submit Feedback'}
                    </button>
                    {canApprove && (
                      <button
                        onClick={() => handleFeedbackSubmit(true)}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                        disabled={submitting}
                      >
                        {submitting ? 'Approving...' : 'Approve Task'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'progress' && (
            <div>
              <h2 className="text-lg font-medium mb-4">Progress Notes</h2>
              
              {task.progress?.notes && task.progress.notes.length > 0 ? (
                <div className="space-y-4">
                  {task.progress.notes.map((note, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-md">
                      <div className="flex justify-between mb-2">
                        <span className="font-medium">{note.addedBy?.name || 'Unknown'}</span>
                        <span className="text-sm text-gray-500">
                          {new Date(note.addedAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-gray-700 whitespace-pre-line">{note.note}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No progress notes available.</p>
              )}
            </div>
          )}

          {activeTab === 'files' && (
            <div>
              <h2 className="text-lg font-medium mb-4">Files & Attachments</h2>
              
              {task.attachments && task.attachments.length > 0 ? (
                <div className="space-y-2">
                  {task.attachments.map((attachment) => (
                    <div key={attachment._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center">
                        <DocumentIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <div>
                          <p className="font-medium">{attachment.originalName}</p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(attachment.size)} • 
                            Uploaded by {attachment.uploadedBy?.name || 'Unknown'} on {' '}
                            {new Date(attachment.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <a
                        href={getAttachmentDownloadUrl(task._id, attachment._id)}
                        download
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Download
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No files attached to this task.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper components and functions
const StatusBadge = ({ status }) => {
  const statusConfig = {
    pending: { label: 'Pending', classes: 'bg-gray-100 text-gray-800' },
    in_progress: { label: 'In Progress', classes: 'bg-blue-100 text-blue-800' },
    review: { label: 'In Review', classes: 'bg-yellow-100 text-yellow-800' },
    completed: { label: 'Completed', classes: 'bg-green-100 text-green-800' },
    cancelled: { label: 'Cancelled', classes: 'bg-red-100 text-red-800' },
  };

  const config = statusConfig[status] || { label: status, classes: 'bg-gray-100 text-gray-800' };

  return (
    <span className={`px-3 py-1 text-sm rounded-full ${config.classes}`}>
      {config.label}
    </span>
  );
};

const DocumentIcon = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    className={className} 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
    />
  </svg>
);

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default ClientTaskDetail;