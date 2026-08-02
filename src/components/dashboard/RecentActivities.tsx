import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../redux/reduxHooks';
import { fetchRecentActivities } from '../../redux/dataStore/dashboardSlice';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  Building, 
  Users, 
  DollarSign, 
  FileText, 
  CheckCircle, 
  Clock,
  User,
  Home,
  CreditCard
} from 'lucide-react';

interface ActivityItemProps {
  activity: {
    id: string;
    type: 'property' | 'tenant' | 'payment' | 'system';
    action: string;
    description: string;
    timestamp?: string | null;
    userName?: string;
  };
}

const ActivityItem: React.FC<ActivityItemProps> = ({ activity }) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'property':
        return <Building className="h-4 w-4" />;
      case 'tenant':
        return <Users className="h-4 w-4" />;
      case 'payment':
        return <CreditCard className="h-4 w-4" />;
      case 'system':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'property':
        return 'bg-primary/10 text-primary';
      case 'tenant':
        return 'bg-success/10 text-success';
      case 'payment':
        return 'bg-warning/10 text-warning';
      case 'system':
        return 'bg-accent text-accent-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const formatTimestamp = (activity: any,timestamp: string | null | undefined) => {
    // Handle null, undefined, or empty timestamps
    console.log(timestamp,'asdasdas',activity)
    if (!timestamp || timestamp.trim() === '') {
      return 'Recently';
    }
    
    // Try to parse the date
    const date = new Date(timestamp);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      // Try alternative date formats or return a fallback
      const altDate = new Date(timestamp.replace(/-/g, '/'));
      if (!isNaN(altDate.getTime())) {
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - altDate.getTime()) / (1000 * 60));
        
        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
        return altDate.toLocaleDateString();
      }
      return 'Recently';
    }
    
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    // Handle negative time differences (future dates)
    if (diffInMinutes < 0) {
      return 'Just now';
    }
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    
    // Format date properly
    try {
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (e) {
      return 'Recently';
    }
  };

  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/60 last:border-0">
      <div className={`p-2 rounded-full shrink-0 ${getActivityColor(activity.type)}`}>
        {getActivityIcon(activity.type)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-foreground truncate">
            {activity.action}
          </p>
          <span className="text-xs font-mono text-muted-foreground shrink-0">
            {formatTimestamp(activity,activity.timestamp)}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
          {activity.description}
        </p>
        {activity.userName && (
          <div className="flex items-center mt-1">
            <User className="h-3 w-3 text-muted-foreground/70 mr-1" />
            <span className="text-xs text-muted-foreground/70">{activity.userName}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export const RecentActivities: React.FC = () => {
  const dispatch = useAppDispatch();
  const { activities, loading, error } = useAppSelector((state) => state.dashboard);

  useEffect(() => {
    dispatch(fetchRecentActivities(10));
  }, [dispatch]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3 p-3">
                <div className="h-8 w-8 bg-muted rounded-full animate-pulse" />
                <div className="flex-1">
                  <div className="h-4 w-32 bg-muted rounded animate-pulse mb-2" />
                  <div className="h-3 w-48 bg-muted rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-destructive">
            <p>Failed to load activities</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Recent Activities
          <Badge variant="secondary">{Array.isArray(activities) ? activities.length : 0}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!Array.isArray(activities) || activities.length === 0 ? (
          <div className="text-center py-10">
            <Clock className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No recent activities</p>
          </div>
        ) : (
          <div>
            {activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};