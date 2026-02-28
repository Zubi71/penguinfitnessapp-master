// Main entities
export { Client, type ClientData } from './Client'
export { Class, type ClassData } from './Class'
export { Trainer, type TrainerData } from './Trainer'
export { Enrollment, type EnrollmentData } from './Enrollment'
export { Attendance, type AttendanceData } from './Attendance'
export { Invoice, type InvoiceData, type InvoiceLineItem } from './Invoice'

// Legacy aliases (from Trainer for backward compatibility)
export { Instructor, type InstructorData } from './Trainer'

// Re-export specific items for compatibility
export * from './Client'
export * from './Class'
export * from './Enrollment'
export * from './Attendance'
export * from './Invoice'
