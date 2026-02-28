// Role-based access control configuration
export const ROLES = {
  ADMIN: 'admin',
  TRAINER: 'trainer', 
  CLIENT: 'client',
} as const

export type Role = typeof ROLES[keyof typeof ROLES];

// Permission definitions
export const PERMISSIONS = {
  // Client management
  VIEW_ALL_CLIENTS: 'view_all_clients',
  VIEW_OWN_CLIENT_DATA: 'view_own_client_data',
  CREATE_CLIENT: 'create_client',
  UPDATE_CLIENT: 'update_client',
  DELETE_CLIENT: 'delete_client',

  // Class management
  VIEW_ALL_CLASSES: 'view_all_classes',
  VIEW_ASSIGNED_CLASSES: 'view_assigned_classes',
  VIEW_ENROLLED_CLASSES: 'view_enrolled_classes',
  CREATE_CLASS: 'create_class',
  UPDATE_CLASS: 'update_class',
  DELETE_CLASS: 'delete_class',

  // Trainer management
  VIEW_ALL_TRAINERS: 'view_all_trainers',
  VIEW_OWN_TRAINER_DATA: 'view_own_trainer_data',
  CREATE_TRAINER: 'create_trainer',
  UPDATE_TRAINER: 'update_trainer',
  DELETE_TRAINER: 'delete_trainer',

  // Enrollment management
  VIEW_ALL_ENROLLMENTS: 'view_all_enrollments',
  VIEW_OWN_ENROLLMENTS: 'view_own_enrollments',
  CREATE_ENROLLMENT: 'create_enrollment',
  UPDATE_ENROLLMENT: 'update_enrollment',
  DELETE_ENROLLMENT: 'delete_enrollment',

  // Attendance management
  VIEW_ALL_ATTENDANCE: 'view_all_attendance',
  VIEW_OWN_ATTENDANCE: 'view_own_attendance',
  MARK_ATTENDANCE: 'mark_attendance',

  // Payment management
  VIEW_ALL_PAYMENTS: 'view_all_payments',
  VIEW_OWN_PAYMENTS: 'view_own_payments',
  CREATE_PAYMENT: 'create_payment',
  UPDATE_PAYMENT: 'update_payment',
  DELETE_PAYMENT: 'delete_payment',

  // Invoice management
  VIEW_ALL_INVOICES: 'view_all_invoices',
  VIEW_OWN_INVOICES: 'view_own_invoices',
  CREATE_INVOICE: 'create_invoice',
  UPDATE_INVOICE: 'update_invoice',
  DELETE_INVOICE: 'delete_invoice',

  // Reporting
  VIEW_REPORTS: 'view_reports',
  VIEW_ANALYTICS: 'view_analytics',
  EXPORT_DATA: 'export_data',

  // System management
  MANAGE_SETTINGS: 'manage_settings',
  MANAGE_USERS: 'manage_users',
  VIEW_SYSTEM_LOGS: 'view_system_logs',

  // Notifications
  SEND_NOTIFICATIONS: 'send_notifications',
  VIEW_ALL_NOTIFICATIONS: 'view_all_notifications',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Role-based permissions mapping
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [ROLES.ADMIN]: [
    // Full access to everything
    PERMISSIONS.VIEW_ALL_CLIENTS,
    PERMISSIONS.CREATE_CLIENT,
    PERMISSIONS.UPDATE_CLIENT,
    PERMISSIONS.DELETE_CLIENT,
    
    PERMISSIONS.VIEW_ALL_CLASSES,
    PERMISSIONS.CREATE_CLASS,
    PERMISSIONS.UPDATE_CLASS,
    PERMISSIONS.DELETE_CLASS,
    
    PERMISSIONS.VIEW_ALL_TRAINERS,
    PERMISSIONS.CREATE_TRAINER,
    PERMISSIONS.UPDATE_TRAINER,
    PERMISSIONS.DELETE_TRAINER,
    
    PERMISSIONS.VIEW_ALL_ENROLLMENTS,
    PERMISSIONS.CREATE_ENROLLMENT,
    PERMISSIONS.UPDATE_ENROLLMENT,
    PERMISSIONS.DELETE_ENROLLMENT,
    
    PERMISSIONS.VIEW_ALL_ATTENDANCE,
    PERMISSIONS.MARK_ATTENDANCE,
    
    PERMISSIONS.VIEW_ALL_PAYMENTS,
    PERMISSIONS.CREATE_PAYMENT,
    PERMISSIONS.UPDATE_PAYMENT,
    PERMISSIONS.DELETE_PAYMENT,
    
    PERMISSIONS.VIEW_ALL_INVOICES,
    PERMISSIONS.CREATE_INVOICE,
    PERMISSIONS.UPDATE_INVOICE,
    PERMISSIONS.DELETE_INVOICE,
    
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.EXPORT_DATA,
    
    PERMISSIONS.MANAGE_SETTINGS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_SYSTEM_LOGS,
    
    PERMISSIONS.SEND_NOTIFICATIONS,
    PERMISSIONS.VIEW_ALL_NOTIFICATIONS,
  ],

  [ROLES.TRAINER]: [
    // Limited access - can manage assigned classes and students
    PERMISSIONS.VIEW_ALL_CLIENTS, // Can see all clients for class management
    PERMISSIONS.UPDATE_CLIENT, // Can update client progress/notes
    
    PERMISSIONS.VIEW_ASSIGNED_CLASSES, // Only classes they teach
    PERMISSIONS.UPDATE_CLASS, // Can update class details
    
    PERMISSIONS.VIEW_OWN_TRAINER_DATA,
    PERMISSIONS.UPDATE_TRAINER, // Can update own profile
    
    PERMISSIONS.VIEW_ALL_ENROLLMENTS, // For their classes
    PERMISSIONS.CREATE_ENROLLMENT, // Can enroll students in their classes
    PERMISSIONS.UPDATE_ENROLLMENT,
    
    PERMISSIONS.VIEW_ALL_ATTENDANCE, // For their classes
    PERMISSIONS.MARK_ATTENDANCE,
    
    PERMISSIONS.VIEW_ALL_PAYMENTS, // Read-only for their classes
    
    PERMISSIONS.SEND_NOTIFICATIONS, // Can send notifications to their students
  ],

  [ROLES.CLIENT]: [
    // Very limited access - only own data
    PERMISSIONS.VIEW_OWN_CLIENT_DATA,
    
    PERMISSIONS.VIEW_ENROLLED_CLASSES, // Only classes they're enrolled in
    
    PERMISSIONS.VIEW_OWN_ENROLLMENTS,
    
    PERMISSIONS.VIEW_OWN_ATTENDANCE,
    
    PERMISSIONS.VIEW_OWN_PAYMENTS,
    
    PERMISSIONS.VIEW_OWN_INVOICES,
  ],
};

