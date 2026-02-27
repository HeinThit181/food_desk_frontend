import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ auth, children }) {
  if (!auth.isStaff) return <Navigate to="/staff/login" replace />;
  return children;
}
