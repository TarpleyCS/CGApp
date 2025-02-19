"use client"

import React, { useState } from 'react';
import { LoadingGrid } from './loading-grid';
import { WeightChart} from './weight-chart';
import { LoadingTable } from './loading-table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Constants for CG calculations
const MOMENT_ARM_REFERENCE = 1174.5;
const MAC_REFERENCE = 278.5;

const OEW300ER = {
  weight: 321000,
  momentArm: 1230,
  moment: 394830000,
  cg: 19.928
};

const OEW200LR = {
  weight: 308000,
  momentArm: 1236,
  moment: 380811200,
  cg: 22.226
};

// Fuel CG data
// Fuel CG data provided
const FUEL_CG_DATA: [number, number][] = [
  [100, 1153.4], [200, 1153.6], [300, 1154.1], [400, 1154.5], 
  [500, 1154.9], [600, 1155.2], [700, 1155.5], [800, 1155.6], 
  [900, 1155.6], [1000, 1155.4], [1100, 1155.1], [1200, 1154.8], 
  [1300, 1154.5], [1400, 1154.1], [1500, 1153.8], [1600, 1153.4], 
  [1700, 1153.0], [1800, 1152.6], [1900, 1152.2], [2000, 1151.8], 
  [2100, 1151.3], [2200, 1150.9], [2300, 1150.5], [2400, 1150.1], 
  [2500, 1150.3], [2600, 1149.9], [2700, 1149.5], [2800, 1149.1], 
  [2900, 1148.7], [3000, 1148.8], [3100, 1148.4], [3200, 1148.0], 
  [3300, 1147.6], [3400, 1147.2], [3500, 1147.9], [3600, 1147.5], 
  [3700, 1147.1], [3800, 1146.8], [3900, 1146.5], [4000, 1147.2], 
  [4100, 1146.8], [4200, 1146.5], [4300, 1146.3], [4400, 1146.3], 
  [4500, 1146.8], [4600, 1146.5], [4700, 1146.3], [4800, 1146.3], 
  [4900, 1146.3], [5000, 1146.5], [5100, 1146.3], [5200, 1146.3], 
  [5300, 1146.3], [5400, 1146.3], [5500, 1146.4], [5600, 1146.3], 
  [5700, 1146.3], [5800, 1146.3], [5900, 1146.3], [6000, 1146.3], 
  [6100, 1146.3], [6200, 1146.3], [6300, 1146.3], [6400, 1146.3], 
  [6500, 1146.3], [6600, 1146.4], [6700, 1146.4], [6800, 1146.4], 
  [6900, 1146.4], [7000, 1146.4], [7100, 1146.5], [7200, 1146.5], 
  [7300, 1146.5], [7400, 1146.5], [7500, 1146.5], [7600, 1146.6], 
  [7700, 1146.6], [7800, 1146.6], [7900, 1146.6], [8000, 1146.6], 
  [8100, 1146.8], [8200, 1146.8], [8300, 1146.8], [8400, 1146.8], 
  [8500, 1146.8], [8600, 1147.0], [8700, 1147.0], [8800, 1147.0], 
  [8900, 1147.0], [9000, 1147.0], [9100, 1147.2], [9200, 1147.2], 
  [9300, 1147.2], [9400, 1147.2], [9500, 1147.2], [9600, 1147.4], 
  [9700, 1147.4], [9800, 1147.4], [9900, 1147.4], [10000, 1147.4], 
  [10100, 1147.5], [10200, 1147.5], [10300, 1147.5], [10400, 1147.5], 
  [10500, 1147.5], [10600, 1147.7], [10700, 1147.7], [10800, 1147.7], 
  [10900, 1147.7], [11000, 1147.7], [11100, 1147.8], [11200, 1147.8], 
  [11300, 1147.8], [11400, 1147.8], [11500, 1147.8], [11600, 1147.9], 
  [11700, 1147.9], [11800, 1147.9], [11900, 1147.9], [12000, 1147.9], 
  [12100, 1148.0], [12200, 1148.0], [12300, 1148.0], [12400, 1148.0], 
  [12500, 1148.0], [12600, 1148.1], [12700, 1148.1], [12800, 1148.1], 
  [12900, 1148.1], [13000, 1148.1], [13100, 1148.2], [13200, 1148.2], 
  [13300, 1148.2], [13400, 1148.2], [13500, 1148.2], [13600, 1148.3], 
  [13700, 1148.3], [13800, 1148.3], [13900, 1148.3], [14000, 1148.3], 
  [14100, 1148.4], [14200, 1148.4], [14300, 1148.4], [14400, 1148.4], 
  [14500, 1148.4], [14600, 1148.4], [14700, 1148.4], [14800, 1148.4], 
  [14900, 1148.4], [15000, 1148.4], [15100, 1148.5], [15200, 1148.5], 
  [15300, 1148.5], [15400, 1148.5], [15500, 1148.5], [15600, 1148.5], 
  [15700, 1148.5], [15800, 1148.5], [15900, 1148.5], [16000, 1148.5], 
  [16100, 1148.6], [16200, 1148.6], [16300, 1148.6], [16400, 1148.6], 
  [16500, 1148.6], [16600, 1148.6], [16700, 1148.6], [16800, 1148.6], 
  [16900, 1148.6], [17000, 1148.6], [17100, 1148.7], [17200, 1148.7], 
  [17300, 1148.7], [17400, 1148.7], [17500, 1148.7], [17600, 1148.7], 
  [17700, 1148.7], [17800, 1148.7], [17900, 1148.7], [18000, 1148.7], 
  [18100, 1148.7], [18200, 1148.7], [18300, 1148.7], [18400, 1148.7], 
  [18500, 1148.7], [18600, 1148.8], [18700, 1148.8], [18800, 1148.8], 
  [18900, 1148.8], [19000, 1148.8], [19100, 1148.8], [19200, 1148.8], 
  [19300, 1148.8], [19400, 1148.8], [19500, 1148.8], [19600, 1148.8], 
  [19700, 1148.8], [19800, 1148.8], [19900, 1148.8], [20000, 1148.8], 
  [20100, 1148.9], [20200, 1148.9], [20300, 1148.9], [20400, 1148.9], 
  [20500, 1148.9], [20600, 1148.9], [20700, 1148.9], [20800, 1148.9], 
  [20900, 1148.9], [21000, 1148.9], [21100, 1148.9], [21200, 1148.9], 
  [21300, 1148.9], [21400, 1148.9], [21500, 1148.9], [21600, 1148.9], 
  [21700, 1148.9], [21800, 1148.9], [21900, 1148.9], [22000, 1148.9], 
  [22100, 1148.9], [22200, 1148.9], [22300, 1148.9], [22400, 1148.9], 
  [22500, 1148.8], [22600, 1148.6], [22700, 1148.6], [22800, 1148.6], 
  [22900, 1148.6], [23000, 1148.6], [23100, 1148.5], [23200, 1148.5], 
  [23300, 1148.5], [23400, 1148.5], [23500, 1148.5], [23600, 1148.2], 
  [23700, 1148.2], [23800, 1148.2], [23900, 1148.2], [24000, 1148.0], 
  [24100, 1148.0], [24200, 1148.0], [24300, 1148.0], [24400, 1148.0], 
  [24500, 1148.0], [24600, 1147.7], [24700, 1147.7], [24800, 1147.7], 
  [24900, 1147.7], [25000, 1147.7], [25100, 1147.3], [25200, 1147.3], 
  [25300, 1147.3], [25400, 1147.3], [25500, 1147.3], [25600, 1146.9], 
  [25700, 1146.9], [25800, 1146.9], [25900, 1146.9], [26000, 1146.9], 
  [26100, 1146.5], [26200, 1146.5], [26300, 1146.5], [26400, 1146.5], 
  [26500, 1146.5], [26600, 1146.5], [26700, 1146.5], [26800, 1146.5], 
  [26900, 1146.5], [27000, 1146.4], [27100, 1146.4], [27200, 1146.4],
  [27290, 1146.4]
];

