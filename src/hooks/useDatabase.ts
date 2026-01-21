// React hooks for database operations
import { useState, useEffect, useCallback } from 'react';
import { 
  weightBalanceDB, 
  LoadingPattern, 
  OptimizationHistory, 
  PatternRanking, 
  CustomPalletPosition,
  CustomPalletStyle
} from '@/lib/database';

// Hook for managing loading patterns
export function useLoadingPatterns() {
  const [patterns, setPatterns] = useState<LoadingPattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPatterns = useCallback(async () => {
    try {
      setLoading(true);
      const loadedPatterns = await weightBalanceDB.getLoadingPatterns();
      setPatterns(loadedPatterns);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load patterns');
    } finally {
      setLoading(false);
    }
  }, []);

  const savePattern = useCallback(async (pattern: Omit<LoadingPattern, 'id'>) => {
    try {
      const id = await weightBalanceDB.saveLoadingPattern(pattern);
      await loadPatterns(); // Refresh the list
      return id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save pattern');
      throw err;
    }
  }, [loadPatterns]);

  const updatePattern = useCallback(async (id: number, updates: Partial<LoadingPattern>) => {
    try {
      await weightBalanceDB.updateLoadingPattern(id, updates);
      await loadPatterns(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update pattern');
      throw err;
    }
  }, [loadPatterns]);

  const deletePattern = useCallback(async (id: number) => {
    try {
      await weightBalanceDB.deleteLoadingPattern(id);
      await loadPatterns(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete pattern');
      throw err;
    }
  }, [loadPatterns]);

  const ratePattern = useCallback(async (id: number, rating: number) => {
    try {
      await updatePattern(id, { rating });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rate pattern');
      throw err;
    }
  }, [updatePattern]);

  useEffect(() => {
    loadPatterns();
  }, [loadPatterns]);

  return {
    patterns,
    loading,
    error,
    savePattern,
    updatePattern,
    deletePattern,
    ratePattern,
    refreshPatterns: loadPatterns
  };
}

// Hook for optimization history
export function useOptimizationHistory(patternId?: number) {
  const [history, setHistory] = useState<OptimizationHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      const loadedHistory = await weightBalanceDB.getOptimizationHistory(patternId);
      setHistory(loadedHistory);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }, [patternId]);

  const saveOptimization = useCallback(async (optimization: Omit<OptimizationHistory, 'id'>) => {
    try {
      const id = await weightBalanceDB.saveOptimizationHistory(optimization);
      await loadHistory(); // Refresh the list
      return id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save optimization');
      throw err;
    }
  }, [loadHistory]);

  const getStats = useCallback(async (patternId: number) => {
    try {
      return await weightBalanceDB.getOptimizationStats(patternId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get stats');
      throw err;
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return {
    history,
    loading,
    error,
    saveOptimization,
    getStats,
    refreshHistory: loadHistory
  };
}

// Hook for pattern rankings
export function usePatternRankings() {
  const [rankings, setRankings] = useState<PatternRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRankings = useCallback(async () => {
    try {
      setLoading(true);
      const loadedRankings = await weightBalanceDB.getTopPatterns(20);
      setRankings(loadedRankings);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load rankings');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateRanking = useCallback(async (patternId: number) => {
    try {
      await weightBalanceDB.updatePatternRanking(patternId);
      await loadRankings(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update ranking');
      throw err;
    }
  }, [loadRankings]);

  useEffect(() => {
    loadRankings();
  }, [loadRankings]);

  return {
    rankings,
    loading,
    error,
    updateRanking,
    refreshRankings: loadRankings
  };
}

// Hook for custom positions
export function useCustomPositions() {
  const [positions, setPositions] = useState<CustomPalletPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPositions = useCallback(async () => {
    try {
      setLoading(true);
      const loadedPositions = await weightBalanceDB.getCustomPositions();
      setPositions(loadedPositions);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load positions');
    } finally {
      setLoading(false);
    }
  }, []);

  const savePosition = useCallback(async (position: Omit<CustomPalletPosition, 'id'>) => {
    try {
      const id = await weightBalanceDB.saveCustomPosition(position);
      await loadPositions(); // Refresh the list
      return id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save position');
      throw err;
    }
  }, [loadPositions]);

  const updatePosition = useCallback(async (id: number, updates: Partial<CustomPalletPosition>) => {
    try {
      await weightBalanceDB.updateCustomPosition(id, updates);
      await loadPositions(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update position');
      throw err;
    }
  }, [loadPositions]);

  const deletePosition = useCallback(async (id: number) => {
    try {
      await weightBalanceDB.deleteCustomPosition(id);
      await loadPositions(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete position');
      throw err;
    }
  }, [loadPositions]);

  useEffect(() => {
    loadPositions();
  }, [loadPositions]);

  return {
    positions,
    loading,
    error,
    savePosition,
    updatePosition,
    deletePosition,
    refreshPositions: loadPositions
  };
}

// Hook for analytics
export function useAnalytics() {
  const [analytics, setAnalytics] = useState<{
    totalPatterns: number;
    totalOptimizations: number;
    avgSuccessRate: number;
    mostUsedMethod: string;
    bestPerformingPattern: LoadingPattern | null;
    recentActivity: OptimizationHistory[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const loadedAnalytics = await weightBalanceDB.getAnalytics();
      setAnalytics(loadedAnalytics);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  return {
    analytics,
    loading,
    error,
    refreshAnalytics: loadAnalytics
  };
}

// Hook for custom pallet styles
export function useCustomPalletStyles() {
  const [styles, setStyles] = useState<CustomPalletStyle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStyles = useCallback(async () => {
    try {
      setLoading(true);
      const loadedStyles = await weightBalanceDB.getCustomPalletStyles();
      setStyles(loadedStyles);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pallet styles');
    } finally {
      setLoading(false);
    }
  }, []);

  const saveStyle = useCallback(async (style: Omit<CustomPalletStyle, 'id'>) => {
    try {
      const id = await weightBalanceDB.saveCustomPalletStyle(style);
      await loadStyles(); // Refresh the list
      return id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save pallet style');
      throw err;
    }
  }, [loadStyles]);

  const updateStyle = useCallback(async (id: number, updates: Partial<CustomPalletStyle>) => {
    try {
      await weightBalanceDB.updateCustomPalletStyle(id, updates);
      await loadStyles(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update pallet style');
      throw err;
    }
  }, [loadStyles]);

  const deleteStyle = useCallback(async (id: number) => {
    try {
      await weightBalanceDB.deleteCustomPalletStyle(id);
      await loadStyles(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete pallet style');
      throw err;
    }
  }, [loadStyles]);

  useEffect(() => {
    loadStyles();
  }, [loadStyles]);

  return {
    styles,
    loading,
    error,
    saveStyle,
    updateStyle,
    deleteStyle,
    refreshStyles: loadStyles
  };
}