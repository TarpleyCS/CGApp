"use client"

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAnalytics, usePatternRankings } from '@/hooks/useDatabase';

interface AnalyticsDashboardProps {
  onSelectPattern?: (patternId: number) => void;
}

export function AnalyticsDashboard({ onSelectPattern }: AnalyticsDashboardProps) {
  const { analytics, loading: analyticsLoading, error: analyticsError, refreshAnalytics } = useAnalytics();
  const { rankings, loading: rankingsLoading, error: rankingsError, refreshRankings } = usePatternRankings();

  if (analyticsLoading || rankingsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (analyticsError || rankingsError) {
    return (
      <div className="p-4 border border-red-200 rounded-lg bg-red-50">
        <p className="text-red-800">Error loading analytics: {analyticsError || rankingsError}</p>
        <Button 
          onClick={() => { refreshAnalytics(); refreshRankings(); }} 
          variant="outline" 
          size="sm" 
          className="mt-2"
        >
          Retry
        </Button>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No analytics data available</p>
      </div>
    );
  }

  const getMethodBadgeColor = (method: string) => {
    switch (method) {
      case 'PSO': return 'bg-red-100 text-red-800';
      case 'ILP': return 'bg-indigo-100 text-indigo-800';
      case 'basic': return 'bg-green-100 text-green-800';
      case 'manual': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 0.8) return 'text-green-600';
    if (rate >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Patterns</p>
                <p className="text-2xl font-bold">{analytics.totalPatterns}</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-sm">📊</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Optimizations</p>
                <p className="text-2xl font-bold">{analytics.totalOptimizations}</p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm">⚡</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className={`text-2xl font-bold ${getSuccessRateColor(analytics.avgSuccessRate)}`}>
                  {formatPercentage(analytics.avgSuccessRate)}
                </p>
              </div>
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 text-sm">🎯</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Preferred Method</p>
                <Badge className={`${getMethodBadgeColor(analytics.mostUsedMethod)} text-xs`}>
                  {analytics.mostUsedMethod.toUpperCase()}
                </Badge>
              </div>
              <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-600 text-sm">🔧</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Patterns */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top Performing Patterns</CardTitle>
        </CardHeader>
        <CardContent>
          {rankings.length === 0 ? (
            <p className="text-gray-600 text-center py-4">No patterns ranked yet</p>
          ) : (
            <div className="space-y-3">
              {rankings.slice(0, 10).map((ranking) => (
                <div
                  key={ranking.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => onSelectPattern?.(ranking.pattern_id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-sm font-bold">
                      {ranking.rank}
                    </div>
                    <div>
                      <p className="font-medium">Pattern #{ranking.pattern_id}</p>
                      <p className="text-sm text-gray-600">
                        {ranking.total_uses} uses • {formatPercentage(ranking.success_rate)} success
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">Score: {ranking.score.toFixed(1)}</p>
                    <div className="flex gap-1 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        CG: {ranking.avg_cg_position.toFixed(1)}%
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {ranking.avg_optimization_time.toFixed(0)}ms
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Best Performing Pattern Details */}
      {analytics.bestPerformingPattern && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Best Performing Pattern</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">{analytics.bestPerformingPattern.name}</h4>
                <p className="text-sm text-gray-600 mb-3">{analytics.bestPerformingPattern.notes}</p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Uses:</span>
                    <span className="text-sm font-medium">{analytics.bestPerformingPattern.used_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Success Rate:</span>
                    <span className={`text-sm font-medium ${getSuccessRateColor(analytics.bestPerformingPattern.success_rate)}`}>
                      {formatPercentage(analytics.bestPerformingPattern.success_rate)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Rating:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`text-sm ${star <= analytics.bestPerformingPattern!.rating ? 'text-yellow-500' : 'text-gray-300'}`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h5 className="font-medium mb-2">Loading Sequence</h5>
                <div className="flex flex-wrap gap-1">
                  {analytics.bestPerformingPattern.sequence.slice(0, 12).map((pos, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {pos}
                    </Badge>
                  ))}
                  {analytics.bestPerformingPattern.sequence.length > 12 && (
                    <Badge variant="outline" className="text-xs">
                      +{analytics.bestPerformingPattern.sequence.length - 12} more
                    </Badge>
                  )}
                </div>
                <div className="mt-3">
                  <div className="flex flex-wrap gap-1">
                    {analytics.bestPerformingPattern.tags.map((tag, index) => (
                      <Badge key={index} className="text-xs bg-blue-100 text-blue-800">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.recentActivity.length === 0 ? (
            <p className="text-gray-600 text-center py-4">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {analytics.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${activity.success ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <div>
                      <p className="font-medium">
                        {activity.method.toUpperCase()} optimization
                      </p>
                      <p className="text-sm text-gray-600">
                        Pattern #{activity.pattern_id} • {activity.aircraft_variant}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">
                      CG: {activity.initial_cg.toFixed(1)}% → {activity.final_cg.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}