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
  const { stats } = useAppSelector((state) => state.dashboard);

  useEffect(() => {
    dispatch(fetchDashboardStats());
    dispatch(fetchRecentActivities(10));
  }, [dispatch]);

  const unwrap = (v: unknown) =>
    v && typeof v === 'object' && 'value' in (v as any) ? (v as any).value : v;

  const totalProperties = unwrap(stats?.totalProperties);
  const totalTenants = unwrap(stats?.totalTenants);
  const published = unwrap(stats?.publishedProperties);
  const drafts = unwrap(stats?.draftProperties);

  return (
    <DashboardLayout>
      <div className="space-y-10">
        <div className="pt-2 pb-1">
          <h1 className="hero-stat max-w-2xl">
            You're managing <b className="text-primary">{totalProperties ?? '—'}</b> properties and{' '}
            <b>{totalTenants ?? '—'}</b> tenants right now.
          </h1>
          {(published || drafts) && (
            <div className="flex items-center gap-5 mt-4">
              <div className="flex items-center gap-1.5 text-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                <span className="font-mono text-foreground">{published ?? 0}</span>
                <span className="text-muted-foreground">published</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                <span className="font-mono text-foreground">{drafts ?? 0}</span>
                <span className="text-muted-foreground">in draft</span>
              </div>
            </div>
          )}
        </div>

        <DashboardStats />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 surface p-6">
            <h2 className="text-sm font-medium text-muted-foreground mb-4">Analytics overview</h2>
            <AnalyticsChart />
          </div>
          <div className="surface p-6">
            <h2 className="text-sm font-medium text-muted-foreground mb-2">Recent activity</h2>
            <RecentActivities />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
