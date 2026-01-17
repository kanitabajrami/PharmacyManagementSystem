import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRoles }) => {
  // Try to parse roles safely
  let roles;
  try {
    roles = JSON.parse(localStorage.getItem("roles") || "[]");
  } catch {
    roles = [];
  }

  // Ensure roles is an array
  if (!Array.isArray(roles)) roles = [roles];

  // Check if any allowedRoles match
  if (!roles.some(r => allowedRoles.includes(r))) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
