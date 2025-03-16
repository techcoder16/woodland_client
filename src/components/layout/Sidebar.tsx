
import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  BarChart3,
  Building,
  ChevronDown,
  ChevronUp,
  FileText,
  Home,
  ListFilter,
  Settings,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  isActive?: boolean;
  end?: boolean;
}

function NavItem({ href, icon: Icon, label, end = false }: NavItemProps) {
  return (
    <NavLink
      to={href}
      end={end}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
          isActive
            ? "bg-primary/10 text-primary font-medium"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )
      }
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </NavLink>
  );
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [manageOpen, setManageOpen] = React.useState(true);
  const [reportsOpen, setReportsOpen] = React.useState(false);
  const location = useLocation();

  const sidebar = (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-20 flex w-64 flex-col bg-sidebar border-r shadow-sm transition-transform duration-300",
        isOpen ? "translate-x-0" : "-translate-x-full",
        "md:translate-x-0"
      )}
    >
      <div className="flex h-16 items-center border-b px-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
            <span className="text-white font-bold">PM</span>
          </div>
          <span className="font-bold text-lg font-heading">Property Manager</span>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute right-2 top-3 md:hidden"
        >
          <ChevronDown className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="flex-1 overflow-auto py-4 px-3">
        <div className="space-y-1">
          <NavItem href="/dashboard" icon={Home} label="Dashboard" end />
          
          <Collapsible
            open={manageOpen}
            onOpenChange={setManageOpen}
            className="pt-2"
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Building className="h-4 w-4" />
                  <span>Management</span>
                </div>
                {manageOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 pt-1 pl-6">
              <NavItem href="/properties" icon={Building} label="Properties" />
              <NavItem href="/vendors" icon={Users} label="Vendors" />
            </CollapsibleContent>
          </Collapsible>
          
          <Collapsible
            open={reportsOpen}
            onOpenChange={setReportsOpen}
            className="pt-2"
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-3 text-muted-foreground">
                  <BarChart3 className="h-4 w-4" />
                  <span>Reports</span>
                </div>
                {reportsOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 pt-1 pl-6">
              <NavItem
                href="/reports/analytics"
                icon={BarChart3}
                label="Analytics"
              />
              <NavItem
                href="/reports/documents"
                icon={FileText}
                label="Documents"
              />
            </CollapsibleContent>
          </Collapsible>
          
          <Separator className="my-4" />
          
          <NavItem href="/settings" icon={Settings} label="Settings" />
        </div>
      </div>
    </aside>
  );

  const overlay = isOpen && (
    <div
      className="fixed inset-0 z-10 bg-background/80 backdrop-blur-sm md:hidden"
      onClick={onClose}
    />
  );

  return (
    <>
      {sidebar}
      {overlay}
    </>
  );
}
