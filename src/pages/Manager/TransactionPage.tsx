import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Search, Eye, AlertCircle, RefreshCw, Edit, MoreHorizontal, Trash, Building } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/reduxHooks";
import {
  deleteTransaction,
  fetchTransaction,
  getDraftTransactions,
  getActiveTransactions,
  publishDraftTransaction,
  StatusTransaction,
} from "@/redux/dataStore/transactionSlice";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";

const TransactionPage: React.FC<{ propertyId: string }> = ({ propertyId }) => {
  const dispatch = useAppDispatch();
  const { transaction, totalPages, total, skip, take, loading, error } = useAppSelector(
    (state) => state.transaction
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [isAddTranscationModalOpen, setIsAddTransactionModalOpen] = useState(false);
  const [isEditTransactionModalOpen, setIsEditTransactionModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [transactionEditSet, setTransactionEdit] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "active">("all");
  const [pageSize, setPageSize] = useState(10);

  const loadTransactions = useCallback(() => {
    const skip = (currentPage - 1) * pageSize;
    if (statusFilter === "draft") {
      dispatch(getDraftTransactions({ propertyId, skip, take: pageSize }));
    } else if (statusFilter === "active") {
      dispatch(getActiveTransactions({ propertyId, skip, take: pageSize }));
    } else {
      dispatch(fetchTransaction({ propertyId, skip, take: pageSize }));
    }
  }, [dispatch, propertyId, currentPage, pageSize, statusFilter]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const handlePageChange = useCallback(
    (page: number) => {
      if (page > 0 && page <= totalPages) {
        setCurrentPage(page);
      }
    },
    [totalPages]
  );

  const handleDeleteTransaction = useCallback(
    async (id: any, propertyId: string) => {
      try {
        await dispatch(deleteTransaction({ id, propertyId })).unwrap();
        toast.success("Transaction deleted successfully!");
      } catch (error) {
        toast.error("Failed to delete transaction");
      }
    },
    [dispatch]
  );

  const handleEditTransaction = useCallback((tx: any) => {
    setTransactionEdit(tx);
    setIsEditTransactionModalOpen(true);
  }, []);

  const handlePublishDraft = useCallback(
    async (id: string, propertyId: string) => {
      try {
        await dispatch(publishDraftTransaction({ id, propertyId })).unwrap();
        toast.success("Draft transaction published successfully!");
      } catch {
        toast.error("Failed to publish draft transaction");
      }
    },
    [dispatch]
  );

  const handleStatusFilterChange = useCallback((filter: "all" | "draft" | "active") => {
    setStatusFilter(filter);
    setCurrentPage(1);
  }, []);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col space-y-4 mb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
          <Button size="sm" onClick={() => setIsAddTransactionModalOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Add Transaction
          </Button>
        </div>

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
            {(["all", "draft", "active"] as const).map((f) => (
              <Button
                key={f}
                variant={statusFilter === f ? "default" : "outline"}
                size="sm"
                onClick={() => handleStatusFilterChange(f)}
                className="capitalize"
              >
                {f === "all" ? "All" : f === "draft" ? "Drafts" : "Active"}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center p-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <p className="mt-2 text-muted-foreground">Loading transactions...</p>
        </div>
      ) : error ? (
        <div className="text-center p-8">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-2" />
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={loadTransactions} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" /> Try Again
          </Button>
        </div>
      ) : transaction && transaction.length > 0 ? (
        <>
          <div className="bg-white rounded-lg border shadow-sm w-full overflow-x-auto">
            {/* Header Row */}
            <div className="grid grid-cols-12 gap-2 p-3 border-b bg-gray-50 text-sm font-medium text-gray-700 min-w-[900px]">
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
            <div className="divide-y min-w-[900px]">
              {transaction.map((tx: any, index: number) => (
                <div
                  key={tx.tranid}
                  className={`grid grid-cols-12 gap-2 p-3 text-sm hover:bg-gray-50 ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-25"
                  }`}
                >
                  <div className="col-span-1 truncate">{tx.fromTenantDate || "-"}</div>
                  <div className="col-span-1 truncate">{tx.fromTenantMode || "-"}</div>
                  <div className="col-span-1 truncate">£{tx.fromTenantHBenefit1 || "0"}</div>
                  <div className="col-span-1 truncate">£{tx.fromTenantRentReceived || "0"}</div>
                  <div className="col-span-2 truncate" title={tx.fromTenantDescription}>
                    {tx.fromTenantDescription || "-"}
                  </div>
                  <div className="col-span-1 truncate">{tx.toLandlordDate || "-"}</div>
                  <div className="col-span-1 truncate">{tx.toLandLordMode || "-"}</div>
                  <div className="col-span-1 truncate">£{tx.toLandlordLessManagementFees || "0"}</div>
                  <div className="col-span-1 truncate">£{tx.toLandlordNetPaid || "0"}</div>
                  <div className="col-span-1 flex justify-center">
                    <Badge
                      variant={tx.status === StatusTransaction.DRAFT ? "destructive" : "default"}
                      className="text-xs"
                    >
                      {tx.status === StatusTransaction.DRAFT ? "DRAFT" : "ACTIVE"}
                    </Badge>
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
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        {tx.status === StatusTransaction.DRAFT && (
                          <DropdownMenuItem onClick={() => handlePublishDraft(tx.id, tx.propertyId)}>
                            <Eye className="mr-2 h-4 w-4" /> Publish Draft
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteTransaction(tx.id, tx.propertyId)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-gray-600">
            <div>
              Showing {skip + 1}–{Math.min(skip + take, total)} of {total} transactions
            </div>
            <div className="flex items-center gap-2">
              <span>Page size:</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="border rounded px-2 py-1"
              >
                {[5, 10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>

          <div className="mt-4 flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(currentPage - 1)}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const p =
                    totalPages <= 5 ? i + 1
                    : currentPage <= 3 ? i + 1
                    : currentPage >= totalPages - 2 ? totalPages - 4 + i
                    : currentPage - 2 + i;
                  return (
                    <PaginationItem key={p}>
                      <PaginationLink
                        onClick={() => handlePageChange(p)}
                        isActive={currentPage === p}
                        className="cursor-pointer"
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => handlePageChange(currentPage + 1)}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <Building className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">
            {statusFilter === "all" ? "No transactions found" : `No ${statusFilter} transactions`}
          </h3>
          <p className="mt-2 text-muted-foreground text-sm">
            {statusFilter === "draft"
              ? "No draft transactions yet."
              : statusFilter === "active"
              ? "No active transactions found."
              : "Get started by adding your first transaction."}
          </p>
          <div className="flex gap-2 justify-center mt-4">
            <Button onClick={() => setIsAddTransactionModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Transaction
            </Button>
            <Button onClick={loadTransactions} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
          </div>
        </div>
      )}

      <AddTransaction
        isOpen={isAddTranscationModalOpen}
        propertyId={propertyId}
        onClose={() => {
          setIsAddTransactionModalOpen(false);
          loadTransactions();
        }}
      />
      {isEditTransactionModalOpen && (
        <EditTransaction
          isOpen={isEditTransactionModalOpen}
          onClose={() => {
            setIsEditTransactionModalOpen(false);
            loadTransactions();
          }}
          transaction={transactionEditSet}
        />
      )}
    </div>
  );
};

export default TransactionPage;
