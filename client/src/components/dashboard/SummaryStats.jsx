import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  BarChart3
} from 'lucide-react';
import { getDashboardData } from '../../services/reportService';
import LoadingSpinner from '../common/LoadingSpinner';

const SummaryStats = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayStats: {
      bookings: 0,
      events: 0,
      tasks: 0,
      revenue: 0
    },
    weekStats: {
      bookings: 0,
      events: 0,
      completedTasks: 0,
      revenue: 0
    },
    monthStats: {
      bookings: 0,
      events: 0,
      completedTasks: 0,
      revenue: 0
    },
    trends: {
      bookingsChange: 0,
      revenueChange: 0,
      tasksChange: 0
    }
  });

  useEffect(() => {
    fetchSummaryStats();
  }, []);

  const fetchSummaryStats = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard data with summary stats
      const data = await getDashboardData({ includeSummary: true });
      
      setStats({
        todayStats: data?.todayStats || {
          bookings: 0,
          events: 0,
          tasks: 0,
          revenue: 0
        },
        weekStats: data?.weekStats || {
          bookings: 0,
          events: 0,
          completedTasks: 0,
          revenue: 0
        },
        monthStats: data?.monthStats || {
          bookings: 0,
          events: 0,
          completedTasks: 0,
          revenue: 0
        },
        trends: data?.trends || {
          bookingsChange: 0,
          revenueChange: 0,
          tasksChange: 0
        }
      });
    } catch (error) {
      console.error('Error fetching summary stats:', error);
      // Keep default stats on error
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <LoadingSpinner />
      </div>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatTrend = (value) => {
    const isPositive = value >= 0;
    return {
      value: Math.abs(value),
      isPositive,
      color: isPositive ? 'text-green-600' : 'text-red-600',
      bgColor: isPositive ? 'bg-green-50' : 'bg-red-50',
      icon: isPositive ? '↗' : '↘'
    };
  };

  const StatCard = ({ title, value, icon: Icon, color, trend, subtitle }) => {
    const trendData = trend ? formatTrend(trend) : null;
    
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
        
        {trendData && (
          <div className="mt-4 flex items-center">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${trendData.bgColor} ${trendData.color}`}>
              {trendData.icon} {trendData.value}%
            </span>
            <span className="ml-2 text-sm text-gray-500">vs last period</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Today's Overview */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Today's Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Today's Bookings"
            value={stats.todayStats.bookings}
            icon={Calendar}
            color="bg-blue-500"
            subtitle="Studio & Events"
          />
          <StatCard
            title="Active Tasks"
            value={stats.todayStats.tasks}
            icon={Clock}
            color="bg-orange-500"
            subtitle="In Progress"
          />
          <StatCard
            title="Today's Events"
            value={stats.todayStats.events}
            icon={Users}
            color="bg-purple-500"
            subtitle="Scheduled"
          />
          <StatCard
            title="Today's Revenue"
            value={formatCurrency(stats.todayStats.revenue)}
            icon={DollarSign}
            color="bg-green-500"
            subtitle="Confirmed"
          />
        </div>
      </div>

      {/* Weekly Performance */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">This Week</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Weekly Bookings"
            value={stats.weekStats.bookings}
            icon={Calendar}
            color="bg-indigo-500"
            trend={stats.trends.bookingsChange}
          />
          <StatCard
            title="Completed Tasks"
            value={stats.weekStats.completedTasks}
            icon={CheckCircle}
            color="bg-green-500"
            trend={stats.trends.tasksChange}
          />
          <StatCard
            title="Weekly Events"
            value={stats.weekStats.events}
            icon={Users}
            color="bg-purple-500"
          />
          <StatCard
            title="Weekly Revenue"
            value={formatCurrency(stats.weekStats.revenue)}
            icon={TrendingUp}
            color="bg-emerald-500"
            trend={stats.trends.revenueChange}
          />
        </div>
      </div>

      {/* Monthly Performance */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">This Month</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Monthly Bookings"
            value={stats.monthStats.bookings}
            icon={BarChart3}
            color="bg-cyan-500"
          />
          <StatCard
            title="Tasks Completed"
            value={stats.monthStats.completedTasks}
            icon={CheckCircle}
            color="bg-green-600"
          />
          <StatCard
            title="Monthly Events"
            value={stats.monthStats.events}
            icon={Users}
            color="bg-violet-500"
          />
          <StatCard
            title="Monthly Revenue"
            value={formatCurrency(stats.monthStats.revenue)}
            icon={DollarSign}
            color="bg-emerald-600"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <div className="text-center">
              <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-600">New Booking</span>
            </div>
          </button>
          
          <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors">
            <div className="text-center">
              <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-600">New Event</span>
            </div>
          </button>
          
          <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors">
            <div className="text-center">
              <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-600">New Task</span>
            </div>
          </button>
          
          <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors">
            <div className="text-center">
              <DollarSign className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-600">New Invoice</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SummaryStats;