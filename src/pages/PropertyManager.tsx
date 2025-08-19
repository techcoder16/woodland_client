import React, { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/reduxHooks";
import { fetchProperties } from "@/redux/dataStore/propertySlice";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

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
    if (page > 0 && page <= totalPages) setCurrentPage(page);
  };

  const handleManageProperty = (property: any) => {
    navigate(`/property/manager`, { state: { property } });
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Finance</h1>

        {/* Properties Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {properties.length > 0 ? (
            properties.map((property: any) => (
              <div
                key={property.id}
                className="glass-card p-4 rounded-lg shadow hover:shadow-lg transition cursor-pointer"
                onClick={() => handleManageProperty(property)}
              >
                <h2 className="text-lg font-semibold">{property.propertyName}</h2>
                <p className="text-sm text-muted-foreground">
                  {property.addressLine1}, {property.town}
                </p>
                <p className="mt-2">
                  <span className="font-medium">Category:</span> {property.category}
                </p>
                <p className="mt-1">
                  <span className="font-medium">Price:</span> {property.price}
                </p>
                <p className="mt-1">
                  <span className="font-medium">Status:</span>{" "}
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                      property.status === "Active"
                        ? "bg-green-100 text-green-800"
                        : property.status === "Inactive"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    )}
                  >
                    {property.status}
                  </span>
                </p>
              </div>
            ))
          ) : (
            <p className="col-span-full text-center text-muted-foreground">
              No properties found
            </p>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center space-x-2 mt-6">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index}
                onClick={() => handlePageChange(index + 1)}
                className={cn(
                  "px-3 py-1 rounded",
                  currentPage === index + 1
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 hover:bg-gray-300"
                )}
              >
                {index + 1}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PropertyManager;
