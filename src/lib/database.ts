// Database configuration and setup for weight & balance application
import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Database schema interfaces
export interface LoadingPattern {
  id?: number;
  name: string;
  sequence: string[];
  created_at: Date;
  used_count: number;
  success_rate: number;
  avg_final_cg: number;
  avg_optimization_time: number;
  rating: number; // 1-5 star rating
  tags: string[];
  notes: string;
}

export interface OptimizationHistory {
  id?: number;
  pattern_id: number;
  aircraft_variant: '300ER' | '200LR';
  method: 'manual' | 'basic' | 'PSO' | 'ILP';
  initial_weights: { position: string; weight: number }[];
  final_weights: { position: string; weight: number }[];
  initial_cg: number;
  final_cg: number;
  optimization_time: number;
  envelope_violations: number;
  success: boolean;
  created_at: Date;
  fuel_weight: number;
  total_weight: number;
  cg_improvement: number;
  user_rating?: number;
  notes?: string;
}

export interface PatternRanking {
  id?: number;
  pattern_id: number;
  rank: number;
  score: number;
  success_rate: number;
  avg_cg_position: number;
  avg_optimization_time: number;
  total_uses: number;
  last_used: Date;
  performance_metrics: {
    envelope_compliance: number;
    fuel_efficiency: number;
    loading_speed: number;
    versatility: number;
  };
}

export interface CustomPalletPosition {
  id?: number;
  code: string;
  name: string;
  moment_arm: number;
  pallet_type: string;
  created_at: Date;
  used_count: number;
  notes: string;
}

export interface CustomPalletStyle {
  id?: number;
  name: string;
  description: string;
  max_weight: number;
  dimensions: string;
  moment_multiplier: number;
  category: string;
  created_at: Date;
  used_count: number;
  notes: string;
}

// IndexedDB Schema
interface WeightBalanceDB extends DBSchema {
  loading_patterns: {
    key: number;
    value: LoadingPattern;
    indexes: { 'by-name': string; 'by-rating': number; 'by-usage': number };
  };
  optimization_history: {
    key: number;
    value: OptimizationHistory;
    indexes: { 'by-pattern': number; 'by-method': string; 'by-date': Date; 'by-success': boolean };
  };
  pattern_rankings: {
    key: number;
    value: PatternRanking;
    indexes: { 'by-rank': number; 'by-score': number; 'by-pattern': number };
  };
  custom_positions: {
    key: number;
    value: CustomPalletPosition;
    indexes: { 'by-code': string; 'by-usage': number };
  };
  custom_pallet_styles: {
    key: number;
    value: CustomPalletStyle;
    indexes: { 'by-name': string; 'by-usage': number };
  };
}

class WeightBalanceDatabase {
  private db: IDBPDatabase<WeightBalanceDB> | null = null;
  
  async init(): Promise<void> {
    this.db = await openDB<WeightBalanceDB>('weight-balance-db', 1, {
      upgrade(db) {
        // Loading patterns store
        if (!db.objectStoreNames.contains('loading_patterns')) {
          const patternStore = db.createObjectStore('loading_patterns', {
            keyPath: 'id',
            autoIncrement: true
          });
          patternStore.createIndex('by-name', 'name');
          patternStore.createIndex('by-rating', 'rating');
          patternStore.createIndex('by-usage', 'used_count');
        }

        // Optimization history store
        if (!db.objectStoreNames.contains('optimization_history')) {
          const historyStore = db.createObjectStore('optimization_history', {
            keyPath: 'id',
            autoIncrement: true
          });
          historyStore.createIndex('by-pattern', 'pattern_id');
          historyStore.createIndex('by-method', 'method');
          historyStore.createIndex('by-date', 'created_at');
          historyStore.createIndex('by-success', 'success');
        }

        // Pattern rankings store
        if (!db.objectStoreNames.contains('pattern_rankings')) {
          const rankingStore = db.createObjectStore('pattern_rankings', {
            keyPath: 'id',
            autoIncrement: true
          });
          rankingStore.createIndex('by-rank', 'rank');
          rankingStore.createIndex('by-score', 'score');
          rankingStore.createIndex('by-pattern', 'pattern_id');
        }

        // Custom positions store
        if (!db.objectStoreNames.contains('custom_positions')) {
          const positionStore = db.createObjectStore('custom_positions', {
            keyPath: 'id',
            autoIncrement: true
          });
          positionStore.createIndex('by-code', 'code');
          positionStore.createIndex('by-usage', 'used_count');
        }

        // Custom pallet styles store
        if (!db.objectStoreNames.contains('custom_pallet_styles')) {
          const styleStore = db.createObjectStore('custom_pallet_styles', {
            keyPath: 'id',
            autoIncrement: true
          });
          styleStore.createIndex('by-name', 'name');
          styleStore.createIndex('by-usage', 'used_count');
        }
      }
    });
  }

