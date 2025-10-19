
import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../redux/reduxHooks";
import { get } from "../../helper/api";
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

// Default data for fallback
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

        // Fetch all analytics data
        const [revenueResponse, occupancyResponse, propertyTypeResponse, propertyStatusResponse] = await Promise.all([
          get('/dashboard/analytics/revenue'),
          get('/dashboard/analytics/occupancy'),
          get('/dashboard/analytics/property-types'),
          get('/dashboard/analytics/property-status')
        ]);

        // Update state with API data
        if (revenueResponse.data) {
          setRevenueData(revenueResponse.data);
        }
        if (occupancyResponse.data) {
          setOccupancyData(occupancyResponse.data);
        }
        if (propertyTypeResponse.data) {
          setPropertyTypeData(propertyTypeResponse.data);
        }
        if (propertyStatusResponse.data) {
          setPropertyStatusData(propertyStatusResponse.data);
        }

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
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Analytics Overview</CardTitle>
          <CardDescription>Loading analytics data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading analytics...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Analytics Overview</CardTitle>
          <CardDescription>Error loading analytics data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] flex items-center justify-center">
            <div className="text-center text-red-600">
              <p>Failed to load analytics data</p>
              <p className="text-sm text-gray-500 mt-2">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

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
