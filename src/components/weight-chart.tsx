import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Area, ComposedChart } from 'recharts';
import { formatWeight } from '@/lib/units';

interface EnvelopePoint {
  cg: number;
  weight: number;
}

interface WeightChartProps {
  variant?: '200LR' | '300ER';
  loadingPoints?: EnvelopePoint[];
  opportunityWindow?: EnvelopePoint[];
  units?: 'LB' | 'KG';
  palletLabels?: string[];
}

// Envelope data for both variants
const ENVELOPES = {
  '300ER': {
    basicCGGrid: [
      { cg: 14.0, weight: 300000 },
      { cg: 14.0, weight: 460000 },
      { cg: 14.7, weight: 492000 },
      { cg: 18.0, weight: 722300 },
      { cg: 19.7, weight: 752000 },
      { cg: 23.0, weight: 758143 },
      { cg: 26.0, weight: 763815 },
      { cg: 28.2, weight: 768000 },
      { cg: 30.6, weight: 768000 },
      { cg: 37.8, weight: 752000 },
      { cg: 41.2, weight: 705300 },
      { cg: 44.0, weight: 609000 },
      { cg: 34.9, weight: 347000 },
      { cg: 23.2, weight: 300000 },
      { cg: 14.0, weight: 300000 }
    ],
    doNotOperate: [
      { cg: 44.0, weight: 609000 },
      { cg: 44.0, weight: 471000 },
      { cg: 39.1, weight: 377200 },
      { cg: 34.9, weight: 347000 }
    ],
    maxLandingWeight: [
      { cg: 15.0, weight: 545000 },
      { cg: 44.0, weight: 545000 }
    ],
    maxZeroFuelWeight: [
      { cg: 15.0, weight: 529000 },
      { cg: 16.1, weight: 529000 },
      { cg: 44.0, weight: 529000 }
    ],
    maxTaxiWeight: [
      { cg: 28.2, weight: 768000 },
      { cg: 30.6, weight: 768000 }
    ],
    altFwdCGLimitTakeoff1: [
      { cg: 24.0, weight: 300000 },
      { cg: 24.0, weight: 766000 }
    ],
    altFwdCGLimitTakeoff2: [
      { cg: 27.0, weight: 300000 },
      { cg: 27.0, weight: 766000 }
    ],
    cumulativeLoadCheck1: [
      { cg: 14.0, weight: 420635 },
      { cg: 28.0, weight: 543000 }
    ],
    cumulativeLoadCheck2: [
      { cg: 16.7, weight: 618522 },
      { cg: 40.4, weight: 716694 }
    ],
    OEW: { cg: 21.4, weight: 311787 }
  },
  '200LR': {
    basicCGGrid: [
      { cg: 14.0, weight: 300000 },
      { cg: 14.0, weight: 460000 },
      { cg: 14.7, weight: 492000 },
      { cg: 15.7, weight: 543000 },
      { cg: 16.1, weight: 570000 },
      { cg: 18.0, weight: 722300 },
      { cg: 18.5, weight: 730608 },
      { cg: 26.0, weight: 763815 },
      { cg: 28.2, weight: 768000 },
      { cg: 30.6, weight: 768000 },
      { cg: 37.8, weight: 752000 },
      { cg: 41.2, weight: 705300 },
      { cg: 44.0, weight: 609000 },
      { cg: 34.9, weight: 347000 },
      { cg: 26.0, weight: 310050 },
      { cg: 23.2, weight: 300000 },
      { cg: 14.0, weight: 300000 }
    ],
    doNotOperate: [
      { cg: 44.0, weight: 609000 },
      { cg: 44.0, weight: 471100 },
      { cg: 43.5, weight: 461000 },
      { cg: 39.1, weight: 377200 },
      { cg: 34.9, weight: 347000 }
    ],
    maxLandingWeight: [
      { cg: 16.1, weight: 570000 },
      { cg: 44.0, weight: 570000 }
    ],
    maxZeroFuelWeight: [
      { cg: 15.7, weight: 543000 },
      { cg: 44.0, weight: 543000 }
    ],
    maxTaxiWeight: [
      { cg: 28.2, weight: 768000 },
      { cg: 30.6, weight: 768000 }
    ],
    maxTakeoffWeight: [
      { cg: 27.2, weight: 766000 },
      { cg: 31.5, weight: 766000 }
    ],
    altCGLimitTakeoff1: [
      { cg: 23.0, weight: 300000 },
      { cg: 23.0, weight: 800000 }
    ],
    altCGLimitTakeoff2: [
      { cg: 26.0, weight: 300000 },
      { cg: 26.0, weight: 800000 }
    ],
    cumulativeLoadCheck1: [
      { cg: 14.0, weight: 420635 },
      { cg: 28.0, weight: 543000 }
    ],
    cumulativeLoadCheck2: [
      { cg: 16.7, weight: 618522 },
      { cg: 40.4, weight: 716694 }
    ],
    OEW: { cg: 21.4, weight: 311787 }
  }
};

