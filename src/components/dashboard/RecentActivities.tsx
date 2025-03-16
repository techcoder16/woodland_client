
import React from "react";
import { 
  Building, 
  Check, 
  Clock, 
  FileCheck, 
  FileText, 
  Plus, 
  User
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ActivityType = "property" | "vendor" | "document" | "payment";

interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  time: string;
  isNew?: boolean;
}

const activities: Activity[] = [
  {
    id: "1",
    type: "property",
    title: "Property Added",
    description: "New property '123 Main St' was added by Admin",
    time: "1 hour ago",
    isNew: true,
  },
  {
    id: "2",
    type: "vendor",
    title: "Vendor Updated",
    description: "Vendor 'ABC Maintenance' details were updated",
    time: "3 hours ago",
  },
  {
    id: "3",
    type: "document",
    title: "Document Uploaded",
    description: "Lease agreement for '456 Oak Ave' was uploaded",
    time: "5 hours ago",
  },
  {
    id: "4",
    type: "payment",
    title: "Payment Received",
    description: "Received $1,200 for 'Apartment 3B' rent",
    time: "1 day ago",
  },
  {
    id: "5",
    type: "property",
    title: "Property Inspection",
    description: "Scheduled maintenance inspection for '789 Pine Rd'",
    time: "2 days ago",
  },
];

function getActivityIcon(type: ActivityType) {
  switch (type) {
    case "property":
      return Building;
    case "vendor":
      return User;
    case "document":
      return FileText;
    case "payment":
      return Check;
    default:
      return Clock;
  }
}

export function RecentActivities() {
  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Activities</CardTitle>
          <CardDescription>Latest updates and notifications</CardDescription>
        </div>
        <Button variant="outline" size="sm">
          View All
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = getActivityIcon(activity.type);
            
            return (
              <div
                key={activity.id}
                className={cn(
                  "flex items-start gap-4 rounded-lg p-3 transition-colors",
                  activity.isNew && "bg-muted/50"
                )}
              >
                <div className="flex-shrink-0 mt-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{activity.title}</p>
                    {activity.isNew && (
                      <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-800 dark:border-red-900/20 dark:bg-red-900/10 dark:text-red-500">
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{activity.description}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
