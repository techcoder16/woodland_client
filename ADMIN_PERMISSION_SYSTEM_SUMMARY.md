# Admin Permission System - Clear Names

## 🎯 **What This System Does**

This is a **permission management system** that lets administrators:

1. **Create Users** - Add new users to the system
2. **Create Screens** - Add new pages/routes to the application  
3. **Manage Permissions** - Control which users can access which screens

## 👥 **Two Types of Users**

- **Admin** - Can access everything and manage the system
- **User** - Can only access screens they are assigned to

## 📁 **Main Components (Normal Names)**

### **Admin Dashboard** (`src/pages/SimpleAdminDashboard.tsx`)
- Main admin page where you manage everything
- Shows tabs for Users, Permissions, and Analytics
- Admin can see all users and screens

### **User Management** (`src/components/admin/SimpleUserManagement.tsx`) 
- List all users in the system
- Create new users
- Edit existing users
- Delete users
- Search through users

### **Permission Management** (`src/components/admin/SimplePermissionManagement.tsx`)
- Assign screen access to users
- Create new screens/pages
- View which users have access to which screens
- Manage screen permissions

### **Create User Page** (`src/pages/admin/CreateUser.tsx`)
- Dedicated page for creating new users
- Choose user role (Admin or User)
- Select which screens the user can access
- Fill in user details (name, email, password)

### **Create Screen Page** (`src/pages/admin/CreateScreen.tsx`)
- Dedicated page for creating new screens/pages
- Define screen name, description, and route
- Set screen status (Active/Inactive)
- Preview the screen before creating

## 🔧 **How to Use**

### **1. Admin Login**
- Login as admin to access the admin dashboard
- Admin can see all users and manage everything

### **2. Create a New Screen**
- Go to Admin Dashboard
- Click "Create Screen" 
- Enter screen details (name, route, description)
- Save the screen

### **3. Create a New User**
- Go to Admin Dashboard  
- Click "Create User"
- Enter user details (name, email, password)
- Choose role (Admin or User)
- Select which screens the user can access
- Save the user

### **4. Manage Permissions**
- Go to Admin Dashboard
- Click "Permissions" tab
- See all users and their screen access
- Add or remove screen access for users

## 🚀 **Key Features**

- **Easy User Creation** - Simple form to add new users
- **Screen Management** - Create new pages/routes easily
- **Permission Control** - Control who can access what
- **Admin Override** - Admin can access everything
- **User Restrictions** - Regular users only see their assigned screens

## 📋 **Test Credentials**

| Role | Email | Password | Access |
|------|-------|----------|--------|
| **Admin** | `admin@woodland.com` | `admin123` | **Everything** |
| **User1** | `user1@woodland.com` | `user123` | Property screens only |
| **User2** | `user2@woodland.com` | `user123` | Vendor screens only |

## 💡 **Simple Workflow**

1. **Admin logs in** → Sees admin dashboard
2. **Admin creates screens** → Defines new pages/routes
3. **Admin creates users** → Adds users and assigns screen access
4. **Users log in** → Only see screens they have access to
5. **Admin manages** → Can change user permissions anytime

This system makes it easy for administrators to control who can access different parts of the application!
