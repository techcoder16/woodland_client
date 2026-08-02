import React from 'react';
import { useAppSelector } from '../../redux/reduxHooks';
import { Building, Users, DollarSign, TrendingUp, FileText, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '../ui/card';

interface StatTileProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  loading?: boolean;
}

const StatTile: React.FC<StatTileProps> = ({ title, value, icon: Icon, trend, loading }) => {
  if (loading) {
    return (
      <div className="flex flex-col gap-2 py-1">
        <div className="h-3 w-24 bg-muted rounded animate-pulse" />
        <div className="h-8 w-16 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 py-1">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" strokeWidth={1.75} />
        <span className="text-xs tracking-tight">{title}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="stat-figure">{value}</span>
        {trend && (
          <span
            className={`text-xs font-mono font-medium ${
              trend.isPositive ? 'text-success' : 'text-destructive'
            }`}
          >
            {trend.isPositive ? '+' : ''}
            {trend.value}%
          </span>
        )}
      </div>
    </div>
  );
};

export const DashboardStats: React.FC = () => {
  const { stats, loading, error } = useAppSelector((state) => state.dashboard);

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            <p className="text-sm font-medium">Failed to load dashboard statistics</p>
            <p className="text-xs text-muted-foreground mt-1">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

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
        isPositive: stat.trend?.isPositive || stat.trend?.percentageChange > 0 || false,
      };
    }
    return undefined;
  };

  const tiles = [
    { title: 'Total Properties', key: 'totalProperties', icon: Building },
    { title: 'Published', key: 'publishedProperties', icon: CheckCircle },
    { title: 'Drafts', key: 'draftProperties', icon: FileText },
    { title: 'Total Tenants', key: 'totalTenants', icon: Users },
    { title: 'Transactions', key: 'totalTransactions', icon: DollarSign },
    { title: 'Rent Records', key: 'totalRentRecords', icon: TrendingUp },
  ] as const;

  return (
    <div className="surface px-6 py-5">
      <div className="grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
        {tiles.map(({ title, key, icon }) => (
          <StatTile
            key={key}
            title={title}
            icon={icon}
            loading={loading}
            value={getStatValue((stats as any)?.[key])}
            trend={getTrendValue((stats as any)?.[key])}
          />
        ))}
      </div>
    </div>
  );
};
