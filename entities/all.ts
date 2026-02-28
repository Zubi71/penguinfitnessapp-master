// Legacy export file for backwards compatibility
// Import and re-export all entities
import { Client } from './Client';
import { Class } from './Class';
import { Trainer } from './Trainer';
import { Enrollment } from './Enrollment';
import { Attendance } from './Attendance';
import { Payment } from './Payment';
import { Invoice } from './Invoice';

export { Client, type ClientData } from './Client';
export { Class, type ClassData } from './Class';
export { Trainer, type TrainerData } from './Trainer';
export { Enrollment, type EnrollmentData } from './Enrollment';
export { Attendance, type AttendanceData } from './Attendance';
export { Payment, type PaymentData } from './Payment';
export { Invoice, type InvoiceData, type InvoiceLineItem } from './Invoice';

// Default exports for compatibility
export default {
  Client,
  Class,
  Trainer,
  Enrollment,
  Attendance,
  Payment,
  Invoice
};
