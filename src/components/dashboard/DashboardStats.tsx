
import React from "react";
import { ArrowUp, Building, DollarSign, TrendingUp, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  percentageChange: number;
  icon: React.ElementType;
  trend: "up" | "down" | "neutral";
}

function StatCard({ title, value, percentageChange, icon: Icon, trend }: StatCardProps) {
  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">
          <span
            className={cn(
              "inline-flex items-center gap-1 font-medium",
              trend === "up" && "text-green-500",
              trend === "down" && "text-red-500"
            )}
          >
            {trend === "up" && <ArrowUp className="h-3 w-3" />}
            {trend === "down" && <ArrowUp className="h-3 w-3 rotate-180" />}
            {percentageChange}%
          </span>{" "}
          vs previous month
        </p>
      </CardContent>
    </Card>
  );
}

export function DashboardStats() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Properties"
        value="125"
        percentageChange={12}
        icon={Building}
        trend="up"
      />
      <StatCard
        title="Active Vendors"
        value="48"
        percentageChange={8}
        icon={Users}
        trend="up"
      />
      <StatCard
        title="Monthly Revenue"
        value="$48,572"
        percentageChange={4}
        icon={DollarSign}
        trend="up"
      />
      <StatCard
        title="Occupancy Rate"
        value="94.2%"
        percentageChange={2.4}
        icon={TrendingUp}
        trend="up"
      />
    </div>
  );
}
