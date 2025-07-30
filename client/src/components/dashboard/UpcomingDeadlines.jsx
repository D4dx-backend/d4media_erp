import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, Calendar, CheckCircle } from 'lucide-react';
import { getDashboardData } from '../../services/reportService';
import LoadingSpinner from '../common/LoadingSpinner';

const UpcomingDeadlines = () => {
  const [loading, setLoading] = useState(true);
  const [deadlines, setDeadlines] = useState([]);

  useEffect(() => {
    fetchUpcomingDeadlines();
  }, []);

  const fetchUpcomingDeadlines = async () => {
    try {
      setLoading(true);
      const data = await getDashboardData({ includeDeadlines: true });
      
      // Mock upcoming deadlines if not provided by API
      const mockDeadlines = [
        {
          id: 1,
          title: 'Client presentation slides',
          type: 'task',
          dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
          priority: 'urgent',
          client: 'ABC Corp',
          assignee: 'John Doe'
        },
        {
          id: 2,
          title: 'Video editing final cut',
          type: 'task',
          dueDate: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours from now
          priority: 'high',
          client: 'XYZ Media',
          assignee: 'Jane Smith'
        },
        {
          id: 3,
          title: 'Studio booking confirmation',
          type: 'booking',
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          priority: 'medium',
          client: 'Creative Agency',
          assignee: 'Reception'
        },
        {
          id: 4,
          title: 'Event setup preparation',
          type: 'event',
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
          priority: 'high',
          client: 'Corporate Event Co',
          assignee: 'Event Team'
        }
      ];

      setDeadlines(data?.upcomingDeadlines || mockDeadlines);
    } catch (error) {
      console.error('Error fetching upcoming deadlines:', error);
      setDeadlines([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-center items-center h-32">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  const getTimeUntilDeadline = (dueDate) => {
    const now = new Date();
    const deadline = new Date(dueDate);
    const diffMs = deadline - now;
    
    if (diffMs < 0) {
      return { text: 'Overdue', color: 'text-red-600', urgent: true };
    }
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return { text: `${diffMinutes}m`, color: 'text-red-600', urgent: true };
    } else if (diffHours < 24) {
      return { text: `${diffHours}h`, color: diffHours < 6 ? 'text-red-600' : 'text-orange-600', urgent: diffHours < 6 };
    } else if (diffDays < 7) {
      return { text: `${diffDays}d`, color: diffDays < 2 ? 'text-orange-600' : 'text-yellow-600', urgent: false };
    } else {
      return { text: `${diffDays}d`, color: 'text-gray-600', urgent: false };
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'task':
        return <CheckCircle className="h-4 w-4" />;
      case 'booking':
        return <Calendar className="h-4 w-4" />;
      case 'event':
        return <Clock className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  // Sort deadlines by due date
  const sortedDeadlines = deadlines.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <Clock className="h-5 w-5 text-blue-500 mr-2" />
          Upcoming Deadlines
        </h3>
        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
          {deadlines.length}
        </span>
      </div>

      {deadlines.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-8">No upcoming deadlines</p>
      ) : (
        <div className="space-y-3">
          {sortedDeadlines.slice(0, 5).map((deadline) => {
            const timeInfo = getTimeUntilDeadline(deadline.dueDate);
            
            return (
              <div
                key={deadline.id}
                className={`border-l-4 pl-3 py-2 ${
                  timeInfo.urgent ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="text-gray-500">
                        {getTypeIcon(deadline.type)}
                      </div>
                      <p className="font-medium text-sm text-gray-900">
                        {deadline.title}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(deadline.priority)}`}>
                        {deadline.priority}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-600">
                      <span>Client: {deadline.client}</span>
                      <span>Assignee: {deadline.assignee}</span>
                    </div>
                    
                    <p className="text-xs text-gray-500 mt-1">
                      Due: {new Date(deadline.dueDate).toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <span className={`text-sm font-medium ${timeInfo.color}`}>
                      {timeInfo.text}
                    </span>
                    {timeInfo.urgent && (
                      <div className="flex items-center mt-1">
                        <AlertTriangle className="h-3 w-3 text-red-500" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          
          {deadlines.length > 5 && (
            <div className="text-center pt-2">
              <button className="text-sm text-blue-600 hover:text-blue-800">
                View all {deadlines.length} deadlines
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UpcomingDeadlines;