interface PalletWeight {
  weight: number;
  position: string;
}

interface LoadingPoint {
  cg: number;
  weight: number;
}

const POSITION_MAP = {
  AL: 460, AR: 460, BL: 586, BR: 586,
  CL: 712, CR: 712, DL: 838, DR: 838,
  EL: 964, ER: 964, FL: 1090, FR: 1090,
  GL: 1216, GR: 1216, HL: 1342, HR: 1342,
  JL: 1468, JR: 1468, KL: 1594, KR: 1594,
  LL: 1719, LR: 1719, ML: 1858, MR: 1858,
  PL: 1984, PR: 1984, R: 2095
};

const calculateCG = (momentArm: number): number => {
  return ((momentArm - MOMENT_ARM_REFERENCE) * 100) / MAC_REFERENCE;
};

// Get fuel arm based on weight using interpolation
const getFuelArm = (fuelWeight: number): number => {
  if (fuelWeight <= 0) return 0;
  
  // Convert to hundreds for table lookup
  const hundreds = Math.floor(fuelWeight);
  
  // Find closest data points
  let lowerIndex = 0;
  for (let i = 0; i < FUEL_CG_DATA.length; i++) {
    if (FUEL_CG_DATA[i][0] <= hundreds) {
      lowerIndex = i;
    } else {
      break;
    }
  }
  
  // Get upper index (bounded to prevent out of range)
  const upperIndex = Math.min(lowerIndex + 1, FUEL_CG_DATA.length - 1);
  
  // If we're at exact data point or beyond max, return direct value
  if (lowerIndex === upperIndex || hundreds >= FUEL_CG_DATA[FUEL_CG_DATA.length - 1][0]) {
    return FUEL_CG_DATA[lowerIndex][1];
  }
  
  // Interpolate between data points
  const lowerWeight = FUEL_CG_DATA[lowerIndex][0];
  const upperWeight = FUEL_CG_DATA[upperIndex][0];
  const lowerArm = FUEL_CG_DATA[lowerIndex][1];
  const upperArm = FUEL_CG_DATA[upperIndex][1];
  
  return lowerArm + ((hundreds - lowerWeight) / (upperWeight - lowerWeight)) * (upperArm - lowerArm);
};

