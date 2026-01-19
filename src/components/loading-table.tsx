import { convertWeight, getWeightUnit } from '@/lib/units';

interface LoadingTableProps {
    data: Array<{
      position: string
      momentArm: number
      weight: number
      moment: number
      sumWeight: number
      sumMoment: number
      sumBA: number
      mac: number
    }>
    units?: 'LB' | 'KG'
  }
  
  export function LoadingTable({ data, units = 'LB' }: LoadingTableProps) {
    return (
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[800px] border-collapse">
          <thead>
            <tr className="border-b">
              <th className="p-2 text-left">Position</th>
              <th className="p-2 text-right">Moment Arm</th>
              <th className="p-2 text-right">Weight ({getWeightUnit(units)})</th>
              <th className="p-2 text-right">Moment</th>
              <th className="p-2 text-right">Sum Weight ({getWeightUnit(units)})</th>
              <th className="p-2 text-right">Sum Moment</th>
              <th className="p-2 text-right">Sum BA</th>
              <th className="p-2 text-right">%MAC</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index} className="border-b">
                <td className="p-2">{row.position}</td>
                <td className="p-2 text-right">{row.momentArm.toFixed(1)}</td>
                <td className="p-2 text-right">{convertWeight(row.weight, units).toFixed(1)}</td>
                <td className="p-2 text-right">{row.moment.toFixed(1)}</td>
                <td className="p-2 text-right">{convertWeight(row.sumWeight, units).toFixed(1)}</td>
                <td className="p-2 text-right">{row.sumMoment.toFixed(1)}</td>
                <td className="p-2 text-right">{row.sumBA.toFixed(1)}</td>
                <td className="p-2 text-right">{row.mac.toFixed(8)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }
  
  