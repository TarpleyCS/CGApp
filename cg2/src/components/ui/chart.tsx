"use client"

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip"

export function ChartContainer({ config, children, className }) {
  return (
    <div className={className}>
      <style jsx global>{`
        :root {
          ${Object.entries(config)
            .map(([key, value]) => `--color-${key}: ${value.color};`)
            .join("\n")}
        }
      `}</style>
      {children}
    </div>
  )
}

export function ChartTooltip({ children, ...props }) {
  return (
    <TooltipProvider>
      <Tooltip {...props}>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
      </Tooltip>
    </TooltipProvider>
  )
}

export function ChartTooltipContent({ active, payload, label, hideLabel }) {
  if (active && payload && payload.length) {
    return (
      <TooltipContent className="bg-background border rounded-lg shadow-lg p-2">
        {!hideLabel && <p className="font-medium">{label}</p>}
        {payload.map((item, index) => (
          <p key={index} style={{ color: item.color }}>
            {item.name}: {item.value}
          </p>
        ))}
      </TooltipContent>
    )
  }

  return null
}

