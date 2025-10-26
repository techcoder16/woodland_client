import React, { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/reduxHooks";
import { fetchProperties } from "@/redux/dataStore/propertySlice";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Building } from "lucide-react";

const PropertyManager = () => {
  const dispatch = useAppDispatch();
  const { properties, loading } = useAppSelector((state) => state.properties);

  useEffect(() => {
    dispatch(fetchProperties({ page: 1, search: "" }));
  }, [dispatch]);

  const filteredProperties = properties.filter(property => {
    // Exclude draft properties from finance view
    return property.propertyStatus !== 'DRAFT';
  });

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
          <div className="text-center py-12">
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl p-8 text-white">
              <Building className="w-16 h-16 mx-auto mb-4 opacity-80" />
              <h2 className="text-4xl font-bold mb-2">{filteredProperties.length}</h2>
              <p className="text-lg opacity-90">
                {filteredProperties.length === 1 ? 'Property' : 'Properties'} in Portfolio
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PropertyManager;