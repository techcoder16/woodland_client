import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useSimplePermissions } from '@/hooks/useSimplePermissions';

// Import your existing pages
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import VendorList from '@/pages/VendorList';
import AddVendor from '@/pages/AddVendor';
import EditVendor from '@/pages/EditVendor';
import PropertyList from '@/pages/PropertyList';
import AddProperty from '@/pages/AddProperty';
import EditProperty from '@/pages/EditProperty';
import PropertyManager from '@/pages/PropertyManager';
import ManageProperty from '@/pages/Manager/ManagePropertyMain';
import MainTransaction from '@/pages/MainTransaction';
import TenantList from '@/pages/TenantList';
import Settings from '@/pages/Settings';
import Index from '@/pages/Index';
import NotFound from '@/pages/NotFound';
import Unauthorized from '@/pages/Unauthorized';
import SimpleAdminDashboard from '@/pages/SimpleAdminDashboard';
import SimpleSetupGuide from '@/pages/SimpleSetupGuide';

// Navigation Component with Permission Checks
const Navigation: React.FC = () => {
  const { canAccess, isAdmin, user } = useSimplePermissions();

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="flex justify-between items-center">
        <div className="flex space-x-4">
          {canAccess('/dashboard') && (
            <a href="/dashboard" className="hover:text-blue-300">
              Dashboard
            </a>
          )}
          
          {canAccess('/vendors') && (
            <a href="/vendors" className="hover:text-blue-300">
              Vendors
            </a>
          )}
          
          {canAccess('/properties') && (
            <a href="/properties" className="hover:text-blue-300">
              Properties
            </a>
          )}
          
          {canAccess('/tenants') && (
            <a href="/tenants" className="hover:text-blue-300">
              Tenants
            </a>
          )}
          
          {canAccess('/transaction') && (
            <a href="/transaction" className="hover:text-blue-300">
              Transactions
            </a>
          )}
          
          {canAccess('/settings') && (
            <a href="/settings" className="hover:text-blue-300">
              Settings
            </a>
          )}

          {isAdmin && (
            <a href="/admin" className="hover:text-blue-300">
              Admin Panel
            </a>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          <span className="text-sm">
            {user?.first_name} {user?.last_name} ({user?.role})
          </span>
          <button 
            onClick={() => {
              // Add logout logic here
              window.location.href = '/';
            }}
            className="text-sm hover:text-blue-300"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

// Main App Component with Simple Permission System
function SimpleApp() {
  return (
    <BrowserRouter>
      <Navigation />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/setup" element={<SimpleSetupGuide />} />
        
        {/* Protected routes with simple screen access checks */}
        <Route path="/dashboard" element={
          <ProtectedRoute route="/dashboard">
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/vendors" element={
          <ProtectedRoute route="/vendors">
            <VendorList />
          </ProtectedRoute>
        } />
        
        <Route path="/vendors/add" element={
          <ProtectedRoute route="/vendors/add">
            <AddVendor />
          </ProtectedRoute>
        } />
        
        <Route path="/vendors/edit" element={
          <ProtectedRoute route="/vendors/edit">
            <EditVendor />
          </ProtectedRoute>
        } />
        
        <Route path="/properties" element={
          <ProtectedRoute route="/properties">
            <PropertyList />
          </ProtectedRoute>
        } />
        
        <Route path="/property/add" element={
          <ProtectedRoute route="/property/add">
            <AddProperty />
          </ProtectedRoute>
        } />
        
        <Route path="/property/edit" element={
          <ProtectedRoute route="/property/edit">
            <EditProperty />
          </ProtectedRoute>
        } />
        
        <Route path="/property-management" element={
          <ProtectedRoute route="/property-management">
            <PropertyManager />
          </ProtectedRoute>
        } />
        
        <Route path="/property/manager" element={
          <ProtectedRoute route="/property/manager">
            <ManageProperty />
          </ProtectedRoute>
        } />
        
        <Route path="/transaction" element={
          <ProtectedRoute route="/transaction">
            <MainTransaction />
          </ProtectedRoute>
        } />
        
        <Route path="/tenants" element={
          <ProtectedRoute route="/tenants">
            <TenantList />
          </ProtectedRoute>
        } />
        
        <Route path="/settings" element={
          <ProtectedRoute route="/settings">
            <Settings />
          </ProtectedRoute>
        } />
        
        {/* Admin routes */}
        <Route path="/admin" element={
          <ProtectedRoute route="/admin">
            <SimpleAdminDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default SimpleApp;
