// src/components/TransactionPage.tsx

import React, { useCallback, useEffect, useState } from "react";

// UI components (adjust imports to your paths)
import { Button } from "@/components/ui/button";
import {  Filter, Phone, Plus, Search } from "lucide-react";

// Redux
import { useDispatch } from "react-redux";
import { useAppDispatch, useAppSelector } from "@/redux/reduxHooks";
import { deleteTransaction, fetchTransaction } from "@/redux/dataStore/transactionSlice"; 
// ^ Adjust to match your actual slice and actions

// Others
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import jsPDF from "jspdf";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Input } from "@/components/ui/input";

import { Edit, MoreHorizontal, PhoneCall, Trash } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { AddTransaction } from "@/pages/AddTransaction";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import EditTransaction from "../EditTransaction";


/**
 * 2) TransactionPage Component
 */
const TransactionPage: React.FC<{ propertyId: string }> = ({ propertyId }) => {
  const dispatch = useAppDispatch();
  // const { transaction } = useAppSelector((state) => state.transaction); 
  // ^ Adjust the selector name to match your slice

  
    // Redux selectors
    const { transaction, totalPages, loading, error } = useAppSelector((state) => state.transaction);
  
    const [searchTerm, setSearchTerm] = useState("");
    // Local state
    const [isAddTranscationModalOpen, setIsAddTransactionModalOpen] = useState(false);
    const [isEditTransactionModalOpen, setIsEditTransactionModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [transactionEditSet, setTransactionEdit] = useState("");

      const handlePageChange = useCallback(
        (page: number) => {
          if (page > 0 && page <= totalPages) {
            setCurrentPage(page);
            dispatch(fetchTransaction({ page, search: "" }));
          }
        },
        [dispatch, totalPages]
      );


      
      // Memoized handler for deleting a tenant
      const handleDeleteTransaction = useCallback(
        async (id: any) => {
          try {
            await dispatch(deleteTransaction(id)).unwrap();
            toast.success("Transaction deleted successfully!");
          } catch (error) {
            console.log(error)
            toast.error(error || "Failed to delete Transaction");
          }
        },
        [dispatch]
      );
    
      const handleEditTransaction = useCallback((tenant: any) => {
        setTransactionEdit(tenant);
        setIsEditTransactionModalOpen(true);
      }, []);
    
    


 
  /**
   * 3) Fetch existing transaction data on mount
   */
  useEffect(() => {
    dispatch(fetchTransaction({ propertyId }));
  }, [dispatch, propertyId]);

  /**
   * 4) If we have existing data in Redux, reset the form
   */
 
  /**
   * 5) Handle date fields with a popover + calendar
   */


  /**
   * 8) Define example options for your SelectField
   *    Adjust to your actual branches or dynamic data.
   */
  const branchOptions = [
    { label: "London Branch", value: "london" },
    { label: "Manchester Branch", value: "manchester" },
    { label: "Birmingham Branch", value: "birmingham" },
  ];

  /**
   * 9) Render
   */
  return (
   
      <div className="p-6 space-y-6">
        <div className="flex w-full sm:items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Transcations</h1>
        </div>






        {/* Transcation List with Pagination */}


        <div className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-1 items-center gap-2">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 px-4 py-3 text-left font-medium" />
                  <Input
                    type="search"
                    placeholder="Search Transcations..."
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
              <Button className="ml-auto" onClick={() => setIsAddTransactionModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Transcation
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
                    ) : transaction && transaction.length > 0 ? (
                      transaction.map((transaction: any) => (
                        <tr key={transaction.id} className="border-b">
                          <td className="px-4 py-3 text-sm">{transaction.title}</td>
                          <td className="px-4 py-3 text-sm">{transaction.FirstName}</td>
                          <td className="px-4 py-3 text-sm">{transaction.Email}</td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              {transaction.MobileNo}
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
                                <DropdownMenuItem onClick={() => handleEditTransaction(transaction)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDeleteTransaction(transaction.id)}
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
                          No transcation found.
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
          <AddTransaction isOpen={isAddTranscationModalOpen} onClose={() => setIsAddTransactionModalOpen(false)} />
          {isEditTransactionModalOpen && (
            <EditTransaction
              isOpen={isEditTransactionModalOpen}
              onClose={() => setIsEditTransactionModalOpen(false)}
              transaction={transactionEditSet}
            />
          )}

        </div>

      </div>


  );
};

export default TransactionPage;
