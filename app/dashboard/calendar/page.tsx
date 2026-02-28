"use client";

import CalendarPage from "@/components/schedule/CalendarPage";
import ModalProvider from "@/providers/modal-context";
import { RoleGuard } from "@/components/auth/RoleGuard";

export default function ClassCalendar() {
  return (
    <RoleGuard requireRole="staff" showLoading={true}>
      <ModalProvider>
        <CalendarPage />
      </ModalProvider>
    </RoleGuard>
  );
}