import React, { useState } from 'react';
import { Button } from '../ui/button';
import { post } from '../../helper/api';
import { useAppDispatch } from '../../redux/reduxHooks';
import { addActivity } from '../../redux/dataStore/dashboardSlice';
import { TestTube, Loader2 } from 'lucide-react';

export const TestActivityButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useAppDispatch();

  const testWebSocketActivity = async () => {
    setIsLoading(true);
    try {
      // Call the test-activity endpoint
      const response = await post('/dashboard/test-activity', {});
      
      if (response.error) {
        console.error('Test activity error:', response.error);
        return;
      }

      // Manually add a test activity to the store for immediate feedback
      const testActivity = {
        id: `test-${Date.now()}`,
        type: 'system' as const,
        action: 'Test Activity',
        description: 'WebSocket test activity triggered successfully!',
        timestamp: new Date().toISOString(),
        userName: 'System Test'
      };

      dispatch(addActivity(testActivity));
      
      console.log('✅ Test activity sent successfully');
    } catch (error) {
      console.error('❌ Failed to send test activity:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={testWebSocketActivity}
      disabled={isLoading}
      variant="outline"
      size="sm"
      className="flex items-center space-x-2"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <TestTube className="h-4 w-4" />
      )}
      <span>{isLoading ? 'Testing...' : 'Test WebSocket'}</span>
    </Button>
  );
};
