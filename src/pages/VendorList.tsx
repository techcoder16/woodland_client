import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";

import { useNavigate } from "react-router-dom";
import { toast } from "sonner";


import {

  Trash,
 
  Search,
  Plus,
  User,
  Phone,
  MoreHorizontal,
  Edit,
  MapPin,
} from "lucide-react";
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
  const { vendors, totalPages, loading } = useAppSelector(state => state.vendors);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(fetchVendors({ page: currentPage, search: searchTerm }));
  }, [dispatch, currentPage, searchTerm]);

  const handleDeleteVendor = useCallback(async (id: string) => {
    try {
      await dispatch(deleteVendor(id)).unwrap();

      toast.success("Vendor deleted successfully!");
    } catch (error) {
      console.log(error);

      toast.error(error);
    }
  }, []);

  const handleEditVendor = (vendor: any) => {
    navigate(`/vendors/edit`, { state: { vendor } });
  };

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
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button className="" onClick={() => navigate("/vendors/add")}>
                <Plus className="" />
                Add Vendor
              </Button>
            </div>
          </div>
          <div className="glass-card rounded-lg">
            {/* Desktop Table - Hidden on mobile */}
            <div className="hidden lg:block overflow-x-auto max-h-[60vh]">
              <table className="min-w-full border-collapse table-auto">
                <thead className="sticky top-0 bg-background z-10">
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left text-sm font-medium">Vendor</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Address</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Contact</th>
                    <th className="px-4 py-3 text-center text-sm font-medium">Status</th>
                    <th className="px-4 py-3 text-center text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vendors && vendors.length > 0 ? (
                    vendors.map((vendor: any) => (
                      <tr key={vendor.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <div className="font-medium">
                              {vendor.title} {vendor.firstName} {vendor.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">{vendor.salutation}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm space-y-1">
                            <div>{vendor.addressLine1}</div>
                            {vendor.addressLine2 && <div>{vendor.addressLine2}</div>}
                            <div className="text-muted-foreground">
                              {vendor.town}, {vendor.country} {vendor.postCode}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{vendor.phoneHome}</span>
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
                        <td className="px-4 py-3 text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditVendor(vendor)}>
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
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        No vendors found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Layout - Visible on mobile/tablet */}
            <div className="lg:hidden space-y-3 p-3 max-h-[60vh] overflow-y-auto">
              {vendors && vendors.length > 0 ? (
                vendors.map((vendor: any) => (
                  <div
                    key={vendor.id}
                    className="border rounded-lg p-4 bg-card hover:bg-muted/30 transition-colors"
                  >
                    {/* Header Row */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Avatar */}
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                          {vendor.firstName?.[0]}
                          {vendor.lastName?.[0]}
                        </div>
                        {/* Name and Status */}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {vendor.title} {vendor.firstName} {vendor.lastName}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                vendor.status === "Active"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                  : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                              }`}
                            >
                              {vendor.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      {/* Actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditVendor(vendor)}>
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
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      {/* Address */}
                      {vendor.addressLine1 && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div>{vendor.addressLine1}</div>
                            {vendor.addressLine2 && <div>{vendor.addressLine2}</div>}
                            <div className="text-muted-foreground">
                              {vendor.town}
                              {vendor.country && `, ${vendor.country}`}
                              {vendor.postCode && ` ${vendor.postCode}`}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Phone */}
                      {vendor.phoneHome && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="flex-1">{vendor.phoneHome}</span>
                        </div>
                      )}

                      {/* Salutation */}
                      {vendor.salutation && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="flex-1 text-muted-foreground">{vendor.salutation}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <User className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No vendors found</h3>
                  <p className="text-muted-foreground text-sm">
                    Try adjusting your search or filters
                  </p>
                </div>
              )}
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

export default VendorList;
