import { Navigate } from "react-router-dom";
import Dashboard from "./Dashboard";

const ProtectedRoute = ({ children, email, redirectTo }) => {
  const adminEmail = "admin@example.com";  // Admin's email

  // If the logged-in user's email doesn't match admin email, redirect to the given route
  if (email !== adminEmail) {
    return <Navigate to={Dashboard} />;
  }

  return children;
};

export default ProtectedRoute;
