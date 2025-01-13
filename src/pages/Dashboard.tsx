import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie } from 'recharts';
import { Users, Building, TrendingUp, Activity } from 'lucide-react';
import { MainNav } from "@/components/MainNav";

const mockData = {
  landlordStats: [
    { month: 'Jan', count: 4, revenue: 2400 },
    { month: 'Feb', count: 7, revenue: 3600 },
    { month: 'Mar', count: 5, revenue: 4000 },
    { month: 'Apr', count: 8, revenue: 5000 },
    { month: 'May', count: 12, revenue: 6000 },
    { month: 'Jun', count: 15, revenue: 7000 },
  ],
  propertyDistribution: [
    { name: 'Residential', value: 400 },
    { name: 'Commercial', value: 300 },
    { name: 'Industrial', value: 200 },
  ],
  totalLandlords: 51,
  activeProperties: 124,
  totalRevenue: "$45,678",
  growthRate: "+12.5%"
};

const chartConfig = {
  landlords: {
    label: "Landlords",
    theme: {
      light: "hsl(221.2 83.2% 53.3%)",
      dark: "hsl(217.2 91.2% 59.8%)",
    },
  },
  revenue: {
    label: "Revenue",
    theme: {
      light: "hsl(142.1 76.2% 36.3%)",
      dark: "hsl(142.1 70.6% 45.3%)",
    },
  },
};

const Dashboard = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MainNav />
      <div className="container mx-auto p-6 space-y-6 flex-1">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Landlords</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockData.totalLandlords}</div>
              <p className="text-xs text-muted-foreground">+2 from last month</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Properties</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockData.activeProperties}</div>
              <p className="text-xs text-muted-foreground">+5 from last month</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockData.totalRevenue}</div>
              <p className="text-xs text-muted-foreground">+12% from last month</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockData.growthRate}</div>
              <p className="text-xs text-muted-foreground">Increased by 2.3%</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Landlord Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer className="h-[300px]" config={chartConfig}>
                <BarChart data={mockData.landlordStats}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Bar
                    dataKey="count"
                    fill="var(--color-landlords)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Tooltip content={<ChartTooltipContent />} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer className="h-[300px]" config={chartConfig}>
                <LineChart data={mockData.landlordStats}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--color-revenue)"
                    strokeWidth={2}
                  />
                  <Tooltip content={<ChartTooltipContent />} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Property Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer className="h-[300px]" config={chartConfig}>
              <PieChart>
                <Pie
                  data={mockData.propertyDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="var(--color-landlords)"
                  label
                />
                <Tooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;