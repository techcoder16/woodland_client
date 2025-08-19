
import React, { useState } from "react";
import { 
  Edit, 
  FileDown, 
  Filter, 
  MoreHorizontal, 
  Phone, 
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

// Mock vendor data
const vendors = [
  {
    id: "v1",
    name: "ABC Maintenance Co.",
    contactPerson: "John Smith",
    email: "john@abcmaintenance.com",
    phone: "555-123-4567",
    type: "Maintenance",
    status: "Active",
    properties: 5,
  },
  {
    id: "v2",
    name: "City Plumbing Services",
    contactPerson: "Alice Johnson",
    email: "alice@cityplumbing.com",
    phone: "555-987-6543",
    type: "Plumbing",
    status: "Active",
    properties: 8,
  },
  {
    id: "v3",
    name: "Elite Electrical",
    contactPerson: "Robert Brown",
    email: "robert@eliteelectrical.com",
    phone: "555-456-7890",
    type: "Electrical",
    status: "Active",
    properties: 4,
  },
  {
    id: "v4",
    name: "Green Landscaping",
    contactPerson: "Sarah Green",
    email: "sarah@greenlandscaping.com",
    phone: "555-789-0123",
    type: "Landscaping",
    status: "Inactive",
    properties: 0,
  },
  {
    id: "v5",
    name: "Quick Security Systems",
    contactPerson: "Michael Lee",
    email: "michael@quicksecurity.com",
    phone: "555-321-6547",
    type: "Security",
    status: "Active",
    properties: 12,
  },
];

export function VendorList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [vendorType, setVendorType] = useState("all");
  const [vendorStatus, setVendorStatus] = useState("all");
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  
  const navigate = useNavigate();

  // Filter vendors based on search and filters
  const filteredVendors = vendors.filter((vendor) => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = vendorType === "all" || vendor.type === vendorType;
    const matchesStatus = vendorStatus === "all" || vendor.status === vendorStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleSelectVendor = (id: string) => {
    setSelectedVendors((prev) =>
      prev.includes(id)
        ? prev.filter((vendorId) => vendorId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedVendors.length === filteredVendors.length) {
      setSelectedVendors([]);
    } else {
      setSelectedVendors(filteredVendors.map((v) => v.id));
    }
  };

  const handleExport = () => {
    toast.success("Vendors exported to CSV");
  };

  const handleDelete = (id: string) => {
    toast.success(`Vendor ${id} deleted successfully`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search vendors..."
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
          <Select value={vendorType} onValueChange={setVendorType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Vendor Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Maintenance">Maintenance</SelectItem>
              <SelectItem value="Plumbing">Plumbing</SelectItem>
              <SelectItem value="Electrical">Electrical</SelectItem>
              <SelectItem value="Landscaping">Landscaping</SelectItem>
              <SelectItem value="Security">Security</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={vendorStatus} onValueChange={setVendorStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          
          <Button className="ml-auto" onClick={() => navigate("/vendors/add")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Vendor
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
                    checked={selectedVendors.length === filteredVendors.length && filteredVendors.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </th>
                <th className="px-4 py-3 text-left font-medium">Vendor</th>
                <th className="px-4 py-3 text-left font-medium">Contact</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-center font-medium">Properties</th>
                <th className="px-4 py-3 text-center font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVendors.length > 0 ? (
                filteredVendors.map((vendor) => (
                  <tr
                    key={vendor.id}
                    className="border-b hover:bg-red/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={selectedVendors.includes(vendor.id)}
                        onCheckedChange={() => handleSelectVendor(vendor.id)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded bg-red/10 flex items-center justify-center text-red">
                          <User className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-medium">{vendor.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {vendor.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="text-sm">{vendor.contactPerson}</div>
                        <div className="text-xs text-muted-foreground flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {vendor.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{vendor.type}</td>
                    <td className="px-4 py-3 text-center">{vendor.properties}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          vendor.status === "Active"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {vendor.status}
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
                          <DropdownMenuItem onClick={() => navigate(`/vendors/edit/${vendor.id}`)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <User className="mr-2 h-4 w-4" />
                            Assign Properties
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDelete(vendor.id)} className="text-destructive focus:text-destructive">
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
                  <td colSpan={7} className=" text-center text-muted-foreground">
                    No vendors found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {filteredVendors.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-muted-foreground">
              Showing <span className="font-medium">{filteredVendors.length}</span> of{" "}
              <span className="font-medium">{vendors.length}</span> vendors
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
