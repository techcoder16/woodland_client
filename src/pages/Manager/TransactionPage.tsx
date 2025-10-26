// src/components/TransactionPage.tsx

import React, { useCallback, useEffect, useState } from "react";

// UI components
import { Button } from "@/components/ui/button";
import { Filter, Plus, Search, Eye, Calendar, CreditCard, User, Building, AlertCircle, RefreshCw } from "lucide-react";

// Redux
import { useAppDispatch, useAppSelector } from "@/redux/reduxHooks";
import { 
  deleteTransaction, 
  fetchTransaction, 
  getDraftTransactions, 
  getActiveTransactions, 
  publishDraftTransaction, 
  createDraftTransaction,
  StatusTransaction 
} from "@/redux/dataStore/transactionSlice";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Others
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Edit, MoreHorizontal, Trash } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const TransactionPage: React.FC<{ propertyId: string }> = ({ propertyId }) => {
  const dispatch = useAppDispatch();
  
  // Redux selectors
  const { transaction, totalPages, total, skip, take, loading, error } = useAppSelector((state) => state.transaction);
  
  // Debug logging
  console.log('TransactionPage state:', { 
    transactionCount: transaction?.length || 0, 
    loading, 
    error, 
    total
  });
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddTranscationModalOpen, setIsAddTransactionModalOpen] = useState(false);
  const [isEditTransactionModalOpen, setIsEditTransactionModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [transactionEditSet, setTransactionEdit] = useState("");
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards'); // Default to cards for mobile
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'active'>('all');
  const [pageSize, setPageSize] = useState(10);

  const handlePageChange = useCallback(
    (page: number) => {
      if (page > 0 && page <= totalPages) {
        setCurrentPage(page);
        const skip = (page - 1) * pageSize;
        
        if (statusFilter === 'draft') {
          dispatch(getDraftTransactions({ propertyId, skip, take: pageSize }));
        } else if (statusFilter === 'active') {
          dispatch(getActiveTransactions({ propertyId, skip, take: pageSize }));
        } else {
          dispatch(fetchTransaction({ propertyId, skip, take: pageSize }));
        }
      }
    },
    [dispatch, totalPages, propertyId, pageSize, statusFilter]
  );

  const handleDeleteTransaction = useCallback(
    async (id: any, propertyId: string) => {
      try {
        dispatch(deleteTransaction({ id: id, propertyId: propertyId })).unwrap();
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

  const handlePublishDraft = useCallback(
    async (id: string, propertyId: string) => {
      try {
        await dispatch(publishDraftTransaction({ id, propertyId })).unwrap();
        toast.success("Draft transaction published successfully!");
      } catch (error) {
        console.log(error);
        toast.error(error || "Failed to publish draft transaction");
      }
    },
    [dispatch]
  );

  // Load transactions based on current filter
  const loadTransactions = useCallback(() => {
    const skip = (currentPage - 1) * pageSize;
    
    if (statusFilter === 'draft') {
      dispatch(getDraftTransactions({ propertyId, skip, take: pageSize }));
    } else if (statusFilter === 'active') {
      dispatch(getActiveTransactions({ propertyId, skip, take: pageSize }));
    } else {
      dispatch(fetchTransaction({ propertyId, skip, take: pageSize }));
    }
  }, [dispatch, propertyId, currentPage, pageSize, statusFilter]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Handle status filter change
  const handleStatusFilterChange = useCallback((filter: 'all' | 'draft' | 'active') => {
    setStatusFilter(filter);
    setCurrentPage(1); // Reset to first page when changing filter
  }, []);

  // Test function to create a sample transaction
  const createTestTransaction = useCallback(async () => {
    try {
      const testTransaction = {
        propertyId,
        Branch: 'Test Branch',
        fromTenantDate: new Date().toISOString().split('T')[0],
        fromTenantMode: 'Cash',
        fromTenantRentReceived: 1000,
        fromTenantDescription: 'Test transaction',
        toLandlordDate: new Date().toISOString().split('T')[0],
        toLandLordMode: 'Bank Transfer',
        toLandlordRentReceived: 1000,
        toLandlordLessManagementFees: 50,
        toLandlordNetPaid: 950,
        landlordPaidBy: 'Test User',
        status: StatusTransaction.DRAFT
      };
      
      await dispatch(createDraftTransaction(testTransaction)).unwrap();
      toast.success('Test transaction created successfully!');
    } catch (error: any) {
      toast.error('Failed to create test transaction: ' + error.message);
    }
  }, [dispatch, propertyId]);

  // Use transactions directly since filtering is now done server-side
  const filteredTransactions = transaction;

  // Mobile Card Component
  const TransactionCard = ({ tx }: { tx: any }) => (
    <Card className="w-full mb-4">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              {tx.fromTenantDate || 'No Date'}
            </CardTitle>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {tx.fromTenantMode || 'N/A'}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {tx.toLandLordMode || 'N/A'}
              </Badge>
              {tx.status === StatusTransaction.DRAFT && (
                <Badge variant="destructive" className="text-xs">
                  DRAFT
                </Badge>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEditTransaction(tx)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              {tx.status === StatusTransaction.DRAFT && (
                <DropdownMenuItem onClick={() => handlePublishDraft(tx.id, tx.propertyId)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Publish Draft
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDeleteTransaction(tx.id, tx.propertyId)}
                className="text-destructive focus:text-destructive"
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* From Tenant Section */}
        <div className="border-l-4 border-green-500 pl-3">
          <h4 className="font-semibold text-sm text-green-700 mb-2 flex items-center gap-1">
            <User className="h-3 w-3" />
            From Tenant
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Rent:</span>
              <p className="font-medium">£{tx.fromTenantRentReceived || '0'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">HBenefit:</span>
              <p className="font-medium">£{tx.fromTenantHBenefit1 || '0'}</p>
            </div>
            {tx.fromTenantDescription && (
              <div className="col-span-2">
                <span className="text-muted-foreground">Description:</span>
                <p className="font-medium text-xs">{tx.fromTenantDescription}</p>
              </div>
            )}
            {tx.fromTenantReceivedBy && (
              <div className="col-span-2">
                <span className="text-muted-foreground">Received by:</span>
                <p className="font-medium">{tx.fromTenantReceivedBy}</p>
              </div>
            )}
          </div>
        </div>

        {/* To Landlord Section */}
        <div className="border-l-4 border-blue-500 pl-3">
          <h4 className="font-semibold text-sm text-blue-700 mb-2 flex items-center gap-1">
            <Building className="h-3 w-3" />
            To Landlord
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Date:</span>
              <p className="font-medium">{tx.toLandlordDate || 'N/A'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Net Paid:</span>
              <p className="font-medium">£{tx.toLandlordNetPaid || '0'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Management:</span>
              <p className="font-medium">£{tx.toLandlordLessManagementFees || '0'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">VAT:</span>
              <p className="font-medium">£{tx.toLandlordLessVAT || '0'}</p>
            </div>
            {tx.toLandlordChequeNo && (
              <div className="col-span-2 flex items-center gap-1">
                <CreditCard className="h-3 w-3" />
                <span className="text-muted-foreground">Cheque:</span>
                <p className="font-medium">{tx.toLandlordChequeNo}</p>
              </div>
            )}
            {tx.toLandlordPaidBy && (
              <div className="col-span-2">
                <span className="text-muted-foreground">Paid by:</span>
                <p className="font-medium">{tx.toLandlordPaidBy}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 max-w-full overflow-x-hidden">
      <div className="w-full">
        {/* Header - Mobile Optimized */}
        <div className="bg-white border-b px-4 py-4 sm:px-6 max-w-full overflow-x-hidden">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Transactions</h1>
              <Button 
                size="sm" 
                onClick={() => setIsAddTransactionModalOpen(true)}
                className="shrink-0"
              >
                <Plus className="mr-1 h-4 w-4" />
                <span className="hidden sm:inline">Add Transaction</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </div>
            
            {/* Search and View Toggle */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search transactions..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'cards' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('cards')}
                  className="flex-1 sm:flex-none"
                >
                  Cards
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="flex-1 sm:flex-none"
                >
                  Table
                </Button>
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusFilterChange('all')}
                  className="flex-1 sm:flex-none"
                >
                  All
                </Button>
                <Button
                  variant={statusFilter === 'draft' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusFilterChange('draft')}
                  className="flex-1 sm:flex-none"
                >
                  Drafts
                </Button>
                <Button
                  variant={statusFilter === 'active' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusFilterChange('active')}
                  className="flex-1 sm:flex-none"
                >
                  Active
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 w-full overflow-x-hidden">
          {loading ? (
            <div className="text-center p-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-2 text-muted-foreground">Loading transactions...</p>
              <p className="text-sm text-gray-500 mt-1">Fetching {statusFilter === 'all' ? 'all' : statusFilter} transactions...</p>
            </div>
          ) : error ? (
            <div className="text-center p-8">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Transactions</h3>
              <p className="text-gray-500 mb-4">{error}</p>
              <Button onClick={loadTransactions} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          ) : filteredTransactions && filteredTransactions.length > 0 ? (
            <>
              {viewMode === 'cards' ? (
                // Mobile Card View
                <div className="space-y-4">
                  {filteredTransactions.map((tx: any) => (
                    <TransactionCard key={tx.tranid} tx={tx} />
                  ))}
                </div>
              ) : (
                // Desktop Grid View (No Table)
                <div className="bg-white rounded-lg border shadow-sm w-full">
                  <div className="w-full overflow-x-auto">
                    {/* Header Row */}
                    <div className="grid grid-cols-12 gap-2 p-4 border-b bg-gray-50 text-sm font-medium text-gray-700 min-w-[1000px]">
                      <div className="col-span-1">From Date</div>
                      <div className="col-span-1">Mode</div>
                      <div className="col-span-1">HBenefit</div>
                      <div className="col-span-1">Rent Recv.</div>
                      <div className="col-span-2">Description</div>
                      <div className="col-span-1">To Date</div>
                      <div className="col-span-1">Mode</div>
                      <div className="col-span-1">Mgmt Fees</div>
                      <div className="col-span-1">Net Paid</div>
                      <div className="col-span-1">Status</div>
                      <div className="col-span-1">Actions</div>
                    </div>
                    
                    {/* Data Rows */}
                    <div className="divide-y">
                      {filteredTransactions.map((tx: any, index: number) => (
                        <div 
                          key={tx.tranid} 
                          className={`grid grid-cols-12 gap-2 p-4 text-sm hover:bg-gray-50 min-w-[1000px] ${
                            index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                          }`}
                        >
                          <div className="col-span-1 truncate">{tx.fromTenantDate || '-'}</div>
                          <div className="col-span-1 truncate">{tx.fromTenantMode || '-'}</div>
                          <div className="col-span-1 truncate">£{tx.fromTenantHBenefit1 || '0'}</div>
                          <div className="col-span-1 truncate">£{tx.fromTenantRentReceived || '0'}</div>
                          <div className="col-span-2 truncate" title={tx.fromTenantDescription}>
                            {tx.fromTenantDescription || '-'}
                          </div>
                          <div className="col-span-1 truncate">{tx.toLandlordDate || '-'}</div>
                          <div className="col-span-1 truncate">{tx.toLandLordMode || '-'}</div>
                          <div className="col-span-1 truncate">£{tx.toLandlordLessManagementFees || '0'}</div>
                          <div className="col-span-1 truncate">£{tx.toLandlordNetPaid || '0'}</div>
                          <div className="col-span-1 flex justify-center">
                            {tx.status === StatusTransaction.DRAFT ? (
                              <Badge variant="destructive" className="text-xs">
                                DRAFT
                              </Badge>
                            ) : (
                              <Badge variant="default" className="text-xs">
                                ACTIVE
                              </Badge>
                            )}
                          </div>
                          <div className="col-span-1 flex justify-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditTransaction(tx)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                {tx.status === StatusTransaction.DRAFT && (
                                  <DropdownMenuItem onClick={() => handlePublishDraft(tx.id, tx.propertyId)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Publish Draft
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDeleteTransaction(tx.id, tx.propertyId)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Pagination Info */}
              <div className="mt-4 flex justify-between items-center text-sm text-gray-600">
                <div>
                  Showing {skip + 1} to {Math.min(skip + take, total)} of {total} transactions
                </div>
                <div className="flex items-center gap-2">
                  <span>Page size:</span>
                  <select 
                    value={pageSize} 
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="border rounded px-2 py-1"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              {/* Pagination */}
              <div className="mt-6 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => handlePageChange(currentPage - 1)}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, index) => {
                      let pageNumber;
                      if (totalPages <= 5) {
                        pageNumber = index + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = index + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + index;
                      } else {
                        pageNumber = currentPage - 2 + index;
                      }
                      
                      return (
                        <PaginationItem key={pageNumber}>
                          <PaginationLink
                            onClick={() => handlePageChange(pageNumber)}
                            isActive={currentPage === pageNumber}
                            className="cursor-pointer"
                          >
                            {pageNumber}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => handlePageChange(currentPage + 1)}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="mx-auto max-w-md">
                <Building className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">
                  {searchTerm ? 'No transactions found' : `No ${statusFilter === 'all' ? '' : statusFilter} transactions found`}
                </h3>
                <p className="mt-2 text-muted-foreground">
                  {searchTerm 
                    ? `No transactions match "${searchTerm}"` 
                    : statusFilter === 'draft' 
                      ? "No draft transactions have been created yet."
                      : statusFilter === 'active'
                        ? "No active transactions found."
                        : "Get started by adding your first transaction."
                  }
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center mt-4">
                  {!searchTerm && (
                    <Button onClick={() => setIsAddTransactionModalOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Transaction
                    </Button>
                  )}
                  <Button onClick={loadTransactions} variant="outline">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </Button>
                  {/* <Button onClick={createTestTransaction} variant="secondary" size="sm">
                    Create Test Transaction
                  </Button> */}
                </div>
                {/* Debug info */}
                {/* <div className="mt-6 p-3 bg-gray-50 rounded text-xs text-gray-600 text-left">
                  <p><strong>Debug Info:</strong></p>
                  <p>Property ID: {propertyId}</p>
                  <p>Status Filter: {statusFilter}</p>
                  <p>Total from API: {total}</p>
                  <p>Transactions loaded: {transaction?.length || 0}</p>
                  <p>Loading: {loading ? 'Yes' : 'No'}</p>
                  <p>Error: {error || 'None'}</p>
                </div> */}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddTransaction 
        isOpen={isAddTranscationModalOpen} 
        propertyId={propertyId} 
        onClose={() => setIsAddTransactionModalOpen(false)} 
      />
      {isEditTransactionModalOpen && (
        <EditTransaction
          isOpen={isEditTransactionModalOpen}
          onClose={() => setIsEditTransactionModalOpen(false)}
          transaction={transactionEditSet}
        />
      )}
    </div>
  );
};

export default TransactionPage;