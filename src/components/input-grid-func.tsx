"use client"

import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { WeightChart } from "./WeightChart"
import { LoadingGrid } from "./LoadingGrid"
import { LoadingTable } from "./components/loading-table"

const POSITION_MAP = {
  AL: 460,
  AR: 460,
  BL: 586,
  BR: 586,
  CL: 712,
  CR: 712,
  DL: 838,
  DR: 838,
  EL: 964,
  ER: 964,
  FL: 1090,
  FR: 1090,
  GL: 1216,
  GR: 1216,
  HL: 1342,
  HR: 1342,
  JL: 1468,
  JR: 1468,
  KL: 1594,
  KR: 1594,
  LL: 1719,
  LR: 1719,
  ML: 1858,
  MR: 1858,
  PL: 1984,
  PR: 1984,
  R: 2095,
}

function momentArmToCG(momentArm: number): number {
  return ((momentArm - 1174.5) * 100) / 278.5
}
function WeightCalculator() {
  const [weights, setWeights] = useState<Array<{ weight: number; position: string }>>([])
  const [loadingPoints, setLoadingPoints] = useState<Array<{ cg: number; weight: number }>>([])
  const [chartData, setChartData] = useState<number[][]>([])
  const [tableData, setTableData] = useState<any[]>([])
  const [isComputed, setIsComputed] = useState(false)
  const [variant, setVariant] = useState<'300ER' | '200LR'>('300ER')
  const [selectedPattern, setSelectedPattern] = useState('default')

  // Define loading patterns
  const loadingPatterns = {
    default: [  'R', 'PL', 'PR', 'AL', 'AR', 'BL', 'BR', 'CL', 'CR', 'DL', 'DR', 'EL', 'ER', 'FL', 'FR', 'GL', 'GR', 'HL', 'HR', 'JL', 'JR', 'KL', 'KR', 'LR', 'LL', 'ML', 'MR'],
    forward: ['R', 'AL', 'AR', 'BL', 'BR', 'CL', 'CR', 'DL', 'DR', 'PL', 'PR'],
    aft: ['ML', 'MR', 'LL', 'LR', 'KL', 'KR', 'JL', 'JR', 'HL', 'HR', 'GL', 'GR'],
    balanced: ['FL', 'FR', 'EL', 'ER', 'DL', 'DR', 'GL', 'GR', 'JL', 'JR', 'ML', 'MR'],
  }

  const OEW300ER = {
    weight: 321000,
    momentArm: 1230,
    moment: 394830000,
    mac: 19.92818671,
  }
  
  const OEW200LR = {
    weight: 308000,
    momentArm: 1236,
    moment: 380811200,
    mac: 22.22621185,
  }

  const OEW = variant === '300ER' ? OEW300ER : OEW200LR

  const handleCompute = () => {
    const computeWeights = [...weights]

    let currentWeight = OEW.weight
    let currentMoment = OEW.moment
    const newTableData = [
      {
        position: "OEW",
        momentArm: OEW.momentArm,
        weight: OEW.weight,
        moment: OEW.moment,
        sumWeight: currentWeight,
        sumMoment: currentMoment,
        sumBA: OEW.momentArm,
        mac: OEW.mac,
      },
    ]

    computeWeights.forEach(({ weight, position }) => {
      if (weight === 0) return

      const momentArm = POSITION_MAP[position]
      const moment = weight * momentArm
      currentWeight += weight
      currentMoment += moment
      const sumBA = currentMoment / currentWeight
      const mac = momentArmToCG(sumBA)

      newTableData.push({
        position,
        momentArm,
        weight,
        moment,
        sumWeight: currentWeight,
        sumMoment: currentMoment,
        sumBA,
        mac,
      })
    })

    setTableData(newTableData)
    setIsComputed(true)

    // Update loading points for the chart
    const points = newTableData.map((row) => ({
      cg: row.mac,
      weight: row.sumWeight,
    }))
    setLoadingPoints(points)
  }

  const handleWeightChange = (newWeights: Array<{ weight: number; position: string }>) => {
    setWeights(newWeights)
    setIsComputed(false)
  }

  return (
    <div className="space-y-8 p-4">
      <div className="flex gap-4 items-center justify-between">
        <div className="flex gap-2">
          <Button
            onClick={() => setVariant('300ER')}
            variant={variant === '300ER' ? 'default' : 'outline'}
          >
            777-300ER
          </Button>
          <Button
            onClick={() => setVariant('200LR')}
            variant={variant === '200LR' ? 'default' : 'outline'}
          >
            777-200LR
          </Button>
        </div>
        <select
          className="px-3 py-2 border rounded-md"
          value={selectedPattern}
          onChange={(e) => {
            setSelectedPattern(e.target.value)
            // Reset weights when pattern changes
            setWeights([{ weight: 0, position: loadingPatterns[e.target.value as keyof typeof loadingPatterns][0] }])
            setIsComputed(false)
          }}
        >
          <option value="default">Default Loading Pattern</option>
          <option value="forward">Forward Loading</option>
          <option value="aft">Aft Loading</option>
          <option value="balanced">Balanced Loading</option>
        </select>
      </div>

      <LoadingGrid 
        onWeightChange={handleWeightChange} 
        onCompute={handleCompute}
        loadingSequence={loadingPatterns[selectedPattern as keyof typeof loadingPatterns]}
      />
      
      {variant === '300ER' ? (
        <WeightChart variant="300ER" loadingPoints={loadingPoints} data={chartData} />
      ) : (
        <WeightChart200 variant="200LR" loadingPoints={loadingPoints} data={chartData} />
      )}

      {isComputed && tableData.length > 0 && <LoadingTable data={tableData} />}

      {loadingPoints.length > 0 && (
        <div className="text-center text-sm text-gray-600">
          Current Weight: {new Intl.NumberFormat().format(loadingPoints[loadingPoints.length - 1].weight)} lbs
          <br />
          Current CG: {loadingPoints[loadingPoints.length - 1].cg.toFixed(1)}% MAC
        </div>
      )}
    </div>
  )
}

export default WeightCalculator
