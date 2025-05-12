import React, { useEffect, useRef, useState } from "react";
import * as recharts from "recharts";

const THEMES = {
  blue: "hsl(var(--chart-1))",
  red: "hsl(var(--chart-2))",
  green: "hsl(var(--chart-3))",
  purple: "hsl(var(--chart-4))",
  orange: "hsl(var(--chart-5))",
};

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  );
};

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error("useChart must be used within a ChartProvider");
  }
  return context;
}

const ChartProvider = ({
  children,
  config,
}: {
  children: React.ReactNode;
  config: ChartConfig;
}) => {
  return (
    <ChartContext.Provider value={{ config }}>{children}</ChartContext.Provider>
  );
};

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  return (
    <style>
      {Object.entries(config).map(([key, value]) => {
        return `.${id} .recharts-layer.${key} path {
           stroke: ${value.color ? value.color : value.theme?.blue};
           fill: ${value.color ? value.color : value.theme?.blue};
           }`;
      })}
    </style>
  );
};

function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: any[],
  props: any
) {
  return payload.map((item) => {
    const dataKey = item.dataKey || "";
    const itemConfig = config[dataKey] || {
      color: `var(--${dataKey})`,
    };
    return {
      payload: item,
      color: itemConfig.color,
      label: itemConfig.label || dataKey,
      icon: itemConfig.icon ? <itemConfig.icon /> : null,
      ...props,
    };
  });
}

type ChartProps = {
  data: any[];
  type: "area" | "bar" | "line" | "pie";
  options?: any;
};

export function Chart({ data, type, options = {} }: ChartProps) {
  const [id] = useState(() => `chart-${Math.random().toString(36).substring(2, 9)}`);
  const config = {} as ChartConfig;
  
  // Default options
  const defaultOptions = {
    margin: { top: 20, right: 20, bottom: 20, left: 20 },
    width: 300,
    height: 300,
    innerRadius: 0,
    outerRadius: 100,
    label: true,
  };
  
  const mergedOptions = { ...defaultOptions, ...options };
  
  const renderChart = () => {
    switch (type) {
      case "pie":
        return (
          <recharts.PieChart
            width={mergedOptions.width}
            height={mergedOptions.height}
            margin={mergedOptions.margin}
          >
            <recharts.Pie
              data={data}
              nameKey="name"
              dataKey="value"
              innerRadius={mergedOptions.innerRadius}
              outerRadius={mergedOptions.outerRadius}
              paddingAngle={5}
              label={mergedOptions.label}
              isAnimationActive={true}
            >
              {data.map((entry, index) => (
                <recharts.Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </recharts.Pie>
            {mergedOptions.legend && <recharts.Legend />}
            {mergedOptions.tooltip && <recharts.Tooltip />}
          </recharts.PieChart>
        );
      
      case "bar":
        return (
          <recharts.BarChart
            width={mergedOptions.width}
            height={mergedOptions.height}
            data={data}
            margin={mergedOptions.margin}
          >
            <recharts.CartesianGrid strokeDasharray="3 3" />
            <recharts.XAxis dataKey="name" />
            <recharts.YAxis />
            <recharts.Tooltip />
            {mergedOptions.legend && <recharts.Legend />}
            <recharts.Bar dataKey="value" fill="#8884d8" />
          </recharts.BarChart>
        );
      
      case "line":
        return (
          <recharts.LineChart
            width={mergedOptions.width}
            height={mergedOptions.height}
            data={data}
            margin={mergedOptions.margin}
          >
            <recharts.CartesianGrid strokeDasharray="3 3" />
            <recharts.XAxis dataKey="name" />
            <recharts.YAxis />
            <recharts.Tooltip />
            {mergedOptions.legend && <recharts.Legend />}
            <recharts.Line
              type="monotone"
              dataKey="value"
              stroke="#8884d8"
              activeDot={{ r: 8 }}
            />
          </recharts.LineChart>
        );
      
      case "area":
        return (
          <recharts.AreaChart
            width={mergedOptions.width}
            height={mergedOptions.height}
            data={data}
            margin={mergedOptions.margin}
          >
            <recharts.CartesianGrid strokeDasharray="3 3" />
            <recharts.XAxis dataKey="name" />
            <recharts.YAxis />
            <recharts.Tooltip />
            {mergedOptions.legend && <recharts.Legend />}
            <recharts.Area
              type="monotone"
              dataKey="value"
              stroke="#8884d8"
              fill="#8884d8"
            />
          </recharts.AreaChart>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={id}>
      <ChartStyle id={id} config={config} />
      {renderChart()}
    </div>
  );
}