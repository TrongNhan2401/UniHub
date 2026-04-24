import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import WorkshopsPage from "@/pages/WorkshopsPage";
import WorkshopCreatePage from "@/pages/WorkshopCreatePage";
import RegistrationsPage from "@/pages/RegistrationsPage";
import AISummaryPage from "@/pages/AISummaryPage";
import { useAuthStore } from "@/store/authStore";

function ProtectedRoute({ children }) {
  const token = useAuthStore((s) => s.token);
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
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
        path="/workshops/create"
        element={
          <ProtectedRoute>
            <WorkshopCreatePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/registrations"
        element={
          <ProtectedRoute>
            <RegistrationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ai-summary"
        element={
          <ProtectedRoute>
            <AISummaryPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
