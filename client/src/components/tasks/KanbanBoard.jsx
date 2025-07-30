import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { getTasks, updateTask } from '../../services/taskService';
import LoadingSpinner from '../common/LoadingSpinner';
import KanbanCard from './KanbanCard';
import { toast } from 'react-toastify';

const KanbanBoard = ({ filters = {} }) => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Define the columns/statuses
    const columns = [
        {
            id: 'pending',
            title: 'Pending',
            color: 'bg-gray-100',
            headerColor: 'bg-gray-500',
            count: 0
        },
        {
            id: 'in_progress',
            title: 'In Progress',
            color: 'bg-blue-50',
            headerColor: 'bg-blue-500',
            count: 0
        },
        {
            id: 'review',
            title: 'Review',
            color: 'bg-yellow-50',
            headerColor: 'bg-yellow-500',
            count: 0
        },
        {
            id: 'completed',
            title: 'Completed',
            color: 'bg-green-50',
            headerColor: 'bg-green-500',
            count: 0
        },
        {
            id: 'cancelled',
            title: 'Cancelled',
            color: 'bg-red-50',
            headerColor: 'bg-red-500',
            count: 0
        }
    ];

    // Fetch tasks with pagination for Kanban view
    const fetchTasks = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            let allTasks = [];
            let currentPage = 1;
            let hasMorePages = true;
            const limit = 100; // Maximum allowed by backend

            // Fetch all tasks by paginating through all pages
            while (hasMorePages) {
                const response = await getTasks({
                    ...filters,
                    page: currentPage,
                    limit: limit
                });

                if (response.data && response.data.length > 0) {
                    allTasks = [...allTasks, ...response.data];

                    // Check if there are more pages
                    hasMorePages = response.pagination &&
                        response.pagination.page < response.pagination.pages;
                    currentPage++;
                } else {
                    hasMorePages = false;
                }

                // Safety check to prevent infinite loops
                if (currentPage > 50) { // Max 5000 tasks (50 * 100)
                    console.warn('Reached maximum page limit for Kanban view');
                    break;
                }
            }

            setTasks(allTasks);
        } catch (err) {
            console.error('Error fetching tasks:', err);
            setError('Failed to load tasks. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    // Group tasks by status
    const groupedTasks = tasks.reduce((acc, task) => {
        const status = task.status || 'pending';
        if (!acc[status]) {
            acc[status] = [];
        }
        acc[status].push(task);
        return acc;
    }, {});

    // Update column counts
    const columnsWithCounts = columns.map(column => ({
        ...column,
        count: groupedTasks[column.id]?.length || 0
    }));

    // Handle drag end
    const handleDragEnd = async (result) => {
        console.log('Drag ended:', result);

        const { destination, source, draggableId } = result;

        // If dropped outside a droppable area
        if (!destination) {
            console.log('Dropped outside droppable area');
            return;
        }

        // If dropped in the same position
        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            console.log('Dropped in same position');
            return;
        }

        const taskId = draggableId;
        const newStatus = destination.droppableId;
        const oldStatus = source.droppableId;

        console.log(`Moving task ${taskId} from ${oldStatus} to ${newStatus}`);

        // Find the task to get its current data
        const taskToUpdate = tasks.find(task => task._id === taskId);
        if (!taskToUpdate) {
            console.error('Task not found:', taskId);
            toast.error('Task not found. Please refresh the page.');
            return;
        }

        // Optimistically update the UI
        const updatedTasks = tasks.map(task => {
            if (task._id === taskId) {
                return { ...task, status: newStatus };
            }
            return task;
        });
        setTasks(updatedTasks);

        try {
            // Update the task status on the server
            console.log('Updating task on server...');
            const response = await updateTask(taskId, { status: newStatus });
            console.log('Task updated successfully:', response);

            // Update the task with the response data to ensure consistency
            if (response && response.data) {
                const updatedTasksFromServer = updatedTasks.map(task => {
                    if (task._id === taskId) {
                        // Ensure the status is definitely set to the new status
                        return { ...response.data, status: newStatus };
                    }
                    return task;
                });
                setTasks(updatedTasksFromServer);
                console.log('Updated tasks with server response:', response.data);
                console.log('Final task status should be:', newStatus);
            } else {
                // If no response data, just keep the optimistic update
                console.log('No response data, keeping optimistic update');
                console.log('Response structure:', response);
                // Ensure the optimistic update persists
                console.log('Current tasks after optimistic update:', updatedTasks.find(t => t._id === taskId));
            }

            // Find the task name for the toast message
            const taskName = taskToUpdate.title || 'Task';
            const newStatusTitle = columns.find(col => col.id === newStatus)?.title || newStatus;

            // Show success toast
            toast.success(`"${taskName}" moved to ${newStatusTitle}`, {
                position: "bottom-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });
        } catch (error) {
            console.error('Error updating task status:', error);
            console.error('Error details:', error.response?.data || error.message);

            // Revert the optimistic update on error
            const revertedTasks = updatedTasks.map(task => {
                if (task._id === taskId) {
                    return { ...task, status: oldStatus };
                }
                return task;
            });
            setTasks(revertedTasks);

            // Show error toast with more details
            const errorMessage = error.response?.data?.error || error.message || 'Failed to update task status';
            toast.error(`${errorMessage}. Please try again.`, {
                position: "bottom-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });
        }
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return (
            <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
                {error}
                <button
                    className="ml-2 text-red-500 hover:text-red-700"
                    onClick={() => {
                        setError(null);
                        fetchTasks();
                    }}
                >
                    Retry
                </button>
            </div>
        );
    }

    // Debug: Log tasks to see if they're loaded
    console.log('Tasks loaded:', tasks.length);
    console.log('Grouped tasks:', groupedTasks);

    return (
        <div className="kanban-board">
            <DragDropContext
                onDragEnd={handleDragEnd}
                onDragStart={(start) => {
                    console.log('Drag started:', start);
                }}
                onDragUpdate={(update) => {
                    console.log('Drag update:', update);
                }}
            >
                <div className="flex gap-4 h-full overflow-x-auto pb-4">
                    {columnsWithCounts.map((column) => (
                        <div
                            key={column.id}
                            className="flex-shrink-0 w-80 bg-white rounded-lg shadow-sm border"
                        >
                            {/* Column Header */}
                            <div className={`${column.headerColor} text-white p-4 rounded-t-lg`}>
                                <div className="flex justify-between items-center">
                                    <h3 className="font-semibold text-lg">{column.title}</h3>
                                    <span className="bg-white bg-opacity-20 px-2 py-1 rounded-full text-sm font-medium">
                                        {column.count}
                                    </span>
                                </div>
                            </div>

                            {/* Column Content */}
                            <Droppable droppableId={column.id}>
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={`kanban-column p-3 ${column.color} ${snapshot.isDraggingOver ? 'bg-opacity-75 ring-2 ring-blue-300' : ''
                                            } transition-all duration-200 rounded-b-lg`}
                                    >
                                        {(groupedTasks[column.id] || []).map((task, index) => (
                                            <Draggable
                                                key={task._id}
                                                draggableId={task._id}
                                                index={index}
                                            >
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className={`mb-3 ${snapshot.isDragging ? 'kanban-card dragging' : 'kanban-card'
                                                            }`}
                                                    >
                                                        <KanbanCard task={task} isDragging={snapshot.isDragging} />
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}

                                        {/* Empty state */}
                                        {(!groupedTasks[column.id] || groupedTasks[column.id].length === 0) && (
                                            <div className="text-gray-400 text-center py-8 text-sm italic">
                                                <div className="flex flex-col items-center">
                                                    <svg className="w-8 h-8 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                    </svg>
                                                    No tasks in {column.title.toLowerCase()}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    ))}
                </div>
            </DragDropContext>
        </div>
    );
};

export default KanbanBoard;