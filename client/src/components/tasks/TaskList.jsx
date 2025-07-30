import React, { useState, useEffect, useCallback } from 'react';
import TaskCard from './TaskCard';
import { getTasks } from '../../services/taskService';
import LoadingSpinner from '../common/LoadingSpinner';
import PullToRefresh from '../common/PullToRefresh';
import TouchButton from '../common/TouchButton';
import { getPaginationClasses } from '../../utils/touchFriendly';
import { isOnline, getCachedTasks, cacheTasks } from '../../utils/offlineCache';

const TaskList = ({ filters = {}, onError }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  const ITEMS_PER_PAGE = 10;

  const fetchTasks = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      
      // Check if we're online
      if (isOnline()) {
        // If online, fetch from API
        const response = await getTasks({ ...filters, page, limit: ITEMS_PER_PAGE });
        setTasks(response.data);
        setPagination(response.pagination);
        
        // Cache the tasks for offline use
        cacheTasks(response.data);
      } else {
        // If offline, use cached data
        const cachedData = getCachedTasks();
        if (cachedData) {
          // Simple pagination for offline mode
          const totalPages = Math.ceil(cachedData.length / ITEMS_PER_PAGE);
          const startIndex = (page - 1) * ITEMS_PER_PAGE;
          const paginatedTasks = cachedData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
          
          setTasks(paginatedTasks);
          setPagination({
            page,
            limit: ITEMS_PER_PAGE,
            total: cachedData.length,
            pages: totalPages
          });
        } else {
          // No cached data available
          setTasks([]);
          if (onError) onError(new Error('You are offline and no cached data is available'));
        }
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      
      // Try to use cached data as fallback
      const cachedData = getCachedTasks();
      if (cachedData) {
        setTasks(cachedData);
      }
      
      if (onError) onError(error);
    } finally {
      setLoading(false);
    }
  }, [filters, onError]);

  useEffect(() => {
    fetchTasks();
  }, [filters, fetchTasks]);
  
  const handleRefresh = async () => {
    return fetchTasks(pagination.page);
  };

  const handlePageChange = (newPage) => {
    fetchTasks(newPage);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-500">No tasks found matching your criteria.</p>
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks.map(task => (
          <TaskCard key={task._id} task={task} />
        ))}
      </div>
      
      {/* Touch-friendly Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center mt-6">
          <nav className="flex items-center">
            <TouchButton
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              variant="secondary"
              size="md"
              className="rounded-r-none border-r-0"
              aria-label="Previous page"
            >
              <span aria-hidden="true">&laquo;</span>
              <span className="sr-only">Previous</span>
            </TouchButton>
            
            {/* Show limited page numbers on mobile, more on desktop */}
            <div className="hidden sm:flex">
              {[...Array(pagination.pages)].map((_, i) => {
                // On mobile, only show current page and immediate neighbors
                const pageNum = i + 1;
                const isCurrentPage = pagination.page === pageNum;
                const isFirstPage = pageNum === 1;
                const isLastPage = pageNum === pagination.pages;
                const isNearCurrent = Math.abs(pageNum - pagination.page) <= 1;
                
                // Only show first, last, and pages near current
                if (isFirstPage || isLastPage || isNearCurrent) {
                  return (
                    <TouchButton
                      key={i}
                      onClick={() => handlePageChange(pageNum)}
                      variant={isCurrentPage ? "primary" : "secondary"}
                      size="md"
                      className={`rounded-none border-r-0 min-w-[44px] ${
                        isCurrentPage ? 'font-medium' : ''
                      }`}
                    >
                      {pageNum}
                    </TouchButton>
                  );
                } else if (
                  (pageNum === pagination.page - 2 && pagination.page > 3) ||
                  (pageNum === pagination.page + 2 && pagination.page < pagination.pages - 2)
                ) {
                  // Show ellipsis for skipped pages
                  return (
                    <span 
                      key={i} 
                      className="px-3 py-2 border-t border-b border-gray-300 bg-white text-gray-500"
                    >
                      &hellip;
                    </span>
                  );
                }
                return null;
              })}
            </div>
            
            {/* Simplified mobile pagination */}
            <div className="flex sm:hidden items-center">
              <span className="px-3 py-2 border-t border-b border-gray-300 bg-white">
                {pagination.page} / {pagination.pages}
              </span>
            </div>
            
            <TouchButton
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              variant="secondary"
              size="md"
              className="rounded-l-none"
              aria-label="Next page"
            >
              <span aria-hidden="true">&raquo;</span>
              <span className="sr-only">Next</span>
            </TouchButton>
          </nav>
        </div>
      )}
    </PullToRefresh>
  );
};

export default TaskList;