import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../redux/reduxHooks';
import { fetchDashboardStats } from '../../redux/dataStore/dashboardSlice';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Building, Users, DollarSign, TrendingUp, FileText, CheckCircle } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, trend, loading }) => {
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <p className="text-xs text-muted-foreground">
            <span className={trend.isPositive ? 'text-green-600' : 'text-red-600'}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>{' '}
            from last month
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export const DashboardStats: React.FC = () => {
  const { stats, loading, error } = useAppSelector((state) => state.dashboard);

  // Debug logging
  console.log('DashboardStats - stats:', stats);
  console.log('DashboardStats - loading:', loading);
  console.log('DashboardStats - error:', error);

  if (error) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="col-span-full">
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-red-600">
                <p>Failed to load dashboard statistics</p>
                <p className="text-sm text-gray-500">{error}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Helper function to safely extract values from API response
  const getStatValue = (stat: any) => {
    if (typeof stat === 'number') return stat;
    if (typeof stat === 'string') return stat;
    if (stat && typeof stat === 'object' && 'value' in stat) return stat.value;
    return 0;
  };

  const getTrendValue = (stat: any) => {
    if (stat && typeof stat === 'object' && 'trend' in stat) {
      return {
        value: stat.trend?.value || 0,
        isPositive: stat.trend?.isPositive || stat.trend?.percentageChange > 0 || false
      };
    }
    return undefined;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Properties"
        value={getStatValue(stats?.totalProperties)}
        icon={Building}
        loading={loading}
        
        trend={getTrendValue(stats?.totalProperties)}
      />
      <StatCard
        title="Published Properties"
        value={getStatValue(stats?.publishedProperties)}
        icon={CheckCircle}
        loading={loading}
        trend={getTrendValue(stats?.publishedProperties)}
      />
      <StatCard
        title="Draft Properties"
        value={getStatValue(stats?.draftProperties)}
        icon={FileText}
        loading={loading}
        trend={getTrendValue(stats?.draftProperties)}
      />
      <StatCard
        title="Total Tenants"
        value={getStatValue(stats?.totalTenants)}
        icon={Users}
        loading={loading}
        trend={getTrendValue(stats?.totalTenants)}
      />
   
      <StatCard
        title="Total Transactions"
        value={getStatValue(stats?.totalTransactions)}
        icon={DollarSign}
        loading={loading}
        trend={getTrendValue(stats?.totalTransactions)}
      />
      <StatCard
        title="Total Rent Records"
        value={getStatValue(stats?.totalRentRecords)}
        icon={TrendingUp}
        loading={loading}
        trend={getTrendValue(stats?.totalRentRecords)}
      />
    </div>
  );
};