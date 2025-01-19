import React, { useState, useEffect } from "react";
import { MainNav } from "@/components/MainNav";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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



const VendorList = () => {
  const [vendors, setVendors] = useState<any>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleted,setDeleted] = useState(true);
  const itemsPerPage = 10;
    const { toast } = useToast();
  

  const fetchVendors = async () => {
    try {
      const  access_token = await DEFAULT_COOKIE_GETTER("access_token")
      const headers = {

        Authorization: `Bearer ${access_token}`, // Replace with actual token logic
      };
      const params = `?page=${currentPage}&limit=${itemsPerPage}&search=${searchTerm}`;
      const data:any = await getApi("vendor/getVendors", params, headers);
      console.log(data.vendors)
      if (data )
      {
      setVendors(data?.vendors ?? []);
      setTotalPages(data?.totalPages ?? 1);
      }
    } catch (error) {
      console.error("Error fetching vendors:", error);
    }
  };
 async function  handleDeleteVendor(id:string)
 {  
  const params = {
    id : id
  }

  try{
  const  access_token = await DEFAULT_COOKIE_GETTER("access_token")
  const headers = {

    Authorization: `Bearer ${access_token}`, // Replace with actual token logic
  };


  
const data: any = await deleteApi(`vendor/delete/${id}`, headers);

  console.log(data.vendors)
    if (data)
    {
    
      toast({
        title: "Success",
        description: data.message || "Successfully Deleted!",
        
      });
      
      setDeleted((prev)=>!prev);
      
    }
    } catch (error) {

      toast({
        title: "Error",
        description: error.message || "Network Error!",
        variant: "destructive",
      });
      




    console.error("Error Deleting vendors:", error);
    }

 }

  useEffect(() => {
    fetchVendors();
  }, [currentPage, searchTerm,deleted]);

  const handlePageChange = (page:any) => {
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <MainNav />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Landlords & Vendors</h1>
          <Button asChild className="shrink-0 bg-primary hover:bg-primary/90">
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
                <TableHead className="text-right text-muted-foreground">City</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendors && vendors.map((vendor:any) => (
                <TableRow key={vendor.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{vendor.firstName}</TableCell>
                  <TableCell>{vendor.lastName}</TableCell>
                  <TableCell>{vendor.addressLine1}</TableCell>
                  <TableCell>{vendor.addressLine2}</TableCell>
                  <TableCell>{vendor.town}</TableCell>
                  <TableCell>{vendor.city}</TableCell>
                  
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
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="hover:bg-muted">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="hover:bg-muted">
                        <FileText className="h-4 w-4" />
                      </Button>
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
