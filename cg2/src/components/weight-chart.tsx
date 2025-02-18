import React from 'react';
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface EnvelopePoint {
  cg: number;
  weight: number;
}

interface WeightChartProps {
  data: number[][];
  variant?: '200LR' | '300ER';
  loadingPoints?: EnvelopePoint[];
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
    OEW: { cg: 21.4, weight: 311787 }
  },
  '200LR': {
    basicCGGrid: [
      { cg: 14.0, weight: 250000 },
      { cg: 14.0, weight: 460000 },
      { cg: 16.3, weight: 582000 },
      { cg: 20.9, weight: 646300 },
      { cg: 23.0, weight: 650000 },
      { cg: 27.4, weight: 657000 },
      { cg: 31.1, weight: 657000 },
      { cg: 37.4, weight: 642000 },
      { cg: 44.0, weight: 565000 },
      { cg: 44.0, weight: 471500 },
      { cg: 44.0, weight: 266100 },
      { cg: 44.0, weight: 250000 },
      { cg: 14.0, weight: 250000 }
    ],
    doNotOperate: [
      { cg: 44.0, weight: 471500 },
      { cg: 34.1, weight: 266100 }
    ],
    maxLandingWeight: [
      { cg: 14.0, weight: 460000 },
      { cg: 44.0, weight: 460000 }
    ],
    maxZeroFuelWeight: [
      { cg: 14.0, weight: 435000 },
      { cg: 16.1, weight: 435000 },
      { cg: 44.0, weight: 435000 }
    ],
    maxTaxiWeight: [
      { cg: 27.4, weight: 766000 },
      { cg: 30.6, weight: 766000 }
    ],
    altFwdCGLimitTakeoff1: [
      { cg: 16.1, weight: 435000 },
      { cg: 16.1, weight: 657000 }
    ],
    OEW: { cg: 13.6, weight: 113640 }
  }
};

export function WeightChart({ data, variant = '300ER', loadingPoints }: WeightChartProps) {
  const envelopeData = ENVELOPES[variant];
  const loadingLine = Array.isArray(loadingPoints) ? 
    [envelopeData.OEW, ...loadingPoints] : 
    [envelopeData.OEW];

  return (
    <div className="w-full p-4 border rounded-lg bg-white">
      <div className="font-bold text-lg mb-4">777-{variant} CG Envelope</div>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart margin={{ top: 20, right: 120, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="cg"
            domain={[10, 50]}
            label={{ value: "Center of Gravity - %MAC", position: "bottom" }}
            ticks={[10, 15, 20, 25, 30, 35, 40, 45, 50]}
          />
          <YAxis
            type="number"
            domain={variant === '300ER' ? [300000, 800000] : [200000, 800000]}
            label={{ value: "Weight (lbs)", angle: -90, position: "insideLeft" }}
            tickFormatter={(value) => (value / 1000).toString() + 'K'}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const cg = payload[0].payload.cg;
                const weight = payload[0].value;
                return (
                  <div className="bg-white p-2 border rounded shadow">
                    <p className="font-bold m-0">CG: {Number(cg).toFixed(1)}%MAC</p>
                    <p className="m-0 mt-1">Weight: {new Intl.NumberFormat().format(weight)} lbs</p>
                  </div>
                );
              }
              return null;
            }}
            cursor={{ strokeDasharray: '3 3' }}
          />
          <Legend layout="vertical" align="right" verticalAlign="middle" />
          
          <Line
            data={envelopeData.basicCGGrid}
            type="linear"
            dataKey="weight"
            stroke="#2563eb"
            strokeWidth={2}
            dot={false}
            name="Basic CG Grid"
            connectNulls
          />
          <Line
            data={envelopeData.doNotOperate}
            type="linear"
            dataKey="weight"
            stroke="#dc2626"
            strokeWidth={2}
            dot={false}
            name="Do Not Operate"
            connectNulls
          />
          <Line
            data={envelopeData.maxTaxiWeight}
            type="linear"
            dataKey="weight"
            stroke="#059669"
            strokeWidth={2}
            dot={false}
            name="Max Taxi Weight"
            connectNulls
          />
          <Line
            data={envelopeData.maxZeroFuelWeight}
            type="linear"
            dataKey="weight"
            stroke="#0d9488"
            strokeWidth={2}
            strokeDasharray="3 3"
            dot={false}
            name="Max Zero Fuel Weight"
            connectNulls
          />
          <Line
            data={envelopeData.maxLandingWeight}
            type="linear"
            dataKey="weight"
            stroke="#7c3aed"
            strokeWidth={2}
            strokeDasharray="3 3"
            dot={false}
            name="Max Landing Weight"
            connectNulls
          />
          <Line
            data={envelopeData.altFwdCGLimitTakeoff1}
            type="linear"
            dataKey="weight"
            stroke="#d97706"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            name="Alt Fwd CG Limit I"
            connectNulls
          />
          {variant === '300ER' && (
            <Line
              data={envelopeData.altFwdCGLimitTakeoff2}
              type="linear"
              dataKey="weight"
              stroke="#9333ea"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Alt Fwd CG Limit II"
              connectNulls
            />
          )}
          {loadingLine.length > 1 && (
            <Line
              data={loadingLine}
              type="linear"
              dataKey="weight"
              stroke="#f59e0b"
              strokeWidth={3}
              dot={{ r: 4 }}
              name="Loading Progression"
              connectNulls
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}