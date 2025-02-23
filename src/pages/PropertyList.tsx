import React, { useState } from 'react';
import { MainNav } from "@/components/MainNav";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building, MoreHorizontal, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from 'react-router-dom';

const mockProperties = [
  {
    id: 1,
    name: "Sunset Apartments",
    address: "123 Main St",
    units: 24,
    owner: "John Doe",
    status: "Occupied",
  },
  {
    id: 2,
    name: "Ocean View Complex",
    address: "456 Beach Rd",
    units: 12,
    owner: "Jane Smith",
    status: "Vacant",
  },
];

const PropertyList = () => {
  const [filterStatus, setFilterStatus] = useState<string>("all");

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground ">
      <MainNav />
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Properties</h1>
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <Select
              value={filterStatus}
              onValueChange={setFilterStatus}
            >
              <SelectTrigger className="w-full sm:w-[180px] bg-background border-input">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Properties</SelectItem>
                <SelectItem value="occupied">Occupied</SelectItem>
                <SelectItem value="vacant">Vacant</SelectItem>
              </SelectContent>
            </Select>
            <Button className="w-full sm:w-auto">
              <Building className="mr-2 h-4 w-4" />
            <Link to="/property/add">  Add Property</Link>
            </Button>
          </div>
        </div>

        <div className="rounded-md border border-input bg-background">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-muted/50">
                <TableHead className="">Name</TableHead>
                <TableHead className="">Address</TableHead>
                <TableHead className="">Units</TableHead>
                <TableHead className="">Owner</TableHead>
                <TableHead className="">Status</TableHead>
                <TableHead className="text-right ">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockProperties.map((property) => (
                <TableRow 
                  key={property.id}
                  className="hover:bg-muted/50"
                >
                  <TableCell className="font-medium">{property.name}</TableCell>
                  <TableCell>{property.address}</TableCell>
                  <TableCell>{property.units}</TableCell>
                  <TableCell>{property.owner}</TableCell>
                  <TableCell>
                    <span className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                      property.status === "Occupied" ? 
                        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" :
                        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                    )}>
                      {property.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover border-border">
                        <DropdownMenuLabel className="">Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>View details</DropdownMenuItem>
                        <DropdownMenuItem>Edit property</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive">
                          Delete property
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default PropertyList;