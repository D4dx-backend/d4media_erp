import React, { useState, useEffect } from 'react';
import { 
  updateTaskProgress, 
  addProgressNote, 
  startTimeTracking, 
  stopTimeTracking, 
  addManualTimeEntry,
  getTimeEntries
} from '../../services/taskService';
import LoadingSpinner from '../common/LoadingSpinner';

const TaskProgress = ({ taskId, initialProgress = 0, onUpdate }) => {
  const [progress, setProgress] = useState(initialProgress);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeTracking, setTimeTracking] = useState({
    isActive: false,
    startTime: null,
    description: ''
  });
  const [manualTime, setManualTime] = useState({
    startTime: '',
    duration: '',
    description: ''
  });
  const [timeEntries, setTimeEntries] = useState({
    entries: [],
    summary: {
      totalActualHours: 0,
      estimatedHours: 0,
      remainingHours: 0
    }
  });
  const [activeTab, setActiveTab] = useState('progress');

  // Fetch time entries when component mounts
  useEffect(() => {
    if (taskId) {
      fetchTimeEntries();
    }
  }, [taskId]);

  const fetchTimeEntries = async () => {
    try {
      setLoading(true);
      const response = await getTimeEntries(taskId);
      setTimeEntries(response.data);
      
      // Check if there's an active time entry for the current user
      const activeEntry = response.data.timeEntries.find(entry => entry.isActive);
      if (activeEntry) {
        setTimeTracking({
          isActive: true,
          startTime: new Date(activeEntry.startTime),
          description: activeEntry.description || ''
        });
      }
    } catch (error) {
      console.error('Error fetching time entries:', error);
      setError('Failed to load time entries');
    } finally {
      setLoading(false);
    }
  };

  const handleProgressChange = (e) => {
    setProgress(parseInt(e.target.value, 10));
  };

  const handleNoteChange = (e) => {
    setNote(e.target.value);
  };

  const handleSubmitProgress = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const response = await updateTaskProgress(taskId, progress, note);
      if (onUpdate) {
        onUpdate(response.data);
      }
      setNote('');
    } catch (error) {
      console.error('Error updating progress:', error);
      setError(error.response?.data?.error || 'Failed to update progress');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!note.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await addProgressNote(taskId, note);
      if (onUpdate) {
        onUpdate({ progress: { notes: response.data } });
      }
      setNote('');
    } catch (error) {
      console.error('Error adding note:', error);
      setError(error.response?.data?.error || 'Failed to add note');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTimeTracking = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await startTimeTracking(taskId, timeTracking.description);
      setTimeTracking({
        isActive: true,
        startTime: new Date(),
        description: timeTracking.description
      });
      fetchTimeEntries();
    } catch (error) {
      console.error('Error starting time tracking:', error);
      setError(error.response?.data?.error || 'Failed to start time tracking');
    } finally {
      setLoading(false);
    }
  };

  const handleStopTimeTracking = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await stopTimeTracking(taskId, timeTracking.description);
      setTimeTracking({
        isActive: false,
        startTime: null,
        description: ''
      });
      fetchTimeEntries();
    } catch (error) {
      console.error('Error stopping time tracking:', error);
      setError(error.response?.data?.error || 'Failed to stop time tracking');
    } finally {
      setLoading(false);
    }
  };

  const handleManualTimeChange = (e) => {
    const { name, value } = e.target;
    setManualTime(prev => ({ ...prev, [name]: value }));
  };

  const handleAddManualTime = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      await addManualTimeEntry(taskId, {
        startTime: manualTime.startTime,
        duration: parseInt(manualTime.duration, 10),
        description: manualTime.description
      });
      
      setManualTime({
        startTime: '',
        duration: '',
        description: ''
      });
      
      fetchTimeEntries();
    } catch (error) {
      console.error('Error adding manual time entry:', error);
      setError(error.response?.data?.error || 'Failed to add time entry');
    } finally {
      setLoading(false);
    }
  };

  // Format duration in hours and minutes
  const formatDuration = (minutes) => {
    if (!minutes) return '0m';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  // Format date and time
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      {/* Tab Navigation */}
      <div className="flex border-b mb-4">
        <button
          className={`px-4 py-2 ${activeTab === 'progress' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
          onClick={() => setActiveTab('progress')}
        >
          Progress
        </button>
        <button
          className={`px-4 py-2 ${activeTab === 'time' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
          onClick={() => setActiveTab('time')}
        >
          Time Tracking
        </button>
        <button
          className={`px-4 py-2 ${activeTab === 'notes' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
          onClick={() => setActiveTab('notes')}
        >
          Notes
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4">
          {error}
        </div>
      )}

      {loading && <LoadingSpinner />}

      {/* Progress Tab */}
      {activeTab === 'progress' && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Update Progress</h3>
          
          <form onSubmit={handleSubmitProgress}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Progress: {progress}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={progress}
                onChange={handleProgressChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
                Progress Note
              </label>
              <textarea
                id="note"
                value={note}
                onChange={handleNoteChange}
                rows="3"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add a note about your progress..."
              ></textarea>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300"
            >
              Update Progress
            </button>
          </form>
        </div>
      )}

      {/* Time Tracking Tab */}
      {activeTab === 'time' && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Time Tracking</h3>
          
          {/* Time Summary */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-blue-50 p-3 rounded-md">
              <div className="text-sm text-gray-500">Actual Hours</div>
              <div className="text-xl font-semibold text-blue-700">
                {timeEntries.summary.totalActualHours.toFixed(1)}
              </div>
            </div>
            <div className="bg-green-50 p-3 rounded-md">
              <div className="text-sm text-gray-500">Estimated</div>
              <div className="text-xl font-semibold text-green-700">
                {timeEntries.summary.estimatedHours.toFixed(1)}
              </div>
            </div>
            <div className="bg-orange-50 p-3 rounded-md">
              <div className="text-sm text-gray-500">Remaining</div>
              <div className="text-xl font-semibold text-orange-700">
                {timeEntries.summary.remainingHours.toFixed(1)}
              </div>
            </div>
          </div>
          
          {/* Active Time Tracking */}
          <div className="mb-6 p-4 border rounded-md">
            <h4 className="text-md font-medium text-gray-800 mb-2">
              {timeTracking.isActive ? 'Currently Tracking' : 'Start Tracking'}
            </h4>
            
            {timeTracking.isActive ? (
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Started at:</span>
                  <span className="text-sm font-medium">
                    {timeTracking.startTime.toLocaleTimeString()}
                  </span>
                </div>
                <div className="mb-3">
                  <input
                    type="text"
                    value={timeTracking.description}
                    onChange={(e) => setTimeTracking(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="What are you working on?"
                  />
                </div>
                <button
                  onClick={handleStopTimeTracking}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-red-300"
                >
                  Stop Tracking
                </button>
              </div>
            ) : (
              <div>
                <div className="mb-3">
                  <input
                    type="text"
                    value={timeTracking.description}
                    onChange={(e) => setTimeTracking(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="What are you working on?"
                  />
                </div>
                <button
                  onClick={handleStartTimeTracking}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-green-300"
                >
                  Start Tracking
                </button>
              </div>
            )}
          </div>
          
          {/* Manual Time Entry */}
          <div className="mb-6 p-4 border rounded-md">
            <h4 className="text-md font-medium text-gray-800 mb-2">Add Time Manually</h4>
            
            <form onSubmit={handleAddManualTime}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <div>
                  <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
                    Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    id="startTime"
                    name="startTime"
                    value={manualTime.startTime}
                    onChange={handleManualTimeChange}
                    required
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    id="duration"
                    name="duration"
                    value={manualTime.duration}
                    onChange={handleManualTimeChange}
                    required
                    min="1"
                    max="1440"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="mb-3">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  id="description"
                  name="description"
                  value={manualTime.description}
                  onChange={handleManualTimeChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="What did you work on?"
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300"
              >
                Add Time Entry
              </button>
            </form>
          </div>
          
          {/* Time Entries List */}
          <div>
            <h4 className="text-md font-medium text-gray-800 mb-2">Recent Time Entries</h4>
            
            {timeEntries.entries.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No time entries yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {timeEntries.entries.slice(0, 5).map((entry, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                          {formatDateTime(entry.startTime)}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                          {formatDuration(entry.duration)}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {entry.description || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notes Tab */}
      {activeTab === 'notes' && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Progress Notes</h3>
          
          <form onSubmit={handleAddNote} className="mb-4">
            <div className="mb-3">
              <textarea
                value={note}
                onChange={handleNoteChange}
                rows="3"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add a note..."
                required
              ></textarea>
            </div>
            
            <button
              type="submit"
              disabled={loading || !note.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300"
            >
              Add Note
            </button>
          </form>
          
          <div className="space-y-3">
            {timeEntries.entries.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No notes yet</p>
            ) : (
              timeEntries.entries.slice(0, 10).map((entry, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-3 py-2">
                  <div className="text-sm text-gray-600">
                    {formatDateTime(entry.startTime)}
                  </div>
                  <div className="text-gray-900">{entry.description || '-'}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskProgress;