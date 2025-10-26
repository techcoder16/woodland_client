import React, { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/reduxHooks";
import { fetchProperties } from "@/redux/dataStore/propertySlice";
import DashboardLayout from "@/components/layout/DashboardLayout";
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
  MoreVertical,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const PropertyManager = () => {
  const dispatch = useAppDispatch();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const navigate = useNavigate();
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

  const handleEditProperty = (property: any) => {
    navigate(`/property/edit`, { state: { property } });
  };

  const filteredProperties = properties.filter(property => {
    // Exclude draft properties from finance view
    if (property.propertyStatus === 'DRAFT') {
      return false;
    }
    
    // Apply status filter
    return filterStatus === "all" || property.status.toLowerCase() === filterStatus.toLowerCase();
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'sold':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const PropertyCard = ({ property }: { property: any }) => (
    <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-white overflow-hidden">
      {/* Property Image/Icon Header */}
      <div className="relative h-32 bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-600 flex items-center justify-center">
        <div className="absolute top-3 left-3">
          <Badge className="bg-white/20 text-white border-0 hover:bg-white/30">
            <Home className="w-3 h-3 mr-1" />
            {property.category || 'residential'}
          </Badge>
        </div>
        <div className="absolute top-3 right-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white hover:bg-white/20">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleManageProperty(property)}>
                <Settings className="mr-2 h-4 w-4" />
                Manage
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEditProperty(property)}>
                <Eye className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <Building className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Building className="w-12 h-12 text-white/80" />
      </div>

      {/* Property Details */}
      <CardContent className="p-6">
        <div className="space-y-3">
          {/* Address */}
          <div className="flex items-start space-x-2">
            <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-600 truncate">
                {property.addressLine1}, {property.town}
              </p>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-gray-400" />
            <span className="text-lg font-semibold text-gray-900">
              {property.price || 'Price not set'}
            </span>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between">
            <Badge className={cn("text-xs", getStatusColor(property.status))}>
              {property.status}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {property.propertyStatus === 'PUBLISHED' ? 'Published' : 'Draft'}
            </Badge>
          </div>

          {/* Property Number */}
          <div className="text-xs text-gray-500">
            Property #{property.propertyNo || property.id}
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-4 pt-4 border-t">
          <Button 
            onClick={() => handleManageProperty(property)}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
          >
            <Settings className="w-4 h-4 mr-2" />
            Manage Property
          </Button>
        </div>
      </CardContent>
    </Card>
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
                <p className="text-sm text-gray-500">Published Properties</p>
                <p className="text-2xl font-bold text-gray-900">{filteredProperties.length}</p>
              </div>
            </div>
          </div>

          {/* Property Count Display */}
          <div className="text-center py-8 mb-6">
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl p-6 text-white">
              <Building className="w-12 h-12 mx-auto mb-3 opacity-80" />
              <h2 className="text-3xl font-bold mb-2">{filteredProperties.length}</h2>
              <p className="text-lg opacity-90">
                {filteredProperties.length === 1 ? 'Property' : 'Properties'} in Portfolio
              </p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search properties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
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

            <Button onClick={() => navigate('/property/add')} className="bg-red-600 hover:bg-red-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Property
            </Button>
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
                  <Button 
                    onClick={() => navigate('/property/add')}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Property
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {((currentPage - 1) * 12) + 1} to {Math.min(currentPage * 12, filteredProperties.length)} of {filteredProperties.length} properties
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                >
                  Previous
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <Button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        className="w-8 h-8 p-0"
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  size="sm"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PropertyManager;