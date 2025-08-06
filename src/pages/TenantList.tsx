import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/reduxHooks";
import { deleteTenant, fetchtenants } from "@/redux/dataStore/tenantSlice";
import { Button } from "@/components/ui/button";
import { Edit, Filter, MoreHorizontal, PhoneCall, Plus, Search, Trash } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { AddTenant } from "./AddTenant";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import EditTenant from "./EditTenant";
import { toast } from "sonner";
import { User, Mail, Phone, Building2, Loader2 } from "lucide-react";
import { HiHome } from "react-icons/hi2";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Input } from "@/components/ui/input";

const TenantList = ({ property }: any) => {
  const dispatch = useAppDispatch();

  // Redux selectors
  const { tenants, totalPages, loading, error } = useAppSelector((state) => state.tenants);

  const [searchTerm, setSearchTerm] = useState("");
  // Local state
  const [isAddTenantModalOpen, setIsAddTenantModalOpen] = useState(false);
  const [isEditTenantModalOpen, setIsEditTenantModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [tenantEditSet, setTenantEdit] = useState("");
  const [currentPage, setCurrentPage] = useState(1);


  useEffect(() => {
    dispatch(fetchtenants({ page: currentPage, search: searchTerm }));
  }, [dispatch, currentPage, searchTerm,isAddTenantModalOpen, isEditTenantModalOpen]);
  // Memoized handler for pagination change
  const handlePageChange = useCallback(
    (page: number) => {
      if (page > 0 && page <= totalPages) {
        setCurrentPage(page);
        dispatch(fetchtenants({ page, search: "" }));
      }
    },
    [dispatch, totalPages]
  );

  // Memoized handler for deleting a tenant
  const handleDeleteTenant = useCallback(
    async (id: string) => {
      try {
        await dispatch(deleteTenant(id)).unwrap();
        toast.success("Tenant deleted successfully!");
      } catch (error) {
        console.log(error)
        toast.error(error || "Failed to delete tenant");
      }
    },
    [dispatch]
  );

  const handleEditTenant = useCallback((tenant: any) => {
    setTenantEdit(tenant);
    setIsEditTenantModalOpen(true);
  }, []);


  return (

    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Tenants</h1>
        </div>






        {/* Tenant List with Pagination */}


        <div className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-1 items-center gap-2">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 px-4 py-3 text-left font-medium" />
                  <Input
                    type="search"
                    placeholder="Search Tenants..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />

                </div>
                <Button variant="outline" size="icon" className="shrink-0">
                  <Filter className="h-4 w-4" />
                </Button>

              </div>
            </div>


            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ">
              <Button className="ml-auto" onClick={() => setIsAddTenantModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Tenant
              </Button>
            </div>
  </div>

            <div className="glass-card rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full border">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left font-medium">Title</th>
                      <th className="px-4 py-3 text-left font-medium">Name</th>
                      <th className="px-4 py-3 text-left font-medium">Email</th>
                      <th className="px-4 py-3 text-left font-medium">Phone</th>
                      <th className="px-4 py-3 text-left font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td aria-colspan={5} className="text-center p-4">
                          Loading...
                        </td>
                      </tr>
                    ) : tenants && tenants.length > 0 ? (
                      tenants.map((tenant: any) => (
                        <tr key={tenant.id} className="border-b">
                          <td className="px-4 py-3 text-sm">{tenant.title}</td>
                          <td className="px-4 py-3 text-sm">{tenant.FirstName}</td>
                          <td className="px-4 py-3 text-sm">{tenant.Email}</td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              {tenant.MobileNo}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditTenant(tenant)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDeleteTenant(tenant.id)}
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
                        <td colSpan={5} className="px-4 py-8text-center p-4">
                          No tenants found.
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

          {/* Modals */}
          <AddTenant isOpen={isAddTenantModalOpen} onClose={() => setIsAddTenantModalOpen(false)} />
          {isEditTenantModalOpen && (
            <EditTenant
              isOpen={isEditTenantModalOpen}
              onClose={() => setIsEditTenantModalOpen(false)}
              tenant={tenantEditSet}
            />
          )}

        </div>

      </div>


    </DashboardLayout>
  );
};

export default React.memo(TenantList);
