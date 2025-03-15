import React, { useState, useEffect } from "react";
import { MainNav } from "@/components/MainNav";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "react-router-dom";
import { FileText, Pencil, Trash, Filter } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { DEFAULT_COOKIE_GETTER } from "@/helper/Cookie";
import getApi from "@/helper/getApi";
import deleteApi from "@/helper/deleteApi";
import { useToast } from "@/components/ui/use-toast";

import { fetchVendors, deleteVendor } from "@/redux/dataStore/vendorSlice";
import { useDispatch, useSelector } from "react-redux";

import { useAppDispatch, useAppSelector } from "@/redux/reduxHooks"; // ✅ Use typed hooks

import { RootState } from "@/redux/store";
import VendorPdf from "./Vendor/VendorPdf";



const VendorList = () => {
  const dispatch = useAppDispatch(); // ✅ Use typed dispatch
  const { vendors, totalPages, loading } = useAppSelector((state) => state.vendors);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  const [deleted,setDeleted] = useState(true);
  const itemsPerPage = 10;
    const { toast } = useToast();
  



  useEffect(() => {
    dispatch(fetchVendors({ page: currentPage, search: searchTerm }));
  }, [dispatch, currentPage, searchTerm]);

  const handleDeleteVendor = async (id: string) => {
    await dispatch(deleteVendor(id));
    toast({ title: "Success", description: "Vendor deleted successfully!" });
  };


  const handleEditVendor = (vendor:any) =>{

    navigate(`/vendors/edit`, { state: { vendor } });


  }

  

  // useEffect(() => {
  //   fetchVendors();
    
  // }, [currentPage, searchTerm,deleted]);

  const handlePageChange = (page:any) => {
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <MainNav />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Landlords & Vendors</h1>
          <Button asChild className="shrink-0  bg-primary hover:bg-primary/90">
            <Link to="/vendors/add">Add Vendor</Link>
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-72">
            <Input
              placeholder="Search vendors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-background border-input"
            />
          </div>
          
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
        </div>

        <div className="rounded-md border border-input bg-card text-card-foreground shadow">
        <Table>
  <TableHeader>
    <TableRow className="hover:bg-muted/50">
      <TableHead className="text-muted-foreground">Title</TableHead>
      <TableHead className="text-muted-foreground">First Name</TableHead>
      <TableHead className="text-muted-foreground">Last Name</TableHead>
      <TableHead className="text-muted-foreground">Address Line 1</TableHead>
      <TableHead className="text-muted-foreground">Address Line 2</TableHead>
      <TableHead className="text-muted-foreground">Town</TableHead>
      <TableHead className="text-muted-foreground">Country</TableHead>  {/* New Field */}
      <TableHead className="text-muted-foreground">Post Code</TableHead>  {/* New Field */}
      <TableHead className="text-muted-foreground">Phone Home</TableHead>  {/* New Field */}
      <TableHead className="text-muted-foreground">Status</TableHead>
      <TableHead className="text-muted-foreground">Salutation</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {vendors && vendors.map((vendor: any) => (
      <TableRow key={vendor.id} className="hover:bg-muted/50">
        <TableCell className="font-medium">{vendor.title}</TableCell> {/* Add title */}
        <TableCell>{vendor.firstName}</TableCell>
        <TableCell>{vendor.lastName}</TableCell>
        <TableCell>{vendor.addressLine1}</TableCell>
        <TableCell>{vendor.addressLine2}</TableCell>
        <TableCell>{vendor.town}</TableCell>
        <TableCell>{vendor.country}</TableCell> {/* Add country */}
        <TableCell>{vendor.postCode}</TableCell> {/* Add postCode */}
        <TableCell>{vendor.phoneHome}</TableCell> {/* Add phoneHome */}

        <TableCell>
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
              vendor.status === "Active"
                ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                : "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300"
            )}
          >
            {vendor.status}
          </span>
        </TableCell>

        <TableCell>{vendor.salutation}</TableCell> {/* Add phoneHome */}
        
        <TableCell className="text-right">
          <div className="flex justify-end gap-2">
            <Button onClick={() => handleEditVendor(vendor)} variant="ghost" size="icon" className="hover:bg-muted">
              <Pencil className="h-4 w-4" />
            </Button>
            <VendorPdf vendor={vendor} />

            <Button
              variant="ghost"
              size="icon"
              className="hover:text-destructive hover:bg-muted"
              onClick={() => handleDeleteVendor(vendor.id)}
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>

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
  );
};

export default VendorList;
