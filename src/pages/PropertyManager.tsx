import React, { useState, useEffect } from "react";


import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { Pencil, Trash, Filter, SquareChartGantt, Search, Plus, Building, User, Edit, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/redux/reduxHooks";
import { fetchProperties, deleteProperty } from "@/redux/dataStore/propertySlice";
import { useToast } from "@/components/ui/use-toast";
import DashboardLayout from "@/components/layout/DashboardLayout";

const PropertyManager = () => {
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

  

    const handlePageChange = (page: number) => {
        if (page > 0 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const handleManageProperty = (property: any) => {
        navigate(`/property/manager`, { state: { property } });

    };


    function handleDelete(id: string): void {
        throw new Error("Function not implemented.");
    }

    return (
        <DashboardLayout>

            <div className="p-6 space-y-6">
                <h1 className="text-3xl font-bold tracking-tight">Properties</h1>
                <div className="space-y-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">


                    </div>


                    <div className="glass-card rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="px-4 py-3 text-left font-medium">Name</th>
                                        <th className="px-4 py-3 text-left font-medium">Address</th>
                                        <th className="px-4 py-3 text-left font-medium">Category</th>
                                        <th className="px-4 py-3 text-left font-medium">Status</th>
                                        <th className="px-4 py-3 text-left font-medium">Price</th>

                                    </tr>
                                </thead>
                                <tbody>
                                    {properties.length > 0 ? (
                                        properties.map((property: any) => (
                                            <tr 
                                                         onClick={() => handleManageProperty(property)}

                                                key={property.id}
  className="border-b hover:bg-muted/50 transition-colors cursor-pointer"
                                            >

                                                <td className="px-4 py-3">{property.propertyName}</td>
                                                <td className="px-4 py-3">
                                                    {property.addressLine1}, {property.town}
                                                </td>
                                                <td className="px-4 py-3">{property.category}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${property.status === "Active"
                                                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                                                : property.status === "Inactive"
                                                                    ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                                                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                                            }`}
                                                    >
                                                        {property.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">{property.price}</td>

                                                <td className="px-4 py-3 text-right">

                                                </td>


                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                                                No properties found
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

export default PropertyManager;
