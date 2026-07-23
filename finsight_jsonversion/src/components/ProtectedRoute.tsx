import { Navigate, Outlet } from "react-router-dom";

export const ProtectedRoute = () => {
  const token = localStorage.getItem("token");

  if (!token) {
    // Redirect unauthenticated users to login page
    return <Navigate to="/login" replace />;
  }

  // If authenticated, render the child routes (the dashboard)
  return <Outlet />;
};
