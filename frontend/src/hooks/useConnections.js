import { useEffect, useState } from 'react';
import api from '../services/api.js';

export function useConnections() {
  const [connections, setConnections] = useState(null);

  useEffect(() => {
    api.get('/connections').then((res) => setConnections(res.data.connections));
  }, []);

  return connections;
}
