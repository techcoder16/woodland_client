# Simple Permission System - Admin & User Access Control

A simplified permission management system with just **Admin** and **User** roles, focusing on screen-based access control.

## 🎯 **Simple Two-Role System**

- **Admin**: Full access to ALL screens
- **User**: Access only to assigned screens

## 🔐 **Test Credentials**

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| **Admin** | `admin@woodland.com` | `admin123` | **ALL screens** |
| **User1** | `user1@woodland.com` | `user123` | Property/tenant screens |
| **User2** | `user2@woodland.com` | `user123` | Vendor/property screens |

## 🖥️ **Screen Access Matrix**

| Screen | Route | Admin | User1 | User2 |
|--------|-------|-------|-------|-------|
| Dashboard | `/dashboard` | ✅ | ✅ | ✅ |
| Vendor List | `/vendors` | ✅ | ❌ | ✅ |
| Add Vendor | `/vendors/add` | ✅ | ❌ | ✅ |
| Edit Vendor | `/vendors/edit` | ✅ | ❌ | ✅ |
| Property List | `/properties` | ✅ | ✅ | ✅ |
| Add Property | `/property/add` | ✅ | ❌ | ✅ |
| Edit Property | `/property/edit` | ✅ | ❌ | ✅ |
| Property Management | `/property-management` | ✅ | ✅ | ❌ |
| Property Manager | `/property/manager` | ✅ | ❌ | ❌ |
| Transaction Management | `/transaction` | ✅ | ✅ | ❌ |
| Tenant List | `/tenants` | ✅ | ✅ | ❌ |
| Settings | `/settings` | ✅ | ✅ | ✅ |
| Home Page | `/` | ✅ | ✅ | ✅ |
| 404 Not Found | `/404` | ✅ | ✅ | ✅ |

## 📁 **File Structure**

```
src/
├── types/
│   └── permissions.ts              # Simple types (Admin/User only)
├── helper/
│   └── simplePermissionApi.ts     # API functions for simple system
├── context/
│   └── AuthContext.tsx            # Updated with simple permissions
├── hooks/
│   └── useSimplePermissions.ts    # Simple permission hooks
├── components/
│   ├── admin/
│   │   ├── SimpleUserManagement.tsx
│   │   └── SimplePermissionManagement.tsx
│   └── ProtectedRoute.tsx         # Simple route protection
├── pages/
│   ├── SimpleAdminDashboard.tsx   # Admin dashboard
│   └── SimpleSetupGuide.tsx      # Setup guide
└── examples/
    └── SimpleAppExample.tsx      # Complete app example
```

## 🚀 **Quick Setup**

### 1. **Automatic Setup**
```tsx
// Navigate to /setup in your app
// Click "Setup Permission System" button
// System will automatically create screens and permissions
```

### 2. **Manual Setup**
```tsx
// 1. Create screens for your application
const screens = [
  { name: 'Dashboard', route: '/dashboard', description: 'Main dashboard' },
  { name: 'Vendors', route: '/vendors', description: 'Vendor management' },
  { name: 'Properties', route: '/properties', description: 'Property management' },
  // ... add more screens
];

// 2. Create users with Admin or User roles
const users = [
  { email: 'admin@woodland.com', role: 'Admin' },
  { email: 'user1@woodland.com', role: 'User' },
  { email: 'user2@woodland.com', role: 'User' }
];

// 3. Assign screen access to users
// Admin automatically gets all screens
// Users get specific screen access
```

## 💻 **Frontend Implementation**

### **1. Simple Permission Hook**
```tsx
import { useSimplePermissions } from '@/hooks/useSimplePermissions';

const MyComponent = () => {
  const { canAccess, isAdmin, user } = useSimplePermissions();

  return (
    <div>
      {canAccess('/dashboard') && <DashboardContent />}
      {canAccess('/vendors') && <VendorContent />}
      {isAdmin && <AdminPanel />}
    </div>
  );
};
```

