import { useState, useEffect, useCallback } from 'react';
import type { BootstrapData, Player, Team } from '../types';
import { getBootstrap } from '../api';

interface UseBootstrapReturn {
  data: BootstrapData | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  getPlayer: (id: number) => Player | undefined;
  getTeam: (id: number) => Team | undefined;
}

export function useBootstrap(): UseBootstrapReturn {
  const [data, setData] = useState<BootstrapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getBootstrap();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch FPL data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getPlayer = useCallback((id: number) => {
    return data?.players.find(p => p.id === id);
  }, [data]);

  const getTeam = useCallback((id: number) => {
    return data?.teams.find(t => t.id === id);
  }, [data]);

  return {
    data,
    loading,
    error,
    refresh: fetchData,
    getPlayer,
    getTeam,
  };
}
