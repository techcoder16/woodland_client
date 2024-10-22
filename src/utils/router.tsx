import RootPage from "../Component/RootPage";
import Login from "../Component/Login/LoginInfo";
import DetailSummary from "../Component/DetailSummary/DetailSummary";
// import Main from "../Component/Data/Main";

import { createBrowserRouter } from "react-router-dom";
import DashBoard from "../Component/Dashboard/Dashboard";
import UsersList from '../Component/Users/UserList';

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootPage />
  },
  {
    path: "/dashboard",
    element: <DashBoard />
  },
  {
    path: "/login",
    element: <Login />
  },

  {
    path: "/managers",
    element: <UsersList />
  },
  
  // Additional routes can be added here
]);

export default router;