### **2. Route Protection**
```tsx
import ProtectedRoute from '@/components/ProtectedRoute';

// Protect entire routes
<Route path="/vendors" element={
  <ProtectedRoute route="/vendors">
    <VendorList />
  </ProtectedRoute>
} />

<Route path="/admin" element={
  <ProtectedRoute route="/admin">
    <AdminDashboard />
  </ProtectedRoute>
} />
```

### **3. Navigation with Permissions**
```tsx
const Navigation = () => {
  const { canAccess, isAdmin } = useSimplePermissions();

  return (
    <nav>
      {canAccess('/dashboard') && <Link to="/dashboard">Dashboard</Link>}
      {canAccess('/vendors') && <Link to="/vendors">Vendors</Link>}
      {canAccess('/properties') && <Link to="/properties">Properties</Link>}
      {isAdmin && <Link to="/admin">Admin Panel</Link>}
    </nav>
  );
};
```

### **4. Conditional Rendering**
```tsx
const PropertyManagement = () => {
  const { canAccess } = useSimplePermissions();

  return (
    <div>
      {canAccess('/property/add') && (
        <Button>Add Property</Button>
      )}
      
      {canAccess('/property/edit') && (
        <Button>Edit Property</Button>
      )}
    </div>
  );
};
```

## 🔧 **API Integration**

### **Authentication**
```javascript
// Login
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

const { accessToken, user } = await response.json();
```

### **Check Screen Access**
```javascript
// Check if user can access a screen
const response = await fetch('/api/user-permission/check-access', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ route: '/vendors' })
});

const { canAccess } = await response.json();
```

### **Get User Permissions**
```javascript
// Get all user's screen permissions
const response = await fetch('/api/user-permission/my-permissions', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const permissions = await response.json();
```

## 🎯 **Key Features**

- ✅ **Simple Two-Role System** - Just Admin and User
- ✅ **Screen-Based Access** - Control access to specific routes
- ✅ **Admin Override** - Admin can access everything
- ✅ **Easy Integration** - Simple hooks and components
- ✅ **Automatic Protection** - Routes protected automatically
- ✅ **Role-Based UI** - Different users see different screens

## 🧪 **Testing the System**

### **1. Test Admin Login**
```bash
# Login as admin
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@woodland.com","password":"admin123"}'

# Should return access to all screens
```

### **2. Test User1 Login**
```bash
# Login as user1
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user1@woodland.com","password":"user123"}'

# Should return access to property/tenant screens only
```

### **3. Test User2 Login**
```bash
# Login as user2
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user2@woodland.com","password":"user123"}'

# Should return access to vendor/property screens only
```

## 🔄 **Database Commands**

```bash
# Clear and reseed with Admin/User system
npm run clear:db
npm run seed:admin-user
```

## 📚 **Usage Examples**

### **Complete App Integration**
```tsx
// App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        
        {/* Protected routes */}
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
        
        <Route path="/admin" element={
          <ProtectedRoute route="/admin">
            <AdminDashboard />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}
```

### **Component-Level Permissions**
```tsx
const VendorManagement = () => {
  const { canAccess, isAdmin } = useSimplePermissions();

  return (
    <div>
      <h1>Vendor Management</h1>
      
      {canAccess('/vendors/add') && (
        <Button>Add New Vendor</Button>
      )}
      
      {canAccess('/vendors/edit') && (
        <Button>Edit Vendor</Button>
      )}
      
      {isAdmin && (
        <Button variant="destructive">Delete Vendor</Button>
      )}
    </div>
  );
};
```

## 🚀 **Ready to Implement!**

This simple permission system provides:

1. **Easy Setup** - Just two roles, no complex permissions
2. **Screen-Based Access** - Control access to specific routes
3. **Admin Override** - Admin can access everything
4. **Simple Integration** - Easy hooks and components
5. **Automatic Protection** - Routes protected automatically

Perfect for applications that need simple role-based access control without the complexity of granular permissions! 🎉

## 📞 **Support**

- Check the `/setup` page for interactive setup guide
- Use the examples in `/examples` folder
- Refer to TypeScript interfaces for API documentation
- Test with the provided credentials

---

**Simple, effective, and easy to implement!** 🚀
