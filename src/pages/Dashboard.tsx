// src/pages/Dashboard.tsx
import React, { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../redux/reduxHooks";
import { fetchDashboardStats, fetchRecentActivities } from "../redux/dataStore/dashboardSlice";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { AnalyticsChart } from "@/components/dashboard/AnalyticsChart";
import { RecentActivities } from "@/components/dashboard/RecentActivities";

const Dashboard = () => {
  const dispatch = useAppDispatch();
  const { stats, loading, error } = useAppSelector((state) => state.dashboard);

  useEffect(() => {
    // Fetch dashboard data from your APIs
    console.log('Dashboard - Fetching stats...');
    dispatch(fetchDashboardStats());
    dispatch(fetchRecentActivities(10));
  }, [dispatch]);

  // Debug logging
  console.log('Dashboard - stats:', stats);
  console.log('Dashboard - loading:', loading);
  console.log('Dashboard - error:', error);

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
