import React, { useState, useEffect } from "react";
import { MainNav } from "@/components/MainNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Pencil, Trash, Filter, SquareChartGantt, Search, Plus, Building, User, Edit, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/redux/reduxHooks";
import { fetchProperties, deleteProperty } from "@/redux/dataStore/propertySlice";
import { useToast } from "@/components/ui/use-toast";
import DashboardLayout from "@/components/layout/DashboardLayout";

const PropertyList = () => {
  const dispatch = useAppDispatch();

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { properties, totalPages, loading } = useAppSelector(
    (state) => state.properties
  );
  useEffect(() => {

    dispatch(fetchProperties({ page: currentPage, search: searchTerm }));
  }, [dispatch, currentPage, searchTerm]);

  const handleDeleteProperty = async (id: string) => {
    await dispatch(deleteProperty(id));
    toast({ title: "Success", description: "Property deleted successfully!" });
  };

  const handleEditProperty = (property: any) => {
    navigate(`/property/edit`, { state: { property } });

  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleManageProperty = (property: any) => {
    navigate(`/property/manager`, { state: { property } });

  };

  
  function handleDelete(id: string): void {
    throw new Error("Function not implemented.");
  }

  return (
    <DashboardLayout>

<div className="p-6 space-y-6">
<h1 className="text-3xl font-bold tracking-tight">Properties</h1>
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
        <Button className="ml-auto" onClick={() => navigate("/property/add")}>
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
      <th className="px-4 py-3 text-left font-medium">Name</th>
      <th className="px-4 py-3 text-left font-medium">Address</th>
      <th className="px-4 py-3 text-left font-medium">Category</th>
      <th className="px-4 py-3 text-left font-medium">Status</th>
      <th className="px-4 py-3 text-left font-medium">Price</th>
      
    </tr>
  </thead>
  <tbody>
    {properties.length > 0 ? (
      properties.map((property: any) => (
        <tr
          key={property.id}
          className="border-b hover:bg-muted/50 transition-colors"
        >
          <td className="px-4 py-3">{property.propertyName}</td>
          <td className="px-4 py-3">
            {property.addressLine1}, {property.town}
          </td>
          <td className="px-4 py-3">{property.category}</td>
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
          <td className="px-4 py-3">{property.price}</td>
       
          <td className="px-4 py-3 text-right">
       <DropdownMenu>
         <DropdownMenuTrigger asChild>
           <Button variant="ghost" size="icon">
             <MoreHorizontal className="h-4 w-4" />
           </Button>
         </DropdownMenuTrigger>
         <DropdownMenuContent align="end">
           <DropdownMenuItem onClick={()=>handleEditProperty(property)}>
             <Edit className="mr-2 h-4 w-4" />
             Edit
           </DropdownMenuItem>
          


           <DropdownMenuSeparator />
           <DropdownMenuItem
             onClick={() => handleManageProperty(property)}
      
           >
      <SquareChartGantt className="mr-2 h-4 w-4" />
      Manage Property
           </DropdownMenuItem>


           <DropdownMenuSeparator />
           <DropdownMenuItem
             onClick={() => handleDeleteProperty(property.id)}
             className="text-destructive focus:text-destructive"
           >
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
        <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
          No properties found
        </td>
      </tr>
    )}
  </tbody>
</table>

        </div>

        
      </div>


      <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious onClick={() => handlePageChange(currentPage - 1)} />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, index) => (
              <PaginationItem key={index}>
                <PaginationLink
                  onClick={() => handlePageChange(index + 1)}
                  isActive={currentPage === index + 1}
                >
                  {index + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext onClick={() => handlePageChange(currentPage + 1)} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
        
    </div>
    </div>
      </DashboardLayout>
  );
};

export default PropertyList;
