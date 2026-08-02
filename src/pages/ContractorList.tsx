import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Trash, Search, Plus, Phone, MoreHorizontal, Edit } from "lucide-react";
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
import { fetchContractors, deleteContractor } from "@/redux/dataStore/contractorSlice";
import { useAppDispatch, useAppSelector } from "@/redux/reduxHooks";
import DashboardLayout from "@/components/layout/DashboardLayout";

const ContractorList = () => {
  const dispatch = useAppDispatch();
  const { contractors, totalPages } = useAppSelector((state) => state.contractors);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(fetchContractors({ page: currentPage, search: searchTerm }));
  }, [dispatch, currentPage, searchTerm]);

  const handleDeleteContractor = useCallback(async (id: string) => {
    try {
      await dispatch(deleteContractor(id)).unwrap();
      toast.success("Contractor deleted successfully!");
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete contractor");
    }
  }, [dispatch]);

  const handleEditContractor = (contractor: any) => {
    navigate(`/contractors/edit`, { state: { contractor } });
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="hero-stat text-[2rem]">Contractors</h1>
        </div>
        <div className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 px-4 py-3 text-left font-medium" />
                <Input
                  type="search"
                  placeholder="Search contractors..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={() => navigate("/contractors/add")}>
                <Plus className="mr-2 h-4 w-4" />
                Add Contractor
              </Button>
            </div>
          </div>
          <div className="surface">
            <div className="overflow-x-auto max-h-[60vh]">
              <table className="min-w-full border-collapse table-auto">
                <thead className="bg-background">
                  <tr className="border-b border-border/70">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Specialty</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Contact</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Address</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {contractors && contractors.length > 0 ? (
                    contractors.map((contractor: any) => (
                      <tr key={contractor.id} className="border-b border-border/50 hover:bg-muted/40 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {contractor.logo ? (
                              <img src={contractor.logo} alt="" className="h-8 w-8 rounded-full object-cover" />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                                {contractor.name?.[0]}
                              </div>
                            )}
                            <div className="font-medium">{contractor.name}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">{contractor.specialty || "-"}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{contractor.phone || "-"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">{contractor.address || "-"}</td>
                        <td className="px-4 py-3 text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditContractor(contractor)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteContractor(contractor.id)}
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
                        No contractors found
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

export default ContractorList;
