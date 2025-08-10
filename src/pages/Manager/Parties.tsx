import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/reduxHooks";
import { deleteTenant, fetchtenants } from "@/redux/dataStore/tenantSlice";
import { getVendorById, fetchVendors } from "@/redux/dataStore/vendorSlice";
import { fetchPropertyParties, upsertPropertyParty } from "@/redux/dataStore/partySlice";
import { Button } from "@/components/ui/button";
import { Edit, MoreHorizontal, Plus, Trash, User, Building2, Loader2, ChevronDown } from "lucide-react";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { AddTenant } from "../AddTenant";
import EditTenant from "../EditTenant";

const Parties = ({ property }: any) => {
  const dispatch = useAppDispatch();

  const { tenants, totalPages, loading } = useAppSelector((state) => state.tenants);
  const { vendors, vendorLoading } = useAppSelector((state) => state.vendors);
  const { propertyParties }:any = useAppSelector((state) => state.parties);

  const [selectedTenants, setSelectedTenants] = useState<any[]>([]);
  const [selectedLandlord, setSelectedLandlord] = useState<any>(null);
  const [isTenantDropdownOpen, setTenantDropdownOpen] = useState(false);
  const [isAddTenantModalOpen, setIsAddTenantModalOpen] = useState(false);
  const [isEditTenantModalOpen, setIsEditTenantModalOpen] = useState(false);
  const [tenantEditSet, setTenantEdit] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const existingParty = useMemo(() => {
    const partiesArray = Array.isArray(propertyParties)
      ? propertyParties
      : propertyParties ? [propertyParties] : [];
    return partiesArray.filter((party: any) => party.propertyId === property?.id);
  }, [propertyParties, property]);

  useEffect(() => {
    dispatch(fetchtenants({ page: 1, search: "" }));
    dispatch(fetchVendors({ page: 1, search: "" }));
    if (property?.id) dispatch(fetchPropertyParties(property.id));
  }, [dispatch, property, isAddTenantModalOpen, isEditTenantModalOpen]);

  useEffect(() => {
    if (property && existingParty.length > 0 && tenants.length > 0) {
      const matchingTenants = existingParty
        .map((p: any) => tenants.find((t: any) => t.id === p.Tenantid))
        .filter(Boolean);
      setSelectedTenants(matchingTenants);
    }
  }, [property, existingParty, tenants]);

  const handleTenantChange = useCallback(
    (tenantId: string) => {
      const tenant = tenants.find((t: any) => t.id === tenantId);
      if (!tenant) return;

      setSelectedTenants((prev) => {
        const isSelected = prev.some((t) => t.id === tenantId);
        if (isSelected) {
          return prev.filter((t) => t.id !== tenantId);
        } else {
          return [...prev, tenant];
        }
      });
    },
    [tenants]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      if (page > 0 && page <= totalPages) {
        setCurrentPage(page);
        dispatch(fetchtenants({ page, search: "" }));
      }
    },
    [dispatch, totalPages]
  );

 useEffect(() => {
  console.log(
    propertyParties.data ,
    propertyParties?.data?.tenants, 
    )
  if (
  
      propertyParties.data  &&
     propertyParties.data.tenants &&
      propertyParties.data.tenants.length > 0
  
  ) {
    // Map tenants from propertyParties.tenants to full tenant objects from tenants list
    const matchingTenants =   propertyParties.data.tenants
      .map((pt: any) => tenants.find((t: any) => t.id === pt.id))
      .filter(Boolean);

      console.log(matchingTenants, "matchingTenants");
    setSelectedTenants(matchingTenants);
console.log(vendors,"array vendors",propertyParties.data.VendorId)
    // Find landlord by VendorId in vendors list
    const landlord =
      vendors.find((v: any) => v.id === propertyParties.data.VendorId) ||
      propertyParties.vendor ||
      null;
      console.log(landlord)
    setSelectedLandlord(landlord);
  } else {
    setSelectedTenants([]);
    setSelectedLandlord(null);
  }
}, [propertyParties, property, tenants, vendors]);

  const handleDeleteTenant = useCallback(
    async (id: string) => {
      try {
        await dispatch(deleteTenant(id)).unwrap();
        toast.success("Tenant deleted successfully!");
      } catch (error) {
        toast.error("Failed to delete tenant");
      }
    },
    [dispatch]
  );

  const handleEditTenant = useCallback((tenant: any) => {
    setTenantEdit(tenant);
    setIsEditTenantModalOpen(true);
  }, []);

  const handleSaveParty = useCallback(async () => {
    if (selectedTenants.length === 0 || !selectedLandlord) {
      toast.error("Please select both tenants and landlord.");
      return;
    }

      const partyData:any = {
        propertyId: property.id,
        tenantId: selectedTenants,
        vendorId: selectedLandlord.id,
      };
      
      

    try {
      await dispatch(upsertPropertyParty(partyData)).unwrap();
      
      toast.success("Parties data saved successfully!");
      dispatch(fetchPropertyParties(property.id));
    } catch (error) {
      toast.error("Failed to save parties.");
    }
  }, [dispatch, property, selectedTenants, selectedLandlord]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight mb-4">Parties</h1>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/2">
          <label className="block mb-2 text-lg font-semibold text-gray-700">Select Tenants</label>

          <button
            type="button"
            onClick={() => setTenantDropdownOpen((prev) => !prev)}
            className="w-full border bg-transparent rounded-md px-4 py-2 text-sm text-left  shadow-sm flex justify-between items-center"
          >
            {selectedTenants.length > 0
              ? selectedTenants.map((t) => `${t.FirstName} ${t.SureName}`).join(", ")
              : "Select tenants"}
            <ChevronDown className="w-4 h-4 ml-2" />
          </button>

          {isTenantDropdownOpen && (
            <div className="border rounded-md mt-2 max-h-60 overflow-y-auto space-y-2 shadow-sm p-2 z-10 relative">
              {tenants.map((tenant) => {
                const isSelected = selectedTenants.some((t) => t.id === tenant.id);
                return (
                  <div
                    key={tenant.id}
                    onClick={() => handleTenantChange(tenant.id)}
                    className={`cursor-pointer px-3 py-1 rounded hover:bg-gray-100 text-sm ${isSelected ? "bg-blue-100 text-blue-800 font-medium" : ""}`}
                  >
                    {tenant.FirstName} {tenant.SureName}
                  </div>
                );
              })}
            </div>
          )}

          <div className="p-6 mt-4 rounded-2xl shadow-md border border-gray-200">
            <h2 className="text-2xl font-bold flex items-center gap-2 mb-4">
              <User className="h-6 w-6 text-red-500" /> Selected Tenant(s)
            </h2>
            {selectedTenants.length > 0 ? (
              selectedTenants.map((tenant) => (
                <div key={tenant.id} className="mb-4 p-3 border-b border-gray-200">
                  <p><strong>Name:</strong> {tenant.title} {tenant.FirstName} {tenant.SureName}</p>
                  <p><strong>Email:</strong> {tenant.Email}</p>
                  <p><strong>Mobile:</strong> {tenant.MobileNo}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 italic">No tenants selected.</p>
            )}


            <Button onClick={handleSaveParty} className="mt-4">
              Save Parties
            </Button>
          </div>
        </div>

        <div className="w-full md:w-1/2">
          <div className="p-6 rounded-2xl shadow-md border border-gray-200">
            <h2 className="text-2xl font-bold flex items-center gap-2 mb-4">
              <Building2 className="h-6 w-6 text-red-500 mb-2" /> Landlord Details
            </h2>

                        {/* <label className="block mt-4 mb-2 text-lg font-semibold text-gray-700">Select Landlord</label> */}
            <select
              value={selectedLandlord?.id || ""}
              onChange={(e) => {
                const landlord = vendors.find((l: any) => l.id === e.target.value);
                setSelectedLandlord(landlord || null);
              }}
              className="w-full border rounded-md bg-transparent px-4 py-2 text-sm shadow-sm  mb-2"
            >
              <option value="">Select a landlord</option>
              {vendors.map((landlord) => (
                <option className="bg-transparent" key={landlord.id} value={landlord.id}>
                  {landlord.firstName} {landlord.lastName}
                </option>
              ))}
            </select>

            {vendorLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <p>Loading vendors...</p>
              </div>
            ) : selectedLandlord ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-gray-200 shadow-sm">
                  <p><strong>Name:</strong> {selectedLandlord.firstName} {selectedLandlord.lastName}</p>
                  <p><strong>Email:</strong> {selectedLandlord.email}</p>
                  <p><strong>Phone:</strong> {selectedLandlord.phoneMobile}</p>
                  <p><strong>Company:</strong> {selectedLandlord.company}</p>
                  <p><strong>Address:</strong> {selectedLandlord.addressLine1}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 italic">No landlord selected.</p>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Tenants</h2>
          <Button onClick={() => setIsAddTenantModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Tenant
          </Button>
        </div>
        <table className="min-w-full border">
          <thead>
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Phone</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4}>Loading...</td></tr>
            ) : tenants.length > 0 ? (
              tenants.map((tenant: any) => (
                <tr key={tenant.id}>
                  <td className="px-4 py-2">{tenant.FirstName}</td>
                  <td className="px-4 py-2">{tenant.Email}</td>
                  <td className="px-4 py-2">{tenant.MobileNo}</td>
                  <td className="px-4 py-2">
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
                        <DropdownMenuItem onClick={() => handleDeleteTenant(tenant.id)}>
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td className="px-4 py-8 text-center" colSpan={4}>No tenants found.</td></tr>
            )}
          </tbody>
        </table>

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