"use client";
import React from "react";
import AuthGuard from "@/components/auth/AuthGuard";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requireRole="client" fallbackRoute="/dashboard">
      <div className="min-h-screen bg-gray-50">
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
