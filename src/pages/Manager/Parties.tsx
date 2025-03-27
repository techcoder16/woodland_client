import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/reduxHooks";
import { deleteTenant, fetchtenants } from "@/redux/dataStore/tenantSlice";
import { getVendorById } from "@/redux/dataStore/vendorSlice";
import { fetchPropertyParties, upsertPropertyParty } from "@/redux/dataStore/partySlice";
import { Button } from "@/components/ui/button";
import { Edit, Home, HomeIcon, MoreHorizontal, PhoneCall, Plus, Trash } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { AddTenant } from "../AddTenant";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import EditTenant from "../EditTenant";
import { toast } from "sonner";
import { User, Mail, Phone, Building2, Loader2 } from "lucide-react";
import { HiHome } from "react-icons/hi2";

const Parties = ({ property }: any) => {
  const dispatch = useAppDispatch();

  // Redux selectors
  const { tenants, totalPages, loading,error } = useAppSelector((state) => state.tenants);
  const { selectedVendor, vendorLoading } = useAppSelector((state) => state.selectedVendor);
  const { propertyParties } = useAppSelector((state) => state.parties);
  
  // Local state
  const [isAddTenantModalOpen, setIsAddTenantModalOpen] = useState(false);
  const [isEditTenantModalOpen, setIsEditTenantModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [tenantEditSet, setTenantEdit] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Memoize the existing party record for the current property.
  // If propertyParties isn't an array, we wrap it into one.
  const existingParty = useMemo(() => {
    const partiesArray = Array.isArray(propertyParties)
      ? propertyParties
      : propertyParties
      ? [propertyParties]
      : [];
    return partiesArray.find((party: any) => party.propertyId === property?.id);
  }, [propertyParties, property]);

  // Fetch tenants and property parties when component mounts or modal state changes
  useEffect(() => {
    dispatch(fetchtenants({ page: 1, search: "" }));
    if (property?.id) {
      dispatch(fetchPropertyParties(property.id));
    }
  }, [dispatch, property, isAddTenantModalOpen, isEditTenantModalOpen]);

  // Fetch vendor details when property changes
  useEffect(() => {
    if (property?.vendorId ) {

 
      dispatch(getVendorById(property.vendorId));
    }
  }, [dispatch, property]);

  // Auto-select tenant if a party record exists for the property
  useEffect(() => {


    if (property && existingParty && tenants.length > 0) {
 
      const tenantFromParty = tenants.find((t: any) => t.id === existingParty.Tenantid);
      
      if (tenantFromParty) {
        setSelectedTenant(tenantFromParty);
      }
    }
  }, [property, existingParty, tenants]);

  // Memoized handler for tenant change
  const handleTenantChange = useCallback(
    (tenantId: any) => {
      const tenant = tenants.find((t: any) => t.id === tenantId);
      setSelectedTenant(tenant);
    },
    [tenants]
  );

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
  
    // useEffect(()=>{
    //   if(error)
    //   {
    //     toast.error(error);  
    //   }

    //   else {toast.success("Tenant deleted successfully!");}

    // },[error])
  // Memoized handler for editing a tenant
  const handleEditTenant = useCallback((tenant: any) => {
    setTenantEdit(tenant);
    setIsEditTenantModalOpen(true);
  }, []);

  // Memoized handler for saving (or updating) the party record
  const handleSaveParty = useCallback(async () => {
    if (!selectedTenant) {
      toast.error("Please select a tenant to save Parties.");
      return;
    }
    const partyData = {
      propertyId: property.id,
      
      tenantId: selectedTenant.id,
      vendorId: selectedVendor.id,

    };
    try{
 
    await dispatch(upsertPropertyParty(partyData)).unwrap();
    toast.success("Parties data saved successfully!");
    }
      catch(error)
      {console.log(error)
        toast.error(error);

      }  
 
    dispatch(fetchPropertyParties(property.id));
  }, [dispatch, property, selectedTenant,selectedVendor]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight mb-4">Parties</h1>

      {/* Top Section: Tenant Select & Vendor Details */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Tenant Selection & Details */}
        <div className="w-full md:w-1/2">
          <label className="block mb-2 text-lg font-semibold text-gray-700">
            Select Tenant
          </label>
          <Select onValueChange={handleTenantChange} value={selectedTenant ? selectedTenant.id : ""}>
            <SelectTrigger className="w-full border-gray-300 shadow-sm rounded-lg">
              <SelectValue placeholder="Select a tenant" />
            </SelectTrigger>
            <SelectContent>
              {tenants.map((tenant: any) => (
                <SelectItem key={tenant.id} value={tenant.id}>
                  {tenant.FirstName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Tenant Details & Save Party Button */}
          <div className="p-6 mt-4 rounded-2xl shadow-md border border-gray-200">
      <h2 className="text-2xl font-bold flex items-center gap-2 mb-4">
        <User className="h-6 w-6 text-red-500" /> Tenant Details
      </h2>
      {selectedTenant ? (
        <div className="space-y-3">
          <p className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <strong>Title:</strong> {selectedTenant.title}
          </p>
          <p className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <strong>First Name:</strong> {selectedTenant.FirstName}
          </p>
          <p className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <strong>Sure Name:</strong> {selectedTenant.SureName}
          </p>
          <p className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <strong>Employee Name:</strong> {selectedTenant.EmployeeName}
          </p>
          <p className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            <strong>Email:</strong> {selectedTenant.Email}
          </p>
          <p className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            <strong>Mobile No:</strong> {selectedTenant.MobileNo}
          </p>
          <p className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            <strong>Home Phone:</strong> {selectedTenant.HomePhone}
          </p>
          <p className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            <strong>Work Phone:</strong> {selectedTenant.WorkPhone}
          </p>
          <p className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            <strong>Bank Name:</strong> {selectedTenant.BankName}
          </p>
          <p className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            <strong>Bank Account No:</strong> {selectedTenant.BankAccountNo}
          </p>
          <p className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            <strong>Sort Code:</strong> {selectedTenant.SortCode}
          </p>
          <p className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <strong>ID Check:</strong> {selectedTenant.IDCheck}
          </p>

          <Button onClick={handleSaveParty} className="mt-4">
            {existingParty ? "Update Parties" : "Save Parties"}
          </Button>
        </div>
      ) : (
        <p className="text-gray-500 italic">No tenant selected.</p>
      )}
    </div>

        </div>

        {/* Vendor (Landlord) Details */}
        <div className="w-full md:w-1/2">
          <div className="p-6 rounded-2xl shadow-md border border-gray-200">
            <h2 className="text-2xl font-bold flex items-center gap-2 mb-4">
              <Building2 className="h-6 w-6 text-red-500" /> Landlord Details
            </h2>
            {vendorLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <p>Loading vendor...</p>
              </div>
            ) : selectedVendor  && Object.keys(selectedVendor).length > 0 ? (
              <div className="space-y-4">
                  <div
                    key={selectedVendor.id}
                    className="p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-shadow duration-300"
                  >
                    <p className="flex items-center gap-4">
                      <User className="h-5 w-5" />
                      <strong>Name:</strong> {selectedVendor.firstName}
                    </p>

                    <p className="flex items-center gap-4">
                      <User className="h-5 w-5" />
                      <strong>Phone:</strong> {selectedVendor.lastName}
                    </p>
                    <p className="flex items-center gap-4">
                      <Mail className="h-5 w-5" />
                      <strong>Email:</strong> {selectedVendor.email}
                    </p>
                    
                    <p className="flex items-center gap-4">
                      <PhoneCall className="h-5 w-5" />
                      <strong>Work Phone:</strong> {selectedVendor.phoneWork}
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="h-5 w-5" />
                      <strong>Mobile Phone:</strong> {selectedVendor.phoneMobile}
                    </p>    <p className="flex items-center gap-2">
                      <HiHome className="h-9 w-9" />
                      <strong>Address:</strong> {selectedVendor.addressLine1}
                    </p>
                    
                    
                    <p className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      <strong>Company:</strong> {selectedVendor.company}
                    </p>
                  </div>
                
              </div>
            ) : (
              <p className="text-gray-500 italic">No vendor data available.</p>
            )}
          </div>
        </div>
      </div>

   
      {/* Tenant List with Pagination */}
      <div>
        <div className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-3xl font-bold tracking-tight">Tenant</h1>
            <Button className="ml-auto" onClick={() => setIsAddTenantModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Tenant
            </Button>
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
                      <td colSpan={5} className="text-center p-4">
                        No tenants found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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
  );
};

export default React.memo(Parties);
