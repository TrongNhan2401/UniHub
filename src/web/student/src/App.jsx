import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "@/pages/LoginPage";
import WorkshopListPage from "@/pages/WorkshopListPage";
import WorkshopDetailPage from "@/pages/WorkshopDetailPage";
import MyRegistrationsPage from "@/pages/MyRegistrationsPage";
import NotificationsPage from "@/pages/NotificationsPage";
import PaymentResultPage from "@/pages/PaymentResultPage";
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
            <WorkshopListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/workshops/:id"
        element={
          <ProtectedRoute>
            <WorkshopDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-registrations"
        element={
          <ProtectedRoute>
            <MyRegistrationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications/:notificationId"
        element={
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        }
      />
      {/* Payment return routes — không cần ProtectedRoute vì PayOS redirect về trực tiếp */}
      <Route path="/payment/result" element={<PaymentResultPage />} />
      <Route path="/payment/cancel" element={<PaymentResultPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
