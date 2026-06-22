import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';
import { socketService } from '../services/socket';
import { useAuth } from '../context/AuthContext';

export function useUnreadMessages() {
  const { isAuthenticated } = useAuth();
  const [unreadTotal, setUnreadTotal] = useState(0);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadTotal(0);
      return;
    }
    try {
      const total = await api.getUnreadMessageCount();
      setUnreadTotal(total);
    } catch {
      // ignore — nav badge is non-critical
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 45000);
    return () => clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    const onNewMessage = () => {
      refresh();
    };

    socket.on('newMessage', onNewMessage);
    return () => {
      socket.off('newMessage', onNewMessage);
    };
  }, [refresh]);

  return { unreadTotal, refreshUnread: refresh };
}