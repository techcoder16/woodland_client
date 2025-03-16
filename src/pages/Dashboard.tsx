// src/pages/Dashboard.tsx
import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { AnalyticsChart } from "@/components/dashboard/AnalyticsChart";
import { RecentActivities } from "@/components/dashboard/RecentActivities";

const Dashboard = () => {
  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <DashboardStats />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-card rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Analytics Overview</h2>
              <AnalyticsChart />
            </div>
          </div>
          <div>
            <div className="bg-card rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Recent Activities</h2>
              <RecentActivities />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
