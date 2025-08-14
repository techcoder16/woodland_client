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
import { toast } from "sonner";
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
        async (id: any,propertyId:string) => {

          console.log(id,propertyId)
          try {
dispatch(deleteTransaction({ id: id, propertyId:propertyId })).unwrap();
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
<div className="space-y-4">
  {loading ? (
    <div className="text-center p-4">Loading...</div>
  ) : transaction && transaction.length > 0 ? (
    transaction.map((tx: any) => (
      <div
        key={tx.tranid}
        className="glass-card rounded-lg overflow-hidden border shadow-sm p-4"
      >
        {/* From Tenant Section */}
        <div className="mb-4">
          <h3 className="font-semibold mb-2 text-lg">From Tenant</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <div>
              <span className="text-muted-foreground">Date:</span>
              <div>{tx.fromTenantDate}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Mode:</span>
              <div>{tx.fromTenantMode}</div>
            </div>
            <div>
              <span className="text-muted-foreground">HBenefit1:</span>
              <div>{tx.fromTenantHBenefit1}</div>
            </div>
            <div>
              <span className="text-muted-foreground">HBenefit2:</span>
              <div>{tx.fromTenantHBenefit2}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Rent Received:</span>
              <div>{tx.fromTenantRentReceived}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Other Debit:</span>
              <div>{tx.fromTenantOtherDebit}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Description:</span>
              <div>{tx.fromTenantDescription}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Received By:</span>
              <div>{tx.fromTenantReceivedBy}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Private Note:</span>
              <div>{tx.fromTenantPrivateNote}</div>
            </div>
          </div>
        </div>

        {/* To Landlord Section */}
        <div className="mb-4">
          <h3 className="font-semibold mb-2 text-lg">To Landlord</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <div>
              <span className="text-muted-foreground">Date:</span>
              <div>{tx.toLandlordDate}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Mode:</span>
              <div>{tx.toLandLordMode}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Rent Received:</span>
              <div>{tx.toLandlordRentReceived}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Management Fees:</span>
              <div>{tx.toLandlordLessManagementFees}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Building Expenditure:</span>
              <div>{tx.toLandlordLessBuildingExpenditure}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Actual Expenditure:</span>
              <div>{tx.toLandlordLessBuildingExpenditureActual}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Difference:</span>
              <div>{tx.toLandlordLessBuildingExpenditureDifference}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Net Paid:</span>
              <div>{tx.toLandlordNetPaid}</div>
            </div>
            <div>
              <span className="text-muted-foreground">VAT:</span>
              <div>{tx.toLandlordLessVAT}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Cheque No:</span>
              <div>{tx.toLandlordChequeNo}</div>
            </div>

            <div>
              <span className="text-muted-foreground"> Detail of Expenditure:</span>
              <div>{tx.toLandlordDefaultExpenditure}</div>
            </div>

             <div>
              <span className="text-muted-foreground"> Net Received:</span>
              <div>{tx.toLandlordNetReceived}</div>
            </div>


            <div>
              <span className="text-muted-foreground"> Description:</span>
              <div>{tx.toLandlordExpenditureDescription}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Paid By:</span>
              <div>{tx.toLandlordPaidBy}</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end mt-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEditTransaction(tx)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDeleteTransaction(tx.id,tx.propertyId)}
                className="text-destructive focus:text-destructive"
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    ))
  ) : (
    <div className="text-center p-4">No transactions found.</div>
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

          {/* Modals */}
          <AddTransaction isOpen={isAddTranscationModalOpen} propertyId={propertyId} onClose={() => setIsAddTransactionModalOpen(false)} />
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