  // Loading Pattern Methods
  async saveLoadingPattern(pattern: Omit<LoadingPattern, 'id'>): Promise<number> {
    if (!this.db) await this.init();
    const id = await this.db!.add('loading_patterns', {
      ...pattern,
      created_at: new Date()
    });
    return id;
  }

  async getLoadingPatterns(): Promise<LoadingPattern[]> {
    if (!this.db) await this.init();
    return await this.db!.getAll('loading_patterns');
  }

  async getLoadingPatternById(id: number): Promise<LoadingPattern | undefined> {
    if (!this.db) await this.init();
    return await this.db!.get('loading_patterns', id);
  }

  async updateLoadingPattern(id: number, updates: Partial<LoadingPattern>): Promise<void> {
    if (!this.db) await this.init();
    const existing = await this.db!.get('loading_patterns', id);
    if (existing) {
      await this.db!.put('loading_patterns', { ...existing, ...updates });
    }
  }

  async deleteLoadingPattern(id: number): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.delete('loading_patterns', id);
  }

  // Optimization History Methods
  async saveOptimizationHistory(history: Omit<OptimizationHistory, 'id'>): Promise<number> {
    if (!this.db) await this.init();
    const id = await this.db!.add('optimization_history', {
      ...history,
      created_at: new Date()
    });
    
    // Update pattern usage statistics
    await this.updatePatternUsage(history.pattern_id, history.success);
    
    return id;
  }

  async getOptimizationHistory(patternId?: number): Promise<OptimizationHistory[]> {
    if (!this.db) await this.init();
    
    if (patternId) {
      return await this.db!.getAllFromIndex('optimization_history', 'by-pattern', patternId);
    }
    
    return await this.db!.getAll('optimization_history');
  }

  async getOptimizationStats(patternId: number): Promise<{
    totalUses: number;
    successRate: number;
    avgCGImprovement: number;
    avgOptimizationTime: number;
    methodDistribution: Record<string, number>;
  }> {
    if (!this.db) await this.init();
    
    const history = await this.db!.getAllFromIndex('optimization_history', 'by-pattern', patternId);
    
    if (history.length === 0) {
      return {
        totalUses: 0,
        successRate: 0,
        avgCGImprovement: 0,
        avgOptimizationTime: 0,
        methodDistribution: {}
      };
    }

    const successCount = history.filter(h => h.success).length;
    const avgCGImprovement = history.reduce((sum, h) => sum + h.cg_improvement, 0) / history.length;
    const avgOptimizationTime = history.reduce((sum, h) => sum + h.optimization_time, 0) / history.length;
    
    const methodDistribution = history.reduce((acc, h) => {
      acc[h.method] = (acc[h.method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalUses: history.length,
      successRate: successCount / history.length,
      avgCGImprovement,
      avgOptimizationTime,
      methodDistribution
    };
  }

  // Pattern Ranking Methods
  async updatePatternRanking(patternId: number): Promise<void> {
    if (!this.db) await this.init();
    
    const stats = await this.getOptimizationStats(patternId);
    const pattern = await this.getLoadingPatternById(patternId);
    
    if (!pattern) return;

    // Calculate comprehensive score
    const score = this.calculatePatternScore(stats, pattern);
    
    const ranking: Omit<PatternRanking, 'id'> = {
      pattern_id: patternId,
      rank: 0, // Will be calculated after all patterns are scored
      score,
      success_rate: stats.successRate,
      avg_cg_position: stats.avgCGImprovement,
      avg_optimization_time: stats.avgOptimizationTime,
      total_uses: stats.totalUses,
      last_used: new Date(),
      performance_metrics: {
        envelope_compliance: stats.successRate,
        fuel_efficiency: Math.max(0, 100 - Math.abs(stats.avgCGImprovement - 25)), // Closer to 25% MAC is better
        loading_speed: Math.max(0, 100 - (stats.avgOptimizationTime / 1000)), // Faster is better
        versatility: Math.min(100, Object.keys(stats.methodDistribution).length * 25) // More methods used = more versatile
      }
    };

    // Update or create ranking
    const existingRanking = await this.db!.getAll('pattern_rankings');
    const existing = existingRanking.find(r => r.pattern_id === patternId);
    
    if (existing) {
      await this.db!.put('pattern_rankings', { ...existing, ...ranking });
    } else {
      await this.db!.add('pattern_rankings', ranking);
    }

    // Recalculate all ranks
    await this.recalculateRanks();
  }

  private calculatePatternScore(stats: any, pattern: LoadingPattern): number {
    const weights = {
      successRate: 0.3,
      usageCount: 0.2,
      cgOptimization: 0.2,
      speed: 0.15,
      userRating: 0.15
    };

    return (
      (stats.successRate * 100 * weights.successRate) +
      (Math.min(stats.totalUses, 100) * weights.usageCount) +
      (Math.max(0, 100 - Math.abs(stats.avgCGImprovement)) * weights.cgOptimization) +
      (Math.max(0, 100 - (stats.avgOptimizationTime / 1000)) * weights.speed) +
      (pattern.rating * 20 * weights.userRating)
    );
  }

  private async recalculateRanks(): Promise<void> {
    if (!this.db) await this.init();
    
    const rankings = await this.db!.getAll('pattern_rankings');
    const sortedRankings = rankings.sort((a, b) => b.score - a.score);
    
    for (let i = 0; i < sortedRankings.length; i++) {
      const ranking = sortedRankings[i];
      await this.db!.put('pattern_rankings', { ...ranking, rank: i + 1 });
    }
  }

  async getTopPatterns(limit: number = 10): Promise<PatternRanking[]> {
    if (!this.db) await this.init();
    
    const rankings = await this.db!.getAll('pattern_rankings');
    return rankings
      .sort((a, b) => a.rank - b.rank)
      .slice(0, limit);
  }

  private async updatePatternUsage(patternId: number, success: boolean): Promise<void> {
    const pattern = await this.getLoadingPatternById(patternId);
    if (!pattern) return;

    const newUsedCount = pattern.used_count + 1;
    const newSuccessRate = success 
      ? (pattern.success_rate * pattern.used_count + 1) / newUsedCount
      : (pattern.success_rate * pattern.used_count) / newUsedCount;

    await this.updateLoadingPattern(patternId, {
      used_count: newUsedCount,
      success_rate: newSuccessRate
    });
  }

  // Custom Position Methods
  async saveCustomPosition(position: Omit<CustomPalletPosition, 'id'>): Promise<number> {
    if (!this.db) await this.init();
    return await this.db!.add('custom_positions', {
      ...position,
      created_at: new Date()
    });
  }

  async getCustomPositions(): Promise<CustomPalletPosition[]> {
    if (!this.db) await this.init();
    return await this.db!.getAll('custom_positions');
  }

  async updateCustomPosition(id: number, updates: Partial<CustomPalletPosition>): Promise<void> {
    if (!this.db) await this.init();
    const existing = await this.db!.get('custom_positions', id);
    if (existing) {
      await this.db!.put('custom_positions', { ...existing, ...updates });
    }
  }

  async deleteCustomPosition(id: number): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.delete('custom_positions', id);
  }

  // Custom Pallet Style Methods
  async saveCustomPalletStyle(style: Omit<CustomPalletStyle, 'id'>): Promise<number> {
    if (!this.db) await this.init();
    return await this.db!.add('custom_pallet_styles', {
      ...style,
      created_at: new Date()
    });
  }

  async getCustomPalletStyles(): Promise<CustomPalletStyle[]> {
    if (!this.db) await this.init();
    return await this.db!.getAll('custom_pallet_styles');
  }

  async updateCustomPalletStyle(id: number, updates: Partial<CustomPalletStyle>): Promise<void> {
    if (!this.db) await this.init();
    const existing = await this.db!.get('custom_pallet_styles', id);
    if (existing) {
      await this.db!.put('custom_pallet_styles', { ...existing, ...updates });
    }
  }

  async deleteCustomPalletStyle(id: number): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.delete('custom_pallet_styles', id);
  }

  // Analytics Methods
  async getAnalytics(): Promise<{
    totalPatterns: number;
    totalOptimizations: number;
    avgSuccessRate: number;
    mostUsedMethod: string;
    bestPerformingPattern: LoadingPattern | null;
    recentActivity: OptimizationHistory[];
  }> {
    if (!this.db) await this.init();

    const patterns = await this.getLoadingPatterns();
    const history = await this.getOptimizationHistory();
    const rankings = await this.getTopPatterns(1);

    const successCount = history.filter(h => h.success).length;
    const avgSuccessRate = history.length > 0 ? successCount / history.length : 0;

    const methodCounts = history.reduce((acc, h) => {
      acc[h.method] = (acc[h.method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostUsedMethod = Object.entries(methodCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'none';

    const bestPerformingPattern = rankings.length > 0 
      ? await this.getLoadingPatternById(rankings[0].pattern_id) || null
      : null;

    const recentActivity = history
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      .slice(0, 10);

    return {
      totalPatterns: patterns.length,
      totalOptimizations: history.length,
      avgSuccessRate,
      mostUsedMethod,
      bestPerformingPattern,
      recentActivity
    };
  }
}

// Export singleton instance
export const weightBalanceDB = new WeightBalanceDatabase();