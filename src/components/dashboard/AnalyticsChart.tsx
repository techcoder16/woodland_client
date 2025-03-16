
import React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock data for the charts
const revenueData = [
  { month: "Jan", revenue: 12000, expenses: 8000 },
  { month: "Feb", revenue: 14000, expenses: 8200 },
  { month: "Mar", revenue: 15500, expenses: 9000 },
  { month: "Apr", revenue: 17000, expenses: 9500 },
  { month: "May", revenue: 18500, expenses: 9800 },
  { month: "Jun", revenue: 20000, expenses: 10000 },
  { month: "Jul", revenue: 22000, expenses: 10500 },
];

const occupancyData = [
  { month: "Jan", occupancy: 88 },
  { month: "Feb", occupancy: 90 },
  { month: "Mar", occupancy: 92 },
  { month: "Apr", occupancy: 91 },
  { month: "May", occupancy: 93 },
  { month: "Jun", occupancy: 94 },
  { month: "Jul", occupancy: 96 },
];

const propertyTypeData = [
  { name: "Residential", value: 65 },
  { name: "Commercial", value: 25 },
  { name: "Industrial", value: 10 },
];

const propertyStatusData = [
  { name: "Occupied", value: 75 },
  { name: "Vacant", value: 15 },
  { name: "Under Maintenance", value: 10 },
];

export function AnalyticsChart() {
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Analytics Overview</CardTitle>
        <CardDescription>View performance metrics and property statistics</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="revenue">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="occupancy">Occupancy</TabsTrigger>
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
          </TabsList>
          
          <TabsContent value="revenue" className="h-[350px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={revenueData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "var(--card)",
                    borderColor: "var(--border)" 
                  }} 
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  activeDot={{ r: 8 }}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>
          
          <TabsContent value="occupancy" className="h-[350px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={occupancyData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "var(--card)",
                    borderColor: "var(--border)" 
                  }} 
                />
                <Area
                  type="monotone"
                  dataKey="occupancy"
                  stroke="hsl(var(--primary))"
                  fill="hsla(var(--primary), 0.2)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </TabsContent>
          
          <TabsContent value="distribution" className="h-[350px] mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
              <div className="flex flex-col">
                <h3 className="text-center text-sm font-medium mb-2">Property Types</h3>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={propertyTypeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="hsl(var(--primary))"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "var(--card)",
                          borderColor: "var(--border)" 
                        }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="flex flex-col">
                <h3 className="text-center text-sm font-medium mb-2">Property Status</h3>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={propertyStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="hsl(var(--primary))"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "var(--card)",
                          borderColor: "var(--border)" 
                        }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
