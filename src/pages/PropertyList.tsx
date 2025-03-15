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
import { Pencil, Trash, Filter, SquareChartGantt } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/redux/reduxHooks";
import { fetchProperties, deleteProperty } from "@/redux/dataStore/propertySlice";
import { useToast } from "@/components/ui/use-toast";

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
    setCurrentPage(page);
  };

  const handleManageProperty = (property: any) => {
    navigate(`/property/manager`, { state: { property } });

  };

  
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <MainNav />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Properties</h1>
          <Button asChild className="shrink-0 bg-primary hover:bg-primary/90">
            <Link to="/property/add">Add Property</Link>
          </Button>
        </div>
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-72">
            <Input
              placeholder="Search properties..."
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
              <DropdownMenuItem>Status: Available</DropdownMenuItem>
              <DropdownMenuItem>Status: Sold</DropdownMenuItem>
              <DropdownMenuItem>Category: Residential</DropdownMenuItem>
              <DropdownMenuItem>Category: Commercial</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="rounded-md border border-input bg-card text-card-foreground shadow">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-muted/50">
                <TableHead className="text-muted-foreground">Name</TableHead>
                <TableHead className="text-muted-foreground">Address</TableHead>
                <TableHead className="text-muted-foreground">Category</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">Price</TableHead>
                <TableHead className="text-right text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties && properties.map((property: any) => (
                <TableRow key={property.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{property.propertyName}</TableCell>
                  <TableCell>{property.addressLine1}, {property.town}</TableCell>
                  <TableCell>{property.category}</TableCell>
                  <TableCell>
                    <span className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                      property.status === "Available"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    )}>
                      {property.status}
                    </span>
                  </TableCell>
                  <TableCell>{property.price}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        onClick={() => handleEditProperty(property)}
                        variant="ghost"
                        size="icon"
                        className="hover:bg-muted"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:text-destructive hover:bg-muted"
                        onClick={() => handleDeleteProperty(property.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:text-destructive hover:bg-muted"
                        onClick={() => handleManageProperty(property.id)}
                      >
                        <SquareChartGantt className="h-4 w-4" />
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

export default PropertyList;