// Helper functions
export const hasRole = (userRole: string, requiredRole: Role): boolean => {
  return userRole === requiredRole;
};

export const hasPermission = (userRole: string, permission: Permission): boolean => {
  const rolePermissions = ROLE_PERMISSIONS[userRole as Role];
  return rolePermissions?.includes(permission) || false;
};

export const hasAnyPermission = (userRole: string, permissions: Permission[]): boolean => {
  return permissions.some(permission => hasPermission(userRole, permission));
};

export const isAdmin = (userRole: string): boolean => {
  return hasRole(userRole, ROLES.ADMIN);
};

export const isTrainer = (userRole: string): boolean => {
  return hasRole(userRole, ROLES.TRAINER);
}

// Legacy function name for backward compatibility
export const isInstructor = (userRole: string): boolean => {
  return hasRole(userRole, ROLES.TRAINER);
};

export const isClient = (userRole: string): boolean => {
  return hasRole(userRole, ROLES.CLIENT);
};

export const isStaff = (userRole: string): boolean => {
  return isAdmin(userRole) || isInstructor(userRole);
};

// Route access definitions
export const ROUTE_PERMISSIONS: Record<string, Permission[]> = {
  '/dashboard': [], // All authenticated users
  
  // Client management
  '/clients': [PERMISSIONS.VIEW_ALL_CLIENTS],
  '/clients/new': [PERMISSIONS.CREATE_CLIENT],
  '/clients/[id]': [PERMISSIONS.VIEW_ALL_CLIENTS, PERMISSIONS.VIEW_OWN_CLIENT_DATA],
  '/clients/[id]/edit': [PERMISSIONS.UPDATE_CLIENT],
  
  // Class management
  '/classes': [PERMISSIONS.VIEW_ALL_CLASSES, PERMISSIONS.VIEW_ASSIGNED_CLASSES, PERMISSIONS.VIEW_ENROLLED_CLASSES],
  '/classes/new': [PERMISSIONS.CREATE_CLASS],
  '/classes/[id]': [PERMISSIONS.VIEW_ALL_CLASSES, PERMISSIONS.VIEW_ASSIGNED_CLASSES, PERMISSIONS.VIEW_ENROLLED_CLASSES],
  '/classes/[id]/edit': [PERMISSIONS.UPDATE_CLASS],
  
  // Instructor management
  '/trainers': [PERMISSIONS.VIEW_ALL_TRAINERS],
  '/trainers/new': [PERMISSIONS.CREATE_TRAINER],
  '/trainers/[id]': [PERMISSIONS.VIEW_ALL_TRAINERS, PERMISSIONS.VIEW_OWN_TRAINER_DATA],
  '/trainers/[id]/edit': [PERMISSIONS.UPDATE_TRAINER],
  
  // Attendance
  '/attendance': [PERMISSIONS.VIEW_ALL_ATTENDANCE, PERMISSIONS.VIEW_OWN_ATTENDANCE],
  
  // Billing
  '/billing': [PERMISSIONS.VIEW_ALL_PAYMENTS, PERMISSIONS.VIEW_ALL_INVOICES, PERMISSIONS.VIEW_OWN_PAYMENTS, PERMISSIONS.VIEW_OWN_INVOICES],
  '/billing/invoices': [PERMISSIONS.VIEW_ALL_INVOICES, PERMISSIONS.VIEW_OWN_INVOICES],
  '/billing/payments': [PERMISSIONS.VIEW_ALL_PAYMENTS, PERMISSIONS.VIEW_OWN_PAYMENTS],
  
  // Calendar
  '/calendar': [PERMISSIONS.VIEW_ALL_CLASSES, PERMISSIONS.VIEW_ASSIGNED_CLASSES, PERMISSIONS.VIEW_ENROLLED_CLASSES],
  
  // Settings (admin only)
  '/settings': [PERMISSIONS.MANAGE_SETTINGS],
  
  // Account (all users can access their own account)
  '/account': [],
};

export const canAccessRoute = (userRole: string, route: string): boolean => {
  const requiredPermissions = ROUTE_PERMISSIONS[route];
  
  // If no permissions specified, allow all authenticated users
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true;
  }
  
  // Check if user has any of the required permissions
  return hasAnyPermission(userRole, requiredPermissions);
};
