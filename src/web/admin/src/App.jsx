import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import DashboardPage from "@/pages/DashboardPage";
import WorkshopsPage from "@/pages/WorkshopsPage";
import CalendarPage from "@/pages/CalendarPage";
import { useAuth } from "@/contexts/AuthContext";
import AdminSignInPage from "./pages/AdminSignInPage";
import WorkshopDetailPage from "./pages/WorkshopDetailPage";
import CheckinStaffPage from "./pages/CheckinStaffPage";

function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/workshops"
        element={
          <ProtectedRoute>
            <WorkshopsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/calendar"
        element={
          <ProtectedRoute>
            <CalendarPage />
          </ProtectedRoute>
        }
      />
      <Route path="/workshop/:id" element={<WorkshopDetailPage />} />
      <Route path="/sign-in" element={<AdminSignInPage />} />
      <Route
        path="/checkin-staff"
        element={
          <ProtectedRoute>
            <CheckinStaffPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
