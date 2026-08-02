import React, { useEffect, useState } from "react";
import { get } from "../../helper/api";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Line,
  ComposedChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CATEGORICAL = ["#C01739", "#2059C7", "#0F7A45", "#9A6209"];

const defaultRevenueData = [
  { month: "Jan", revenue: 0, expenses: 0 },
  { month: "Feb", revenue: 0, expenses: 0 },
  { month: "Mar", revenue: 0, expenses: 0 },
  { month: "Apr", revenue: 0, expenses: 0 },
  { month: "May", revenue: 0, expenses: 0 },
  { month: "Jun", revenue: 0, expenses: 0 },
  { month: "Jul", revenue: 0, expenses: 0 },
];

const defaultOccupancyData = [
  { month: "Jan", occupancy: 0 },
  { month: "Feb", occupancy: 0 },
  { month: "Mar", occupancy: 0 },
  { month: "Apr", occupancy: 0 },
  { month: "May", occupancy: 0 },
  { month: "Jun", occupancy: 0 },
  { month: "Jul", occupancy: 0 },
];

const defaultPropertyTypeData = [
  { name: "Residential", value: 0 },
  { name: "Commercial", value: 0 },
  { name: "Industrial", value: 0 },
];

const defaultPropertyStatusData = [
  { name: "Occupied", value: 0 },
  { name: "Vacant", value: 0 },
  { name: "Under Maintenance", value: 0 },
];

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-sleek-md text-xs">
      {label && <div className="font-mono text-muted-foreground mb-1">{label}</div>}
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: p.color || p.fill }} />
          <span className="text-muted-foreground">{p.name}</span>
          <span className="font-mono font-medium text-foreground ml-auto tabular-nums">
            {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function Donut({ data, colors }: { data: { name: string; value: number }[]; colors: string[] }) {
  const total = data.reduce((s, d) => s + (d.value || 0), 0);
  return (
    <div className="relative flex-1 min-h-[180px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={62}
            outerRadius={84}
            paddingAngle={2}
            cornerRadius={4}
            dataKey="value"
            stroke="hsl(var(--card))"
            strokeWidth={2}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="stat-figure text-2xl">{total}</span>
        <span className="text-[11px] text-muted-foreground">total</span>
      </div>
    </div>
  );
}

function DonutLegend({ data, colors }: { data: { name: string; value: number }[]; colors: string[] }) {
  const total = data.reduce((s, d) => s + (d.value || 0), 0) || 1;
  return (
    <div className="flex flex-col gap-1.5 mt-3">
      {data.map((d, i) => (
        <div key={d.name} className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-sm shrink-0" style={{ background: colors[i % colors.length] }} />
          <span className="text-muted-foreground truncate">{d.name}</span>
          <span className="ml-auto font-mono text-foreground tabular-nums">
            {Math.round((d.value / total) * 100)}%
          </span>
        </div>
      ))}
    </div>
  );
}

export function AnalyticsChart() {
  const [revenueData, setRevenueData] = useState(defaultRevenueData);
  const [occupancyData, setOccupancyData] = useState(defaultOccupancyData);
  const [propertyTypeData, setPropertyTypeData] = useState(defaultPropertyTypeData);
  const [propertyStatusData, setPropertyStatusData] = useState(defaultPropertyStatusData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [revenueResponse, occupancyResponse, propertyTypeResponse, propertyStatusResponse] = await Promise.all([
          get<typeof defaultRevenueData>('/dashboard/analytics/revenue'),
          get<typeof defaultOccupancyData>('/dashboard/analytics/occupancy'),
          get<typeof defaultPropertyTypeData>('/dashboard/analytics/property-types'),
          get<typeof defaultPropertyStatusData>('/dashboard/analytics/property-status'),
        ]);

        if (revenueResponse.data) setRevenueData(revenueResponse.data);
        if (occupancyResponse.data) setOccupancyData(occupancyResponse.data);
        if (propertyTypeResponse.data) setPropertyTypeData(propertyTypeResponse.data);
        if (propertyStatusResponse.data) setPropertyStatusData(propertyStatusResponse.data);
      } catch (err: any) {
        console.error('Failed to fetch analytics data:', err);
        setError(err.message || 'Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, []);

  if (loading) {
    return (
      <div className="h-[350px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading analytics…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[350px] flex items-center justify-center">
        <div className="text-center text-destructive">
          <p className="text-sm font-medium">Failed to load analytics data</p>
          <p className="text-xs text-muted-foreground mt-1">{error}</p>
        </div>
      </div>
    );
  }

  const totalRevenue = revenueData.reduce((s, d) => s + d.revenue, 0);
  const totalExpenses = revenueData.reduce((s, d) => s + d.expenses, 0);
  const avgOccupancy = Math.round(
    occupancyData.reduce((s, d) => s + d.occupancy, 0) / (occupancyData.length || 1)
  );

  return (
    <Tabs defaultValue="revenue">
      <div className="flex items-center justify-between gap-4 mb-5">
        <TabsList className="bg-muted/60">
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="occupancy">Occupancy</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="revenue" className="mt-0">
        <div className="flex items-baseline gap-6 mb-4">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Revenue</div>
            <div className="stat-figure text-primary">${totalRevenue.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Expenses</div>
            <div className="stat-figure text-muted-foreground">${totalExpenses.toLocaleString()}</div>
          </div>
        </div>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={revenueData} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" opacity={0.6} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                width={40}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#revFill)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                dataKey="expenses"
                name="Expenses"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={1.5}
                strokeDasharray="4 3"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </TabsContent>

      <TabsContent value="occupancy" className="mt-0">
        <div className="mb-4">
          <div className="text-xs text-muted-foreground mb-1">Average occupancy</div>
          <div className="stat-figure text-primary">{avgOccupancy}%</div>
        </div>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={occupancyData} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="occFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" opacity={0.6} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                width={40}
                unit="%"
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="occupancy"
                name="Occupancy"
                stroke="hsl(var(--success))"
                strokeWidth={2}
                fill="url(#occFill)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </TabsContent>

      <TabsContent value="distribution" className="mt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex flex-col">
            <h3 className="text-xs font-medium text-muted-foreground mb-1">Property types</h3>
            <Donut data={propertyTypeData} colors={CATEGORICAL} />
            <DonutLegend data={propertyTypeData} colors={CATEGORICAL} />
          </div>
          <div className="flex flex-col">
            <h3 className="text-xs font-medium text-muted-foreground mb-1">Property status</h3>
            <Donut data={propertyStatusData} colors={CATEGORICAL} />
            <DonutLegend data={propertyStatusData} colors={CATEGORICAL} />
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
