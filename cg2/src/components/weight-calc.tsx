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

export default function WeightCalculator() {
  const [variant, setVariant] = useState<'300ER' | '200LR'>('300ER');
  const [selectedPattern, setSelectedPattern] = useState('default');
  const [loadingPoints, setLoadingPoints] = useState<LoadingPoint[]>([
    { cg: variant === '300ER' ? OEW300ER.cg : OEW200LR.cg, 
      weight: variant === '300ER' ? OEW300ER.weight : OEW200LR.weight }
  ]);
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
            <div className="text-center text-sm text-gray-600 mt-4">
              Current Weight: {new Intl.NumberFormat().format(loadingPoints[loadingPoints.length - 1].weight)} lbs
              <br />
              Current CG: {loadingPoints[loadingPoints.length - 1].cg.toFixed(2)}% MAC
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}