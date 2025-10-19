import { useEffect, useRef, useState } from 'react';
import { useAppDispatch } from '../redux/reduxHooks';
import { addActivity } from '../redux/dataStore/dashboardSlice';

interface WebSocketMessage {
  type: string;
  data: any;
}

export const useWebSocket = (url: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Don't connect if URL is not provided or is empty
    if (!url || url.trim() === '') {
      return;
    }

    let reconnectTimeout: NodeJS.Timeout;
    let isMounted = true;
    
    const connect = () => {
      if (!isMounted) return;
      
      try {
        ws.current = new WebSocket(url);

        ws.current.onopen = () => {
          if (!isMounted) return;
          setIsConnected(true);
          setError(null);
          console.log('WebSocket connected');
        };

        ws.current.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            
            switch (message.type) {
              case 'newActivity':
                dispatch(addActivity(message.data));
                break;
              default:
                console.log('Unknown message type:', message.type);
            }
          } catch (err) {
            console.error('Error parsing WebSocket message:', err);
          }
        };

        ws.current.onclose = () => {
          if (!isMounted) return;
          setIsConnected(false);
          console.log('WebSocket disconnected');
          
          // Only attempt to reconnect if the component is still mounted
          if (isMounted && ws.current?.readyState === WebSocket.CLOSED) {
            reconnectTimeout = setTimeout(() => {
              if (isMounted) {
                connect();
              }
            }, 3000);
          }
        };

        ws.current.onerror = (error) => {
          if (!isMounted) return;
          setError('WebSocket connection error');
          console.error('WebSocket error:', error);
        };
      } catch (err) {
        if (!isMounted) return;
        setError('Failed to create WebSocket connection');
        console.error('WebSocket connection error:', err);
      }
    };

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [url, dispatch]);

  const sendMessage = (message: any) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  };

  const joinRoom = (room: string) => {
    sendMessage({
      type: 'joinRoom',
      room: room
    });
  };

  const leaveRoom = (room: string) => {
    sendMessage({
      type: 'leaveRoom',
      room: room
    });
  };

  return {
    isConnected,
    error,
    sendMessage,
    joinRoom,
    leaveRoom
  };
};
