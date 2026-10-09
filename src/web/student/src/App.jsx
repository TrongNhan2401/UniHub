import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "@/pages/LoginPage";
import WorkshopListPage from "@/pages/WorkshopListPage";
import WorkshopDetailPage from "@/pages/WorkshopDetailPage";
import LeaderboardPage from "@/pages/LeaderboardPage";
import MyRegistrationsPage from "@/pages/MyRegistrationsPage";
import NotificationsPage from "@/pages/NotificationsPage";
import PaymentResultPage from "@/pages/PaymentResultPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<WorkshopListPage />} />
      <Route path="/workshops/:id" element={<WorkshopDetailPage />} />
      <Route path="/leaderboard" element={<LeaderboardPage />} />
      <Route path="/my-registrations" element={<MyRegistrationsPage />} />
      <Route path="/notifications" element={<NotificationsPage />} />
      <Route path="/notifications/:notificationId" element={<NotificationsPage />} />
      {/* Payment return routes — không cần ProtectedRoute vì PayOS redirect về trực tiếp */}
      <Route path="/payment/result" element={<PaymentResultPage />} />
      <Route path="/payment/cancel" element={<PaymentResultPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
