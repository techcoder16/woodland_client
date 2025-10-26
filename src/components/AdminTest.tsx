import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const AdminTest: React.FC = () => {
  const { user, isAdmin, isAuthenticated } = useAuth();

  return (
    <Card className="w-full max-w-md">

      <CardContent className="space-y-2">
        <div>
          <strong>Authenticated:</strong> 
          <Badge variant={isAuthenticated ? 'default' : 'destructive'} className="ml-2">
            {isAuthenticated ? 'Yes' : 'No'}
          </Badge>
        </div>
        <div>
          <strong>User Email:</strong> {user?.email || 'No user'}
        </div>
        <div>
          <strong>User Role:</strong> {user?.role || 'No role'}
        </div>
        <div>
          <strong>Is Admin:</strong> 
          <Badge variant={isAdmin ? 'default' : 'destructive'} className="ml-2">
            {isAdmin ? 'Yes' : 'No'}
          </Badge>
        </div>
        <div>
          <strong>User Object:</strong>
          <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminTest;