export function WeightChart({ variant = '300ER', loadingPoints, opportunityWindow, units = 'LB', palletLabels = [] }: WeightChartProps) {
  // State for draggable labels
  const [labelPositions, setLabelPositions] = useState<{ [key: string]: { x: number, y: number } }>({});
  const [isDragging, setIsDragging] = useState(false);
  const [draggedLabelId, setDraggedLabelId] = useState<string | null>(null);
  const [renderKey, setRenderKey] = useState(0);
  const chartRef = useRef<HTMLDivElement>(null);

  // Helper function to convert weights
  const convertWeight = useCallback((weight: number) => {
    return units === 'KG' ? Math.round(weight * 0.453592) : weight;
  }, [units]);


  // Convert envelope data to selected units
  const envelopeData = {
    ...ENVELOPES[variant],
    basicCGGrid: ENVELOPES[variant].basicCGGrid.map(point => ({
      ...point,
      weight: convertWeight(point.weight)
    })),
    doNotOperate: ENVELOPES[variant].doNotOperate.map(point => ({
      ...point,
      weight: convertWeight(point.weight)
    })),
    maxLandingWeight: ENVELOPES[variant].maxLandingWeight.map(point => ({
      ...point,
      weight: convertWeight(point.weight)
    })),
    maxZeroFuelWeight: ENVELOPES[variant].maxZeroFuelWeight.map(point => ({
      ...point,
      weight: convertWeight(point.weight)
    })),
    maxTaxiWeight: ENVELOPES[variant].maxTaxiWeight.map(point => ({
      ...point,
      weight: convertWeight(point.weight)
    })),
    cumulativeLoadCheck1: ENVELOPES[variant].cumulativeLoadCheck1.map(point => ({
      ...point,
      weight: convertWeight(point.weight)
    })),
    cumulativeLoadCheck2: ENVELOPES[variant].cumulativeLoadCheck2.map(point => ({
      ...point,
      weight: convertWeight(point.weight)
    })),
    ...(variant === '300ER' ? {
      altFwdCGLimitTakeoff1: ENVELOPES['300ER'].altFwdCGLimitTakeoff1.map(point => ({
        ...point,
        weight: convertWeight(point.weight)
      })),
      altFwdCGLimitTakeoff2: ENVELOPES['300ER'].altFwdCGLimitTakeoff2.map(point => ({
        ...point,
        weight: convertWeight(point.weight)
      }))
    } : {
      maxTakeoffWeight: ENVELOPES['200LR'].maxTakeoffWeight.map(point => ({
        ...point,
        weight: convertWeight(point.weight)
      })),
      altCGLimitTakeoff1: ENVELOPES['200LR'].altCGLimitTakeoff1.map(point => ({
        ...point,
        weight: convertWeight(point.weight)
      })),
      altCGLimitTakeoff2: ENVELOPES['200LR'].altCGLimitTakeoff2.map(point => ({
        ...point,
        weight: convertWeight(point.weight)
      }))
    }),
    OEW: {
      ...ENVELOPES[variant].OEW,
      weight: convertWeight(ENVELOPES[variant].OEW.weight)
    }
  };
  // Convert loading points to selected units
  const convertedLoadingPoints = Array.isArray(loadingPoints) ?
    loadingPoints.map(point => ({
      ...point,
      weight: convertWeight(point.weight)
    })) : [];

  // loadingPoints from calculateCumulativeWeights already includes OEW as the first point
  const loadingLine = convertedLoadingPoints.length > 0 ?
    convertedLoadingPoints :
    [envelopeData.OEW];

  // Process opportunity window for final weight CG range visualization
  const processOpportunityWindow = () => {
    if (!opportunityWindow || opportunityWindow.length !== 2) return null;

    // Should have exactly 2 points: min and max CG at final weight
    const sortedPoints = [...opportunityWindow].sort((a, b) => a.cg - b.cg);
    const minPoint = sortedPoints[0];
    const maxPoint = sortedPoints[1];

    if (minPoint.weight !== maxPoint.weight) return null; // Safety check

    // Create a vertical line/bar showing the CG range at final weight
    const finalWeight = convertWeight(minPoint.weight); // Convert weight to selected units
    const minCG = minPoint.cg;
    const maxCG = maxPoint.cg;

    // Create data for a filled area between min and max CG at the final weight
    return {
      minCG,
      maxCG,
      weight: finalWeight,
      cgRange: maxCG - minCG
    };
  };

  const opportunityData = processOpportunityWindow();

  // Create polygon data for cumulative load checks
  const createCumulativeLoadPolygons = () => {
    const envelope = envelopeData.basicCGGrid;

    // Cumulative Load Check 1 polygon
    const check1Line = envelopeData.cumulativeLoadCheck1;
    const check1Polygon = [
      ...check1Line,
      // Find envelope points that close the polygon from the end of the line back to the start
      ...envelope.filter(point => point.cg >= check1Line[0].cg && point.cg <= check1Line[1].cg && point.weight >= check1Line[1].weight).reverse(),
      check1Line[0] // Close the polygon
    ];

    // Cumulative Load Check 2 polygon
    const check2Line = envelopeData.cumulativeLoadCheck2;
    const check2Polygon = [
      ...check2Line,
      // Find envelope points that close the polygon from the end of the line back to the start
      ...envelope.filter(point => point.cg >= check2Line[0].cg && point.cg <= check2Line[1].cg && point.weight >= check2Line[1].weight).reverse(),
      check2Line[0] // Close the polygon
    ];

    return { check1: check1Polygon, check2: check2Polygon };
  };

  const loadCheckPolygons = createCumulativeLoadPolygons();

  // Point-in-polygon test function
  const isPointInPolygon = (point: { cg: number; weight: number }, polygon: EnvelopePoint[]) => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      if (((polygon[i].weight > point.weight) !== (polygon[j].weight > point.weight)) &&
        (point.cg < (polygon[j].cg - polygon[i].cg) * (point.weight - polygon[i].weight) / (polygon[j].weight - polygon[i].weight) + polygon[i].cg)) {
        inside = !inside;
      }
    }
    return inside;
  };

  // Check cumulative load requirements for the final loading point
  const checkCumulativeLoadRequirements = () => {
    if (!loadingPoints || loadingPoints.length === 0) {
      return { check1Required: false, check2Required: false, finalPoint: null };
    }

    const finalPoint = loadingPoints[loadingPoints.length - 1];
    const finalPointConverted = { cg: finalPoint.cg, weight: convertWeight(finalPoint.weight) };

    const check1Required = loadCheckPolygons.check1.length > 0 && isPointInPolygon(finalPointConverted, loadCheckPolygons.check1);
    const check2Required = loadCheckPolygons.check2.length > 0 && isPointInPolygon(finalPointConverted, loadCheckPolygons.check2);

    return { check1Required, check2Required, finalPoint: finalPointConverted };
  };

  const cumulativeLoadStatus = checkCumulativeLoadRequirements();

  // Convert data coordinates to screen coordinates
  const dataToScreen = useCallback((cg: number, weight: number) => {
    if (!chartRef.current) return { x: 0, y: 0 };

    const cartesianGrid = chartRef.current.querySelector('.recharts-cartesian-grid');
    if (!cartesianGrid) return { x: 0, y: 0 };

    const containerRect = chartRef.current.getBoundingClientRect();
    const gridRect = cartesianGrid.getBoundingClientRect();

    if (gridRect.width === 0 || gridRect.height === 0) {
      return { x: 0, y: 0 };
    }

    const offsetX = gridRect.left - containerRect.left;
    const offsetY = gridRect.top - containerRect.top;
    const chartWidth = gridRect.width;
    const chartHeight = gridRect.height;

    const cgRange = [0, 50];
    const weightRange = [convertWeight(300000), convertWeight(800000)];

    const x = offsetX + ((cg - cgRange[0]) / (cgRange[1] - cgRange[0])) * chartWidth;
    const y = offsetY + ((weightRange[1] - weight) / (weightRange[1] - weightRange[0])) * chartHeight;

    return { x, y };
  }, [convertWeight]);

  // Handle mouse events for dragging labels
  const handleLabelMouseDown = useCallback((labelId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    setDraggedLabelId(labelId);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !draggedLabelId || !chartRef.current) return;

    const rect = chartRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setLabelPositions(prev => ({
      ...prev,
      [draggedLabelId]: { x, y }
    }));
  }, [isDragging, draggedLabelId]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDraggedLabelId(null);
  }, []);

  // Reset labels function
  const resetLabels = () => {
    setLabelPositions({});
    setIsDragging(false);
    setDraggedLabelId(null);
  };

  // Handle resize with complete rerender
  useEffect(() => {
    const handleResize = () => {
      // Clear label positions and force complete rerender
      setLabelPositions({});
      setRenderKey(prev => prev + 1);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  // Add specific envelope point labels positioned outside like Boeing reference
  const outsideEnvelopeLabels = [];

  if (variant === '200LR') {
    // Key envelope points for 200LR positioned outside
    outsideEnvelopeLabels.push(
      // Top area labels
      { cg: 28.2, weight: convertWeight(768000), label: `${formatWeight(convertWeight(768000), units)}\nat 28.2%`, position: 'top' },
      { cg: 30.6, weight: convertWeight(768000), label: `${formatWeight(convertWeight(768000), units)}\nat 30.6%`, position: 'top' },
      { cg: 37.8, weight: convertWeight(752000), label: `${formatWeight(convertWeight(752000), units)}\nat 37.8%`, position: 'right' },

      // Right side labels
      { cg: 41.2, weight: convertWeight(705300), label: `${formatWeight(convertWeight(705300), units)}\nat 41.2%`, position: 'right' },
      { cg: 44.0, weight: convertWeight(609000), label: `${formatWeight(convertWeight(609000), units)}\nat 44.0%`, position: 'right' },

      // Bottom right
      { cg: 34.9, weight: convertWeight(347000), label: `${formatWeight(convertWeight(347000), units)}\nat 34.9%`, position: 'bottom' },

      // Left side labels
      { cg: 14.0, weight: convertWeight(460000), label: `${formatWeight(convertWeight(460000), units)}\nat 14.0%`, position: 'left' },
      { cg: 14.7, weight: convertWeight(492000), label: `${formatWeight(convertWeight(492000), units)}\nat 14.7%`, position: 'left' },
      { cg: 15.7, weight: convertWeight(543000), label: `${formatWeight(convertWeight(543000), units)}\nat 15.7%`, position: 'left' },
      { cg: 18.0, weight: convertWeight(722300), label: `${formatWeight(convertWeight(722300), units)}\nat 18.0%`, position: 'left' },
      { cg: 18.5, weight: convertWeight(730608), label: `${formatWeight(convertWeight(730608), units)}\nat 18.5%`, position: 'left' }
    );
  } else {
    // Key envelope points for 300ER positioned outside  
    outsideEnvelopeLabels.push(
      // Similar positioning for 300ER
      { cg: 28.2, weight: convertWeight(768000), label: `${formatWeight(convertWeight(768000), units)}\nat 28.2%`, position: 'top' },
      { cg: 30.6, weight: convertWeight(768000), label: `${formatWeight(convertWeight(768000), units)}\nat 30.6%`, position: 'top' },
      { cg: 37.8, weight: convertWeight(752000), label: `${formatWeight(convertWeight(752000), units)}\nat 37.8%`, position: 'right' },
      { cg: 41.2, weight: convertWeight(705300), label: `${formatWeight(convertWeight(705300), units)}\nat 41.2%`, position: 'right' },
      { cg: 44.0, weight: convertWeight(609000), label: `${formatWeight(convertWeight(609000), units)}\nat 44.0%`, position: 'right' },
      { cg: 34.9, weight: convertWeight(347000), label: `${formatWeight(convertWeight(347000), units)}\nat 34.9%`, position: 'bottom' },
      { cg: 14.0, weight: convertWeight(460000), label: `${formatWeight(convertWeight(460000), units)}\nat 14.0%`, position: 'left' },
      { cg: 18.0, weight: convertWeight(722300), label: `${formatWeight(convertWeight(722300), units)}\nat 18.0%`, position: 'left' }
    );
  }

  // Keep envelope data without labels for the line itself
  const labeledEnvelopeData = envelopeData.basicCGGrid.map((point) => {
    return { ...point, label: '' };
  });

  // Add labels to max landing weight
  const labeledMaxLandingWeight = envelopeData.maxLandingWeight.map((point, index) => {
    let label = '';
    if (index === 0) {
      label = `MAXIMUM LANDING\nWEIGHT - ${formatWeight(point.weight, units)}`;
    }
    return { ...point, label };
  });

  // Add labels to max zero fuel weight
  const labeledMaxZeroFuelWeight = envelopeData.maxZeroFuelWeight.map((point, index) => {
    let label = '';
    if (index === 0) {
      label = `MAXIMUM ZERO FUEL\nWEIGHT - ${formatWeight(point.weight, units)}`;
    }
    return { ...point, label };
  });



  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <div className="font-bold text-lg">Boeing 777-{variant} Weight and Balance Envelope</div>
        {Object.keys(labelPositions).length > 0 && (
          <button
            onClick={resetLabels}
            className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded text-gray-700"
          >
            Reset Labels
          </button>
        )}
      </div>
      <div className="text-sm text-gray-600 mb-4">
        Center of Gravity (%MAC) vs Weight ({units.toLowerCase()}) - Operating Limits and Restrictions
        {Object.keys(labelPositions).length > 0 && (
          <span className="text-blue-600 ml-2">• Labels repositioned - Drag to adjust</span>
        )}
        {cumulativeLoadStatus.finalPoint && (
          <div className="mt-2 p-2 bg-gray-50 rounded">
            <div className="font-semibold text-gray-800">Cumulative Load Check Status:</div>
            <div className="text-xs mt-1">
              Final Point: {cumulativeLoadStatus.finalPoint.cg.toFixed(1)}% MAC at {Math.round(cumulativeLoadStatus.finalPoint.weight).toLocaleString()} {units}
            </div>
            {cumulativeLoadStatus.check1Required && (
              <div className="text-orange-600 font-medium text-xs mt-1">
                ⚠️ Cumulative Load Check 1 Required (ZFW Above Threshold)
              </div>
            )}
            {cumulativeLoadStatus.check2Required && (
              <div className="text-orange-600 font-medium text-xs mt-1">
                ⚠️ Cumulative Load Check 2 Required (GW Above Threshold)
              </div>
            )}
            {!cumulativeLoadStatus.check1Required && !cumulativeLoadStatus.check2Required && (
              <div className="text-green-600 font-medium text-xs mt-1">
                ✅ No cumulative load checks required
              </div>
            )}
          </div>
        )}
      </div>
      <div
        key={renderKey}
        className="flex-1 min-h-0 relative"
        ref={chartRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={[]}
            margin={{ top: 20, right: 40, left: 60, bottom: 80 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              type="number"
              dataKey="cg"
              domain={[0, 50]}
              label={{
                value: "Center of Gravity (%MAC)",
                position: "insideBottom",
                offset: -5,
                style: { textAnchor: 'middle', fontWeight: 'bold' }
              }}
              ticks={[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50]}
              allowDataOverflow={true}
            />
            <YAxis
              type="number"
              domain={[
                convertWeight(300000),
                convertWeight(800000)
              ]}
              label={{
                value: `Aircraft Weight (${units.toLowerCase()})`,
                angle: -90,
                position: "insideLeft",
                style: { textAnchor: 'middle', fontWeight: 'bold' }
              }}
              tickFormatter={(value) => (value / 1000).toString() + 'K'}
              allowDataOverflow={true}
            />
            <Tooltip
              content={({ active, coordinate }) => {
                if (active && coordinate && coordinate.x !== undefined && coordinate.y !== undefined) {
                  // Get the chart container to calculate relative positions
                  const chartContainer = chartRef.current;
                  if (!chartContainer) return null;

                  // Find the actual chart plotting area
                  const cartesianGrid = chartContainer.querySelector('.recharts-cartesian-grid');
                  if (!cartesianGrid) return null;

                  const containerRect = chartContainer.getBoundingClientRect();
                  const gridRect = cartesianGrid.getBoundingClientRect();

                  // Calculate the plotting area dimensions and position
                  const plotAreaLeft = gridRect.left - containerRect.left;
                  const plotAreaTop = gridRect.top - containerRect.top;
                  const plotAreaWidth = gridRect.width;
                  const plotAreaHeight = gridRect.height;

                  // Convert screen coordinates to data coordinates
                  const cgRange = [0, 50];
                  const weightRange = [300000, 800000]; // Base units (pounds) - matches original data

                  // Calculate relative position within the plot area
                  const relativeX = (coordinate.x - plotAreaLeft) / plotAreaWidth;
                  const relativeY = (coordinate.y - plotAreaTop) / plotAreaHeight;

                  // Convert to data values (in pounds)
                  const cg = cgRange[0] + relativeX * (cgRange[1] - cgRange[0]);
                  const weightInPounds = weightRange[1] - relativeY * (weightRange[1] - weightRange[0]);

                  // Convert to display units for showing
                  const weightInDisplayUnits = units === 'KG' ? Math.round(weightInPounds * 0.453592) : weightInPounds;

                  // Clamp values to valid ranges
                  const clampedCG = Math.max(cgRange[0], Math.min(cgRange[1], cg));
                  const clampedWeight = Math.max(
                    units === 'KG' ? Math.round(weightRange[0] * 0.453592) : weightRange[0],
                    Math.min(units === 'KG' ? Math.round(weightRange[1] * 0.453592) : weightRange[1], weightInDisplayUnits)
                  );

                  // Check if cursor is near a loading point
                  const findNearestPallet = () => {
                    if (loadingLine.length <= 1 || palletLabels.length === 0) return null;
                    const cgPixelScale = plotAreaWidth / (cgRange[1] - cgRange[0]);
                    const weightPixelScale = plotAreaHeight / (weightRange[1] - weightRange[0]);
                    let minDist = Infinity;
                    let result: { label: string; cg: number; weight: number } | null = null;

                    loadingLine.forEach((pt, i) => {
                      const dxPx = (cg - pt.cg) * cgPixelScale;
                      const dyPx = ((units === 'KG' ? pt.weight / 0.453592 : pt.weight) - weightInPounds) * weightPixelScale;
                      const dist = Math.sqrt(dxPx * dxPx + dyPx * dyPx);
                      if (dist < minDist && dist < 30) {
                        minDist = dist;
                        result = {
                          label: palletLabels[i] || `Point ${i}`,
                          cg: pt.cg,
                          weight: pt.weight
                        };
                      }
                    });
                    return result;
                  };
                  const nearestPallet = findNearestPallet();

                  return (
                    <div className="bg-white p-2 border rounded shadow-lg text-xs">
                      <p className="font-bold text-blue-800 m-0 mb-1">Cursor Position</p>
                      <p className="font-semibold m-0">CG: {clampedCG.toFixed(1)}% MAC</p>
                      <p className="m-0">Weight: {Math.round(clampedWeight).toLocaleString()} {units}</p>
                      {nearestPallet !== null && (
                        <div className="mt-1 pt-1 border-t border-gray-200">
                          <p className="font-bold text-amber-700 m-0">{(nearestPallet as { label: string; cg: number; weight: number }).label}</p>
                          <p className="m-0 text-gray-600">CG: {(nearestPallet as { label: string; cg: number; weight: number }).cg.toFixed(2)}% MAC</p>
                          <p className="m-0 text-gray-600">Weight: {Math.round((nearestPallet as { label: string; cg: number; weight: number }).weight).toLocaleString()} {units}</p>
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
              cursor={{
                strokeDasharray: '2 2',
                stroke: '#64748b',
                strokeWidth: 1
              }}
              isAnimationActive={false}
            />
            <Legend
              layout="horizontal"
              align="center"
              verticalAlign="bottom"
              wrapperStyle={{ paddingTop: '20px', fontSize: '11px' }}
              iconSize={10}
            />

            {/* Do-not-operate zone shading rendered via SVG overlay below */}

            <Line
              data={labeledEnvelopeData}
              type="linear"
              dataKey="weight"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ r: 3, fill: "#2563eb" }}
              name="Normal Operating Envelope"
              connectNulls
            />
            <Line
              data={envelopeData.doNotOperate}
              type="linear"
              dataKey="weight"
              stroke="#dc2626"
              strokeWidth={2}
              dot={false}
              name="Prohibited Flight Zone"
              connectNulls
            />
            <Line
              data={envelopeData.maxTaxiWeight}
              type="linear"
              dataKey="weight"
              stroke="#059669"
              strokeWidth={2}
              dot={false}
              name="Max Taxi Weight Limit"
              connectNulls
            />
            <Line
              data={labeledMaxZeroFuelWeight}
              type="linear"
              dataKey="weight"
              stroke="#0d9488"
              strokeWidth={2}
              strokeDasharray="3 3"
              dot={{ r: 2, fill: "#0d9488" }}
              name="Max Zero Fuel Weight (Structural)"
              connectNulls
            />
            <Line
              data={labeledMaxLandingWeight}
              type="linear"
              dataKey="weight"
              stroke="#7c3aed"
              strokeWidth={2}
              strokeDasharray="3 3"
              dot={{ r: 2, fill: "#7c3aed" }}
              name="Max Landing Weight Limit"
              connectNulls
            />
            {/* 300ER specific lines */}
            {variant === '300ER' && (
              <Line
                data={ENVELOPES['300ER'].altFwdCGLimitTakeoff1.map(point => ({
                  ...point,
                  weight: convertWeight(point.weight)
                }))}
                type="linear"
                dataKey="weight"
                stroke="#d97706"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Alt Forward CG Limit (Takeoff I)"
                connectNulls
              />
            )}
            {variant === '300ER' && ENVELOPES['300ER'].altFwdCGLimitTakeoff2 && (
              <Line
                data={ENVELOPES['300ER'].altFwdCGLimitTakeoff2.map(point => ({
                  ...point,
                  weight: convertWeight(point.weight)
                }))}
                type="linear"
                dataKey="weight"
                stroke="#9333ea"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Alt Forward CG Limit (Takeoff II)"
                connectNulls
              />
            )}
            {/* 200LR specific lines */}
            {variant === '200LR' && (
              <Line
                data={ENVELOPES['200LR'].altCGLimitTakeoff1.map(point => ({
                  ...point,
                  weight: convertWeight(point.weight)
                }))}
                type="linear"
                dataKey="weight"
                stroke="#dc2626"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Alt CG Limit Takeoff 1 (23%)"
                connectNulls
              />
            )}
            {variant === '200LR' && (
              <Line
                data={ENVELOPES['200LR'].altCGLimitTakeoff2.map(point => ({
                  ...point,
                  weight: convertWeight(point.weight)
                }))}
                type="linear"
                dataKey="weight"
                stroke="#dc2626"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Alt CG Limit Takeoff 2 (26%)"
                connectNulls
              />
            )}
            {/* Cumulative Load Check 1 - diagonal dotted line */}
            <Line
              data={envelopeData.cumulativeLoadCheck1}
              type="linear"
              dataKey="weight"
              stroke="#ff0000ff"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={{ r: 3, fill: "#ff0000ff" }}
              name="Cumulative Load Check 1"
              connectNulls
            />
            {/* Cumulative Load Check 2 - diagonal dotted line */}
            <Line
              data={envelopeData.cumulativeLoadCheck2}
              type="linear"
              dataKey="weight"
              stroke="#ff0000ff"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={{ r: 3, fill: "#ff0000ff" }}
              name="Cumulative Load Check 2"
              connectNulls
            />
            {/* Opportunity Window - Show CG range at final weight */}
            {opportunityData && (
              <>
                {/* Min CG boundary line at final weight */}
                <Line
                  data={[
                    { cg: opportunityData.minCG, weight: opportunityData.weight - convertWeight(5000) },
                    { cg: opportunityData.minCG, weight: opportunityData.weight + convertWeight(5000) }
                  ]}
                  type="linear"
                  dataKey="weight"
                  stroke="#0891b2"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Min Final CG Target"
                  connectNulls
                />
                {/* Max CG boundary line at final weight */}
                <Line
                  data={[
                    { cg: opportunityData.maxCG, weight: opportunityData.weight - convertWeight(5000) },
                    { cg: opportunityData.maxCG, weight: opportunityData.weight + convertWeight(5000) }
                  ]}
                  type="linear"
                  dataKey="weight"
                  stroke="#0891b2"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Max Final CG Target"
                  connectNulls
                />
                {/* Filled area showing CG range */}
                <Area
                  data={[
                    { cg: opportunityData.minCG, weight: opportunityData.weight, cgRange: 0 },
                    { cg: opportunityData.minCG, weight: opportunityData.weight, cgRange: opportunityData.cgRange }
                  ]}
                  type="linear"
                  dataKey="cgRange"
                  stroke="none"
                  fill="#06b6d4"
                  fillOpacity={0.3}
                  name="Final CG Opportunity Window"
                />
              </>
            )}
            {loadingLine.length > 1 && (
              <Line
                data={loadingLine}
                type="linear"
                dataKey="weight"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ r: 4 }}
                name="Loading Progression Path"
                connectNulls
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>

        {/* Do-not-operate zone shading — SVG polygon overlay */}
        {(() => {
          // The zone is bounded by:
          // - The straight envelope edge: (44.0, 609000) → (34.9, 347000)
          // - The do-not-operate line (notched boundary) back to start
          const dnoData = ENVELOPES[variant].doNotOperate;
          const vertices = [
            // Start at the top where both lines meet
            dataToScreen(44.0, convertWeight(609000)),
            // Along the straight envelope edge to bottom
            dataToScreen(34.9, convertWeight(347000)),
            // Back along the do-not-operate boundary (skip first & last since they match the envelope corners)
            ...dnoData.slice(0).reverse().slice(0, -1).map(pt => dataToScreen(pt.cg, convertWeight(pt.weight)))
          ];
          // Skip if coordinates haven't resolved yet
          if (vertices.some(v => v.x === 0 && v.y === 0)) return null;
          const pointsStr = vertices.map(v => `${v.x},${v.y}`).join(' ');
          return (
            <svg
              className="absolute inset-0 pointer-events-none"
              style={{ zIndex: 0 }}
              width="100%"
              height="100%"
            >
              <polygon
                points={pointsStr}
                fill="#dc2626"
                fillOpacity={0.15}
                stroke="none"
              />
            </svg>
          );
        })()}

        {/* Draggable labels for envelope points */}
        {labeledEnvelopeData.map((point, index) => {
          // Skip empty labels (closure points, etc.)
          if (!point.label) return null;

          const pointCoords = dataToScreen(point.cg, point.weight);
          // Skip if coordinates are invalid
          if (pointCoords.x === 0 && pointCoords.y === 0) return null;

          const labelId = `envelope-${index}`;
          const labelPos = labelPositions[labelId] || {
            x: pointCoords.x + 10 + (index % 2) * 10,
            y: pointCoords.y - 15 - (index % 3) * 20
          };

          return (
            <div key={labelId}>
              {/* Leader line for this specific label */}
              <svg
                className="absolute inset-0 pointer-events-none"
                style={{ zIndex: 1 }}
                width="100%"
                height="100%"
              >
                <line
                  x1={pointCoords.x}
                  y1={pointCoords.y}
                  x2={labelPos.x}
                  y2={labelPos.y}
                  stroke="#2563eb"
                  strokeWidth="2"
                  strokeDasharray="3,3"
                  opacity="0.8"
                />
              </svg>

              {/* Draggable label */}
              <div
                className="absolute bg-white border border-blue-300 rounded px-2 py-1 text-xs shadow-md cursor-move select-none"
                style={{
                  left: labelPos.x,
                  top: labelPos.y,
                  zIndex: 10,
                  transform: 'translate(-50%, -100%)'
                }}
                onMouseDown={(e) => handleLabelMouseDown(labelId, e)}
              >
                <div className="font-semibold text-blue-800">{point.label}</div>
              </div>
            </div>
          );
        })}

        {/* Draggable labels for max zero fuel weight */}
        {labeledMaxZeroFuelWeight.map((point, index) => {
          if (!point.label) return null;

          const pointCoords = dataToScreen(point.cg, point.weight);
          // Skip if coordinates are invalid
          if (pointCoords.x === 0 && pointCoords.y === 0) return null;

          const labelId = `mzfw-${index}`;
          const labelPos = labelPositions[labelId] || {
            x: pointCoords.x - 80,
            y: pointCoords.y - 25
          };

          return (
            <div key={labelId}>
              {/* Leader line for this specific label */}
              <svg
                className="absolute inset-0 pointer-events-none"
                style={{ zIndex: 1 }}
                width="100%"
                height="100%"
              >
                <line
                  x1={pointCoords.x}
                  y1={pointCoords.y}
                  x2={labelPos.x}
                  y2={labelPos.y}
                  stroke="#0d9488"
                  strokeWidth="1"

                  opacity="0.8"
                />
              </svg>

              {/* Draggable label */}
              <div
                className="absolute bg-white border border-gray-300 rounded px-2 py-1 text-xs shadow-md cursor-move select-none"
                style={{
                  left: labelPos.x,
                  top: labelPos.y,
                  zIndex: 10,
                  transform: 'translate(-50%, -100%)',
                  fontSize: '9px',
                  lineHeight: '1.1',
                  textAlign: 'center',
                  whiteSpace: 'pre-line'
                }}
                onMouseDown={(e) => handleLabelMouseDown(labelId, e)}
              >
                <div className="font-semibold text-black" style={{ fontSize: '9px' }}>{point.label}</div>
              </div>
            </div>
          );
        })}

        {/* Draggable labels for max landing weight */}
        {labeledMaxLandingWeight.map((point, index) => {
          if (!point.label) return null;

          const pointCoords = dataToScreen(point.cg, point.weight);
          // Skip if coordinates are invalid
          if (pointCoords.x === 0 && pointCoords.y === 0) return null;

          const labelId = `mlw-${index}`;
          const labelPos = labelPositions[labelId] || {
            x: pointCoords.x + 80,
            y: pointCoords.y - 25
          };

          return (
            <div key={labelId}>
              {/* Leader line for this specific label */}
              <svg
                className="absolute inset-0 pointer-events-none"
                style={{ zIndex: 1 }}
                width="100%"
                height="100%"
              >
                <line
                  x1={pointCoords.x}
                  y1={pointCoords.y}
                  x2={labelPos.x}
                  y2={labelPos.y}
                  stroke="#7c3aed"
                  strokeWidth="1"
                  opacity="0.8"
                />
              </svg>

              {/* Draggable label */}
              <div
                className="absolute bg-white border border-gray-300 rounded px-2 py-1 text-xs shadow-md cursor-move select-none"
                style={{
                  left: labelPos.x,
                  top: labelPos.y,
                  zIndex: 10,
                  transform: 'translate(-50%, -100%)',
                  fontSize: '9px',
                  lineHeight: '1.1',
                  textAlign: 'center',
                  whiteSpace: 'pre-line'
                }}
                onMouseDown={(e) => handleLabelMouseDown(labelId, e)}
              >
                <div className="font-semibold text-black" style={{ fontSize: '9px' }}>{point.label}</div>
              </div>
            </div>
          );
        })}

        {/* Draggable labels for outside envelope points */}
        {outsideEnvelopeLabels.map((point, index) => {
          const pointCoords = dataToScreen(point.cg, point.weight);
          // Skip if coordinates are invalid
          if (pointCoords.x === 0 && pointCoords.y === 0) return null;

          const labelId = `outside-${index}`;

          // Position labels outside the envelope based on their position attribute
          let defaultPos = { x: 0, y: 0 };
          switch (point.position) {
            case 'top':
              defaultPos = { x: pointCoords.x, y: pointCoords.y - 40 };
              break;
            case 'right':
              defaultPos = { x: pointCoords.x + 60, y: pointCoords.y };
              break;
            case 'bottom':
              defaultPos = { x: pointCoords.x, y: pointCoords.y + 40 };
              break;
            case 'bottom-right':
              defaultPos = { x: pointCoords.x + 50, y: pointCoords.y + 30 };
              break;
            case 'left':
              defaultPos = { x: pointCoords.x - 60, y: pointCoords.y };
              break;
            default:
              defaultPos = { x: pointCoords.x + 20, y: pointCoords.y - 20 };
          }

          const labelPos = labelPositions[labelId] || defaultPos;

          return (
            <div key={labelId}>
              {/* Leader line connecting to envelope point */}
              <svg
                className="absolute inset-0 pointer-events-none"
                style={{ zIndex: 1 }}
                width="100%"
                height="100%"
              >
                <line
                  x1={pointCoords.x}
                  y1={pointCoords.y}
                  x2={labelPos.x}
                  y2={labelPos.y}
                  stroke="#000000"
                  strokeWidth="1"
                  opacity="0.6"
                />
              </svg>

              {/* Draggable label */}
              <div
                className="absolute bg-white border border-gray-300 rounded px-1 py-1 shadow-sm cursor-move select-none"
                style={{
                  left: labelPos.x,
                  top: labelPos.y,
                  zIndex: 10,
                  transform: 'translate(-50%, -50%)',
                  fontSize: '8px',
                  lineHeight: '1.0',
                  textAlign: 'center',
                  whiteSpace: 'pre-line'
                }}
                onMouseDown={(e) => handleLabelMouseDown(labelId, e)}
              >
                <div className="font-normal text-black" style={{ fontSize: '8px' }}>{point.label}</div>
              </div>
            </div>
          );
        })}

        {/* Draggable labels for 200LR alt CG limit takeoff lines */}
        {variant === '200LR' && (
          <>
            {/* Alt CG Limit Takeoff 1 (23%) label */}
            {(() => {
              const pointCoords = dataToScreen(23.0, convertWeight(520000)); // Position on the vertical line
              // Skip if coordinates are invalid
              if (pointCoords.x === 0 && pointCoords.y === 0) return null;

              const labelId = 'alt-cg-takeoff-1';
              const labelPos = labelPositions[labelId] || {
                x: pointCoords.x - 50,
                y: pointCoords.y - 10
              };

              return (
                <div key={labelId}>
                  {/* Leader line */}
                  <svg
                    className="absolute inset-0 pointer-events-none"
                    style={{ zIndex: 1 }}
                    width="100%"
                    height="100%"
                  >
                    <line
                      x1={pointCoords.x}
                      y1={pointCoords.y}
                      x2={labelPos.x + 30}
                      y2={labelPos.y}
                      stroke="#000000"
                      strokeWidth="1"
                      opacity="0.7"
                    />
                  </svg>

                  {/* Draggable label */}
                  <div
                    className="absolute bg-white border border-gray-300 rounded px-1 py-1 shadow-sm cursor-move select-none"
                    style={{
                      left: labelPos.x,
                      top: labelPos.y,
                      zIndex: 10,
                      transform: 'translate(-50%, -50%)',
                      fontSize: '8px',
                      lineHeight: '1.0',
                      minWidth: '80px',
                      textAlign: 'center'
                    }}
                    onMouseDown={(e) => handleLabelMouseDown(labelId, e)}
                  >
                    <div className="font-normal text-black" style={{ fontSize: '8px' }}>
                      Alternate CG Limit<br />Takeoff - 23%
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Alt CG Limit Takeoff 2 (26%) label */}
            {(() => {
              const pointCoords = dataToScreen(26.0, convertWeight(480000)); // Position on the vertical line
              // Skip if coordinates are invalid
              if (pointCoords.x === 0 && pointCoords.y === 0) return null;

              const labelId = 'alt-cg-takeoff-2';
              const labelPos = labelPositions[labelId] || {
                x: pointCoords.x + 50,
                y: pointCoords.y - 10
              };

              return (
                <div key={labelId}>
                  {/* Leader line */}
                  <svg
                    className="absolute inset-0 pointer-events-none"
                    style={{ zIndex: 1 }}
                    width="100%"
                    height="100%"
                  >
                    <line
                      x1={pointCoords.x}
                      y1={pointCoords.y}
                      x2={labelPos.x - 30}
                      y2={labelPos.y}
                      stroke="#000000"
                      strokeWidth="1"
                      opacity="0.7"
                    />
                  </svg>

                  {/* Draggable label */}
                  <div
                    className="absolute bg-white border border-gray-300 rounded px-1 py-1 shadow-sm cursor-move select-none"
                    style={{
                      left: labelPos.x,
                      top: labelPos.y,
                      zIndex: 10,
                      transform: 'translate(-50%, -50%)',
                      fontSize: '8px',
                      lineHeight: '1.0',
                      minWidth: '80px',
                      textAlign: 'center'
                    }}
                    onMouseDown={(e) => handleLabelMouseDown(labelId, e)}
                  >
                    <div className="font-normal text-black" style={{ fontSize: '8px' }}>
                      Alternate CG Limit<br />Takeoff - 26%
                    </div>
                  </div>
                </div>
              );
            })()}

          </>
        )}

        {/* Cumulative Load Check 1 label */}
        {(() => {
          const clc1 = ENVELOPES[variant].cumulativeLoadCheck1;
          const midCG = (clc1[0].cg + clc1[1].cg) / 2;
          const midWeight = convertWeight((clc1[0].weight + clc1[1].weight) / 2);
          const pointCoords = dataToScreen(midCG, midWeight);
          if (pointCoords.x === 0 && pointCoords.y === 0) return null;

          const labelId = 'clc-1';
          const labelPos = labelPositions[labelId] || {
            x: pointCoords.x - 60,
            y: pointCoords.y - 20
          };

          return (
            <div key={labelId}>
              <svg
                className="absolute inset-0 pointer-events-none"
                style={{ zIndex: 1 }}
                width="100%"
                height="100%"
              >
                <line
                  x1={pointCoords.x}
                  y1={pointCoords.y}
                  x2={labelPos.x + 30}
                  y2={labelPos.y}
                  stroke="#ff0000ff"
                  strokeWidth="1"
                  opacity="0.7"
                />
              </svg>
              <div
                className="absolute bg-white border border-red-700 rounded px-1 py-1 shadow-sm cursor-move select-none"
                style={{
                  left: labelPos.x,
                  top: labelPos.y,
                  zIndex: 10,
                  transform: 'translate(-50%, -50%)',
                  fontSize: '8px',
                  lineHeight: '1.0',
                  minWidth: '90px',
                  textAlign: 'center'
                }}
                onMouseDown={(e) => handleLabelMouseDown(labelId, e)}
              >
                <div className="font-normal text-red-700" style={{ fontSize: '8px' }}>
                  Cumulative Load<br />Check 1
                </div>
              </div>
            </div>
          );
        })()}

        {/* Cumulative Load Check 2 label */}
        {(() => {
          const clc2 = ENVELOPES[variant].cumulativeLoadCheck2;
          const midCG = (clc2[0].cg + clc2[1].cg) / 2;
          const midWeight = convertWeight((clc2[0].weight + clc2[1].weight) / 2);
          const pointCoords = dataToScreen(midCG, midWeight);
          if (pointCoords.x === 0 && pointCoords.y === 0) return null;

          const labelId = 'clc-2';
          const labelPos = labelPositions[labelId] || {
            x: pointCoords.x + 60,
            y: pointCoords.y - 20
          };

          return (
            <div key={labelId}>
              <svg
                className="absolute inset-0 pointer-events-none"
                style={{ zIndex: 1 }}
                width="100%"
                height="100%"
              >
                <line
                  x1={pointCoords.x}
                  y1={pointCoords.y}
                  x2={labelPos.x - 30}
                  y2={labelPos.y}
                  stroke="#ff0000ff"
                  strokeWidth="1"
                  opacity="0.7"
                />
              </svg>
              <div
                className="absolute bg-white border border-red-700 rounded px-1 py-1 shadow-sm cursor-move select-none"
                style={{
                  left: labelPos.x,
                  top: labelPos.y,
                  zIndex: 10,
                  transform: 'translate(-50%, -50%)',
                  fontSize: '8px',
                  lineHeight: '1.0',
                  minWidth: '90px',
                  textAlign: 'center'
                }}
                onMouseDown={(e) => handleLabelMouseDown(labelId, e)}
              >
                <div className="font-normal text-red-700" style={{ fontSize: '8px' }}>
                  Cumulative Load<br />Check 2
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}