export default function WeightCalculator() {
  const [variant, setVariant] = useState<'300ER' | '200LR'>('300ER');
  const [selectedPattern, setSelectedPattern] = useState('default');
  const [loadingPoints, setLoadingPoints] = useState<LoadingPoint[]>([
    { cg: variant === '300ER' ? OEW300ER.cg : OEW200LR.cg, 
      weight: variant === '300ER' ? OEW300ER.weight : OEW200LR.weight }
  ]);
  const [fuelLoaded, setFuelLoaded] = useState(false);
  const [fuelWeight, setFuelWeight] = useState(0);
  const [tableData, setTableData] = useState<any[]>([]);

  const loadingPatterns = {
    default: [ 'R', 'PL', 'PR', 'AL', 'AR', 'BL', 'BR', 'CL', 'CR', 'DL', 'DR',
    'EL', 'ER', 'FL', 'FR', 'GL', 'GR', 'HL', 'HR', 'JL', 'JR',
    'KL', 'KR', 'LR', 'LL', 'ML', 'MR'],
    forward: ['R', 'AL', 'AR', 'BL', 'BR', 'CL', 'CR', 'DL', 'DR', 'PL', 'PR'],
    aft: ['ML', 'MR', 'LL', 'LR', 'KL', 'KR', 'JL', 'JR', 'HL', 'HR', 'GL', 'GR'],
    balanced: ['FL', 'FR', 'EL', 'ER', 'DL', 'DR', 'GL', 'GR', 'JL', 'JR', 'ML', 'MR'],
  };

  const handleCompute = (weights: PalletWeight[]) => {
    // Reset fuel state when weights change
    setFuelLoaded(false);
    setFuelWeight(0);
    
    const OEW = variant === '300ER' ? OEW300ER : OEW200LR;
    let currentWeight = OEW.weight;
    let currentMoment = OEW.moment;
    const points: LoadingPoint[] = [{ cg: OEW.cg, weight: OEW.weight }];
    const newTableData = [{
      position: 'OEW',
      momentArm: OEW.momentArm,
      weight: OEW.weight,
      moment: OEW.moment,
      sumWeight: currentWeight,
      sumMoment: currentMoment,
      sumBA: OEW.momentArm,
      mac: OEW.cg
    }];

    weights.forEach(({ weight, position }) => {
      if (weight === 0) return;

      const momentArm = POSITION_MAP[position as keyof typeof POSITION_MAP];
      const moment = weight * momentArm;
      
      currentWeight += weight;
      currentMoment += moment;
      const sumBA = currentMoment / currentWeight;
      const mac = calculateCG(sumBA);

      points.push({ cg: mac, weight: currentWeight });
      newTableData.push({
        position,
        momentArm,
        weight,
        moment,
        sumWeight: currentWeight,
        sumMoment: currentMoment,
        sumBA,
        mac
      });
    });

    setLoadingPoints(points);
    setTableData(newTableData);
  };

  const handleFuelLoad = (weight: number) => {
    if (weight <= 0) return;
    setFuelWeight(weight);
    
    const lastPoint = loadingPoints[loadingPoints.length - 1];
    const fuelArm = getFuelArm(weight);
    const fuelMoment = weight * fuelArm;
    
    // Calculate new totals with fuel
    const newTotalWeight = lastPoint.weight + weight;
    const lastMoment = tableData[tableData.length - 1].sumMoment;
    const newTotalMoment = lastMoment + fuelMoment;
    const newBA = newTotalMoment / newTotalWeight;
    const newCG = calculateCG(newBA);
    
    // Add fuel point
    const newLoadingPoints = [...loadingPoints, { cg: newCG, weight: newTotalWeight }];
    setLoadingPoints(newLoadingPoints);
    
    // Add to table data
    const newTableData = [...tableData, {
      position: 'FUEL',
      momentArm: fuelArm,
      weight,
      moment: fuelMoment,
      sumWeight: newTotalWeight,
      sumMoment: newTotalMoment,
      sumBA: newBA,
      mac: newCG
    }];
    setTableData(newTableData);
    
    setFuelLoaded(true);
  };

  return (
    <div className="space-y-8 p-4">
      <Card>
        <CardHeader>
          <CardTitle>777 Weight and Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center justify-between mb-4">
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setVariant('300ER');
                  setLoadingPoints([{ cg: OEW300ER.cg, weight: OEW300ER.weight }]);
                  setTableData([]);
                  setFuelLoaded(false);
                  setFuelWeight(0);
                }}
                variant={variant === '300ER' ? 'default' : 'outline'}
              >
                777-300ER
              </Button>
              <Button
                onClick={() => {
                  setVariant('200LR');
                  setLoadingPoints([{ cg: OEW200LR.cg, weight: OEW200LR.weight }]);
                  setTableData([]);
                  setFuelLoaded(false);
                  setFuelWeight(0);
                }}
                variant={variant === '200LR' ? 'default' : 'outline'}
              >
                777-200LR
              </Button>
            </div>
            <select
              className="px-3 py-2 border rounded-md"
              value={selectedPattern}
              onChange={(e) => {
                setSelectedPattern(e.target.value);
                setTableData([]);
                setLoadingPoints([{ 
                  cg: variant === '300ER' ? OEW300ER.cg : OEW200LR.cg,
                  weight: variant === '300ER' ? OEW300ER.weight : OEW200LR.weight 
                }]);
                setFuelLoaded(false);
                setFuelWeight(0);
              }}
            >
              <option value="default">Default Loading Pattern</option>
              <option value="forward">Forward Loading</option>
              <option value="aft">Aft Loading</option>
              <option value="balanced">Balanced Loading</option>
            </select>
          </div>
          <LoadingGrid 
            key={selectedPattern}
            onWeightChange={handleCompute} 
            onCompute={() => {}} 
            onFuelLoad={handleFuelLoad}
            loadingSequence={loadingPatterns[selectedPattern as keyof typeof loadingPatterns]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          {variant === '300ER' ? (
            <WeightChart
              variant="300ER"
              loadingPoints={loadingPoints}
              data={[]}
            />
          ) : (
            <WeightChart
              variant="200LR"
              loadingPoints={loadingPoints}
              data={[]}
            />
          )}
        </CardContent>
      </Card>

      {tableData.length > 1 && (
        <Card>
          <CardContent>
            <LoadingTable data={tableData} />
            <div className="mt-6 grid grid-cols-3 gap-4 text-center">
              <div className="p-3 border rounded-lg">
                <div className="font-bold">ZFW</div>
                <div>
                  {new Intl.NumberFormat().format(fuelLoaded ? 
                    loadingPoints[loadingPoints.length - 2].weight : 
                    loadingPoints[loadingPoints.length - 1].weight)} lbs
                </div>
                <div className="text-sm text-gray-600">
                  {fuelLoaded ? 
                    loadingPoints[loadingPoints.length - 2].cg.toFixed(2) : 
                    loadingPoints[loadingPoints.length - 1].cg.toFixed(2)}% MAC
                </div>
              </div>
              
              <div className="p-3 border rounded-lg">
                <div className="font-bold">Fuel</div>
                <div>{new Intl.NumberFormat().format(fuelWeight)} lbs</div>
                {fuelLoaded && (
                  <div className="text-sm text-gray-600">
                    Arm: {getFuelArm(fuelWeight).toFixed(1)}
                  </div>
                )}
              </div>
              
              <div className={`p-3 border rounded-lg ${fuelLoaded ? 'bg-green-50' : 'bg-yellow-50'}`}>
                <div className="font-bold">TOW</div>
                <div>
                  {new Intl.NumberFormat().format(loadingPoints[loadingPoints.length - 1].weight)} lbs
                </div>
                <div className={`text-sm ${fuelLoaded ? 'text-green-600' : 'text-yellow-600'}`}>
                  {loadingPoints[loadingPoints.length - 1].cg.toFixed(2)}% MAC
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 