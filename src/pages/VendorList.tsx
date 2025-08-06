import React, { useState, useEffect, useCallback } from "react";
import { MainNav } from "@/components/MainNav";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "react-router-dom";
import { FileText, Pencil, Trash, Filter, Search, Plus, User, Phone, MoreHorizontal, Edit, FileDown } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

import { fetchVendors, deleteVendor } from "@/redux/dataStore/vendorSlice";

import { useAppDispatch, useAppSelector } from "@/redux/reduxHooks"; // ✅ Use typed hooks

import DashboardLayout from "@/components/layout/DashboardLayout";



const VendorList = () => {
  const dispatch = useAppDispatch(); // ✅ Use typed dispatch
  const { vendors, totalPages, loading } = useAppSelector((state) => state.vendors);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();




  useEffect(() => {
    dispatch(fetchVendors({ page: currentPage, search: searchTerm }));
  }, [dispatch, currentPage, searchTerm]);

  const handleDeleteVendor = useCallback (async  (id: string) => {
    try {
      
    
    await dispatch(deleteVendor(id)).unwrap();


    toast.success("Vendor deleted successfully!")

    }
catch(error)
{console.log(error)

  toast.error(error);

}


  },[]);


  const handleEditVendor = (vendor:any) =>{

    navigate(`/vendors/edit`, { state: { vendor } });


  }

  

  // useEffect(() => {
  //   fetchVendors();
    
  // }, [currentPage, searchTerm,deleted]);

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <h1 className="text-3xl font-bold tracking-tight">Vendors & Landlords</h1>
      </div>
 <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 px-4 py-3 text-left font-medium" />
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

          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 border-input">
                <Filter className="h-4 w-4" />
                Filters
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover text-popover-foreground">
              <DropdownMenuItem>Status: Active</DropdownMenuItem>
              <DropdownMenuItem>Status: Inactive</DropdownMenuItem>
              <DropdownMenuItem>Properties: Any</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

               
          <Button className="ml-auto" onClick={() => navigate("/vendors/add")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Vendor
          </Button>
        </div>
        </div>

        <div className="glass-card rounded-lg overflow-hidden">
        <div className="overflow-x-auto">

        <table>
  <thead>
  <tr className="border-b">
  <th className="px-4 py-3 text-left font-medium">Title</th>
      <th className="px-4 py-3 text-left font-medium">First Name</th>
      <th className="px-4 py-3 text-left font-medium">Last Name</th>
      <th className="px-4 py-3 text-left font-medium">Address Line 1</th>
      <th className="px-4 py-3 text-left font-medium">Address Line 2</th>
      <th className="px-4 py-3 text-left font-medium">Town</th>
      <th className="px-4 py-3 text-left font-medium">Country</th>  {/* New Field */}
      <th className="px-4 py-3 text-left font-medium">Post Code</th>  {/* New Field */}
      <th className="px-4 py-3 text-left font-medium">Phone Home</th>  {/* New Field */}
      <th className="px-4 py-3 text-left font-medium">Status</th>
      <th className="px-4 py-3 text-left font-medium">Salutation</th>
      <th className="px-4 py-3 text-left font-medium">Actions</th>
 
    </tr>
  </thead>
  <tbody>

    {vendors && vendors.length>0 ?  vendors.map((vendor: any) => (
     
     <tr
     key={vendor.id}
     className="border-b hover:bg-muted/50 transition-colors"
   >
   
     {/* <td className="px-4 py-3">
       <div className="flex items-center gap-3">
         <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center text-primary">
           <User className="h-5 w-5" />
         </div>
         <div>
           <div className="font-medium">{vendor.name}</div>
           <div className="text-xs text-muted-foreground">{vendor.email}</div>
         </div>
       </div>
     </td> */}
     <td className="px-4 py-3 text-center text-sm">{vendor.title}</td>
     <td className="px-4 py-3 text-sm">{vendor.firstName}</td>
     <td className="px-4 py-3 text-sm">{vendor.lastName}</td>
     <td className="px-4 py-3 text-sm">{vendor.addressLine1}</td>
     <td className="px-4 py-3 text-sm">{vendor.addressLine2}</td>
     <td className="px-4 py-3 text-sm">{vendor.town}</td>
     <td className="px-4 py-3 text-sm">{vendor.country}</td>
     <td className="px-4 py-3 text-sm">{vendor.postCode}</td>
     <td className="px-4 py-3 text-sm">
       <div className="flex items-center gap-2">
         <Phone className="h-4 w-4 text-muted-foreground" />
         {vendor.phoneHome}
       </div>
     </td>
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

     <td className="px-4 py-3 text-sm">{vendor.salutation}</td>
     <td className="px-4 py-3 text-right">
       <DropdownMenu>
         <DropdownMenuTrigger asChild>
           <Button variant="ghost" size="icon">
             <MoreHorizontal className="h-4 w-4" />
           </Button>
         </DropdownMenuTrigger>
         <DropdownMenuContent align="end">
           <DropdownMenuItem onClick={()=>handleEditVendor(vendor)}>
             <Edit className="mr-2 h-4 w-4" />
             Edit
           </DropdownMenuItem>
          
           <DropdownMenuSeparator />
           <DropdownMenuItem
             onClick={() => handleDeleteVendor(vendor.id)}
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
               : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 justify-center text-center m-auto text-muted-foreground">
                    No vendors found
                  </td>
                </tr>

              )}

  </tbody>
</table>
</div>

{vendors.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-muted-foreground">
              Showing <span className="font-medium">{vendors.length}</span> of{" "}
              <span className="font-medium">{vendors.length}</span> vendors
            </div>
         
          </div>
        )}

        
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

export default VendorList;
