import React, { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/reduxHooks";
import { fetchProperties } from "@/redux/dataStore/propertySlice";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  Search, 
  Filter, 
  Building, 
  MapPin, 
  DollarSign, 
  Calendar,
  Eye,
  Settings,
  TrendingUp,
  Users,
  Home,
  Star,
  MoreVertical
} from "lucide-react";

const PropertyManager = () => {
  const dispatch = useAppDispatch();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewMode, setViewMode] = useState("grid"); // grid or list
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

  const filteredProperties = properties.filter(property => 
    filterStatus === "all" || property.status.toLowerCase() === filterStatus.toLowerCase()
  );

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "inactive":
        return "bg-red-100 text-red-800 border-red-200";
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "sold":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case "residential":
        return <Home className="w-4 h-4" />;
      case "commercial":
        return <Building className="w-4 h-4" />;
      case "industrial":
        return <Settings className="w-4 h-4" />;
      default:
        return <Building className="w-4 h-4" />;
    }
  };

  const formatPrice = (price: any) => {
    if (!price) return "N/A";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const PropertyCard = ({ property }: { property: any }) => (
    <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden cursor-pointer transform hover:-translate-y-1">
      {/* Property Image */}
      <div className="relative h-48 bg-gradient-to-br from-red-500 to-purple-600 overflow-hidden">
        {property.image ? (
          <img 
            src={property.image} 
            alt={property.propertyName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Building className="w-16 h-16 text-white/80" />
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <span className={cn(
            "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm",
            getStatusColor(property.status)
          )}>
            {property.status}
          </span>
        </div>

        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <div className="flex items-center space-x-1 bg-white/20 backdrop-blur-sm rounded-full px-2 py-1">
            {getCategoryIcon(property.category)}
            <span className="text-xs font-medium text-white">
              {property.category}
            </span>
          </div>
        </div>

        {/* Property Rating */}
        {property.rating && (
          <div className="absolute bottom-3 left-3">
            <div className="flex items-center space-x-1 bg-white/20 backdrop-blur-sm rounded-full px-2 py-1">
              <Star className="w-3 h-3 text-yellow-400 fill-current" />
              <span className="text-xs font-medium text-white">
                {property.rating}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Property Details */}
      <div className="p-5 space-y-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-red-600 transition-colors">
            {property.propertyName}
          </h3>
          <div className="flex items-center text-gray-500 text-sm">
            <MapPin className="w-4 h-4 mr-1" />
            <span>{property.addressLine1}, {property.town}</span>
          </div>
        </div>

        {/* Property Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="text-xs text-gray-500">Price</span>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {property.price}
            </p>
          </div>
          
          {property.bedrooms && (
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <Home className="w-4 h-4 text-red-600" />
                <span className="text-xs text-gray-500">Bedrooms</span>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {property.bedrooms}
              </p>
            </div>
          )}
        </div>

        {/* Additional Info */}
        <div className="space-y-2">
          {property.area && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Area</span>
              <span className="font-medium">{property.area} sq ft</span>
            </div>
          )}
          
          {property.yearBuilt && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Year Built</span>
              <span className="font-medium">{property.yearBuilt}</span>
            </div>
          )}

          {property.lastUpdated && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Last Updated</span>
              <span className="font-medium">
                {new Date(property.lastUpdated).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleManageProperty(property);
            }}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors font-medium text-sm flex items-center justify-center space-x-2"
          >
            <Settings className="w-4 h-4" />
            <span>Manage</span>
          </button>
          
       
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Property Finance Management</h1>
              <p className="text-gray-600">Manage and monitor your property portfolio</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-red-50 rounded-lg p-3">
                <Building className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Properties</p>
                <p className="text-2xl font-bold text-gray-900">{properties.length}</p>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search properties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="pl-10 pr-8 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent appearance-none bg-white min-w-[150px]"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
                <option value="sold">Sold</option>
              </select>
            </div>

            {/* View Toggle */}
            {/* <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "px-4 py-3 text-sm font-medium transition-colors",
                  viewMode === "grid"
                    ? "bg-red-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                )}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "px-4 py-3 text-sm font-medium transition-colors",
                  viewMode === "list"
                    ? "bg-red-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                )}
              >
                List
              </button>
            </div> */}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          </div>
        )}

        {/* Properties Grid */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProperties.length > 0 ? (
              filteredProperties.map((property: any) => (
                <PropertyCard key={property.id} property={property} />
              ))
            ) : (
              <div className="col-span-full">
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                  <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm || filterStatus !== "all" 
                      ? "Try adjusting your search or filters"
                      : "Get started by adding your first property"
                    }
                  </p>
                  <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors">
                    Add Property
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Enhanced Pagination */}
        {totalPages > 1 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing page {currentPage} of {totalPages}
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  First
                </button>
                
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <div className="flex space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
                    const page = index + Math.max(1, currentPage - 2);
                    if (page > totalPages) return null;
                    
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={cn(
                          "px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                          currentPage === page
                            ? "bg-red-600 text-white"
                            : "border border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
                        )}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
                
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Last
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PropertyManager;