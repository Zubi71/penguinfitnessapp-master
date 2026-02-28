"use client";
import React from "react";
import Navbar from "@/components/Navbar";
import AuthGuard from "@/components/auth/AuthGuard";
import { AuthProvider } from "@/hooks/auth/useAuth";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-4 sm:p-6">{children}</div>
        </main>
      </div>
    </AuthProvider>
  );
}
