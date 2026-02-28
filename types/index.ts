import { Dispatch, SVGProps } from "react";
import { z } from "zod";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

// SchedulerTypes.ts

// Define event type
export interface Event {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  variant?: Variant;
}

// Define the state interface for the scheduler
export interface SchedulerState {
  events: Event[];
}

// Define actions for reducer
export type Action =
  | { type: "ADD_EVENT"; payload: Event }
  | { type: "REMOVE_EVENT"; payload: { id: string } }
  | { type: "UPDATE_EVENT"; payload: Event }
  | { type: "SET_EVENTS"; payload: Event[] };


  

// Define handlers interface
export interface Handlers {
  handleEventStyling: (
    event: Event,
    dayEvents: Event[],
    periodOptions?: { 
      eventsInSamePeriod?: number; 
      periodIndex?: number; 
      adjustForPeriod?: boolean;
    }
  ) => {
    height: string;
    left: string;
    maxWidth: string;
    minWidth: string;
    top: string;
    zIndex: number;
  };
  handleAddEvent: (event: Event) => void;
  handleUpdateEvent: (event: Event, id: string) => void;
  handleDeleteEvent: (id: string) => void;
}

// Define getters interface
export interface Getters {
  getDaysInMonth: (
    month: number,
    year: number
  ) => { day: number; events: Event[] }[];
  getEventsForDay: (day: number, currentDate: Date) => Event[];
  getDaysInWeek: (week: number, year: number) => Date[];
  getWeekNumber: (date: Date) => number;
  getDayName: (day: number) => string;
}

// Define the context value interface
export interface SchedulerContextType {
  events: SchedulerState;
  dispatch: Dispatch<Action>;
  getters: Getters;
  handlers: Handlers;
  weekStartsOn: startOfWeek;
}

// Define the variant options
export const variants = [
  "success",
  "primary",
  "default",
  "warning",
  "danger",
] as const;

export type Variant = (typeof variants)[number];

// Define Zod schema for form validation
export const eventSchema = z.object({
  title: z.string().nonempty("Event name is required"),
  description: z.string().optional(),
  startDate: z.date(),
  endDate: z.date(),
  variant: z.enum(["primary", "danger", "success", "warning", "default"]),
  color: z.string().nonempty("Color selection is required"),
});

export type EventFormData = z.infer<typeof eventSchema>;

export type Views = {
  mobileViews?: string[];
  views?: string[];
};

export type startOfWeek = "sunday" | "monday";

export interface CustomEventModal {
  CustomAddEventModal?: {
    title?: string;
    CustomForm?: React.FC<{ register: any; errors: any }>;
  };
}

// Database Schema Types
export type AppRole = 'admin' | 'trainer' | 'client';

export interface ClientSignup {
  birthday: string;
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  birthday_month?: string;
  birthday_date?: number;
  birthday_year?: number;
  gender?: string;
  parent_first_name?: string;
  parent_last_name?: string;
  parent_relationship?: string;
  parent_email?: string;
  parent_phone?: string;
  same_as_email?: boolean;
  same_as_phone?: boolean;
  type_of_lesson: string;
  preferred_days: string[];
  preferred_start_time: string;
  location: string;
  medical_conditions?: string;
  medical_details?: string;
  additional_notes?: string;
  submitted_at?: string;
  status?: 'pending' | 'approved' | 'enrolled' | 'declined';
  trainer_id?: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at?: string;
}

export interface SwimClass {
  id: string;
  name: string;
  description?: string;
  trainer_id?: string;
  trainer?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  instructor_id?: string; // Deprecated - kept for backward compatibility
  instructor?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  date: string;
  start_time: string;
  end_time: string;
  duration: number;
  max_capacity: number;
  current_enrollment: number;
  class_type: 'group' | 'private' | 'semi-private';
  level: 'beginner' | 'intermediate' | 'advanced' | 'all';
  price: number;
  location: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  recurring: boolean;
  recurring_pattern?: string;
  recurring_end_date?: string;
  notes?: string;
  title?: string;
  membership_type?: string;
  lessons_per_package?: number;
  duration_minutes?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ClassEnrollment {
  id: string;
  client_id: string;
  class_id: string;
  enrollment_date: string;
  status: 'active' | 'completed' | 'cancelled' | 'suspended';
  start_date?: string;
  end_date?: string;
  payment_status: 'pending' | 'paid' | 'overdue';
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CustomComponents {
  customButtons?: {
    CustomAddEventButton?: React.ReactNode;
    CustomPrevButton?: React.ReactNode;
    CustomNextButton?: React.ReactNode;
  };

  customTabs?: {
    CustomDayTab?: React.ReactNode;
    CustomWeekTab?: React.ReactNode;
    CustomMonthTab?: React.ReactNode;
  };
  CustomEventComponent?: React.FC<Event>; // Using custom event type
  CustomEventModal?: CustomEventModal;
}

export interface ButtonClassNames {
  prev?: string;
  next?: string;
  addEvent?: string;
}

export interface TabClassNames {
  view?: string;
}

export interface TabsClassNames {
  cursor?: string;
  panel?: string;
  tab?: string;
  tabContent?: string;
  tabList?: string;
}

export interface ViewClassNames {
  dayView?: string;
  weekView?: string;
  monthView?: string;
}

export interface ClassNames {
  event?: string;
  buttons?: ButtonClassNames;
  tabs?: TabsClassNames;
  views?: ViewClassNames;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface InvoiceData {
  id: string;
  client_id: string;
  invoice_number?: string;
  amount: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  status: string;
  due_date: string;
  issue_date: string;
  paid_date?: string;
  description?: string;
  line_items: InvoiceLineItem[];
  notes?: string;
  created_by: string;
  created_at?: string;
  updated_at?: string;
  stripe_invoice_id?: string;
}
