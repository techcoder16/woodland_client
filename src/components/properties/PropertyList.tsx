
import React, { useState } from "react";
import { 
  Building, 
  ChevronDown, 
  Edit, 
  FileDown, 
  Filter, 
  MoreHorizontal, 
  Plus, 
  Search, 
  Trash, 
  User 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

// Mock property data
const properties = [
  {
    id: "p1",
    name: "Sunset Apartments",
    address: "123 Main St, City, State",
    type: "Residential",
    units: 24,
    status: "Active",
    occupancyRate: 92,
  },
  {
    id: "p2",
    name: "Downtown Office Complex",
    address: "456 Business Ave, City, State",
    type: "Commercial",
    units: 12,
    status: "Active",
    occupancyRate: 85,
  },
  {
    id: "p3",
    name: "Riverfront Condos",
    address: "789 River Rd, City, State",
    type: "Residential",
    units: 18,
    status: "Active",
    occupancyRate: 95,
  },
  {
    id: "p4",
    name: "Industrial Park",
    address: "456 Factory Ln, City, State",
    type: "Industrial",
    units: 8,
    status: "Active",
    occupancyRate: 75,
  },
  {
    id: "p5",
    name: "Highland Townhomes",
    address: "234 Hill St, City, State",
    type: "Residential",
    units: 16,
    status: "Under Maintenance",
    occupancyRate: 88,
  },
];

export function PropertyList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [propertyType, setPropertyType] = useState("all");
  const [propertyStatus, setPropertyStatus] = useState("all");
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  
  const navigate = useNavigate();

  // Filter properties based on search and filters
  const filteredProperties = properties.filter((property) => {
    const matchesSearch = property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = propertyType === "all" || property.type === propertyType;
    const matchesStatus = propertyStatus === "all" || property.status === propertyStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleSelectProperty = (id: string) => {
    setSelectedProperties((prev) =>
      prev.includes(id)
        ? prev.filter((propId) => propId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedProperties.length === filteredProperties.length) {
      setSelectedProperties([]);
    } else {
      setSelectedProperties(filteredProperties.map((p) => p.id));
    }
  };

  const handleExport = () => {
    toast.success("Properties exported to CSV");
  };

  const handleDelete = (id: string) => {
    toast.success(`Property ${id} deleted successfully`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search properties..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Button variant="outline" size="icon" className="shrink-0">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <Select value={propertyType} onValueChange={setPropertyType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Property Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Residential">Residential</SelectItem>
              <SelectItem value="Commercial">Commercial</SelectItem>
              <SelectItem value="Industrial">Industrial</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={propertyStatus} onValueChange={setPropertyStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
              <SelectItem value="Under Maintenance">Under Maintenance</SelectItem>
            </SelectContent>
          </Select>
          
          <Button className="ml-auto" onClick={() => navigate("/properties/add")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Property
          </Button>
        </div>
      </div>

      <div className="glass-card rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-3 text-left">
                  <Checkbox
                    checked={selectedProperties.length === filteredProperties.length && filteredProperties.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </th>
                <th className="px-4 py-3 text-left font-medium">Property</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-center font-medium">Units</th>
                <th className="px-4 py-3 text-center font-medium">Occupancy</th>
                <th className="px-4 py-3 text-center font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProperties.length > 0 ? (
                filteredProperties.map((property) => (
                  <tr
                    key={property.id}
                    className="border-b hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={selectedProperties.includes(property.id)}
                        onCheckedChange={() => handleSelectProperty(property.id)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center text-primary">
                          <Building className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-medium">{property.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {property.address}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{property.type}</td>
                    <td className="px-4 py-3 text-center">{property.units}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-sm">{property.occupancyRate}%</span>
                        <div className="w-16 h-1.5 bg-muted rounded-full mt-1">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{
                              width: `${property.occupancyRate}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          property.status === "Active"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : property.status === "Inactive"
                            ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                        }`}
                      >
                        {property.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/properties/edit/${property.id}`)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <User className="mr-2 h-4 w-4" />
                            Manage Vendors
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDelete(property.id)} className="text-destructive focus:text-destructive">
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No properties found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {filteredProperties.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-muted-foreground">
              Showing <span className="font-medium">{filteredProperties.length}</span> of{" "}
              <span className="font-medium">{properties.length}</span> properties
            </div>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto"
              onClick={handleExport}
            >
              <FileDown className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
