"use client"
import { FaCalendarAlt, FaUsers, FaCog, FaHome, FaClipboardCheck, FaDollarSign, FaDumbbell, FaChalkboardTeacher, FaSignOutAlt, FaFileInvoice, FaSubscript, FaCalendarPlus, FaShareAlt, FaChartLine } from "react-icons/fa";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { usePermissions } from "@/components/auth/RoleGuard";
import Image from "next/image";

interface NavItem {
  href: string;
  icon: any;
  label: string;
  roles: ('admin' | 'trainer' | 'client')[];
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin, isTrainer, isClient, isStaff } = usePermissions();

  const navItems: NavItem[] = [
    { href: "/dashboard", icon: FaHome, label: "Dashboard", roles: ['admin', 'trainer'] },
    { href: "/trainer", icon: FaChalkboardTeacher, label: "Trainer", roles: ['trainer'] }, // Trainer-specific page
    // { href: "/dashboard/calendar", icon: FaCalendarAlt, label: "Calendar", roles: ['admin', 'trainer'] },
    { href: "/dashboard/classes", icon: FaDumbbell, label: "Classes", roles: ['admin', 'trainer'] },
    // { href: "/dashboard/trainers", icon: FaChalkboardTeacher, label: "Trainers", roles: ['admin', 'trainer'] },
    { href: "/dashboard/clients", icon: FaUsers, label: "Clients", roles: ['admin', 'trainer'] },
    { href: "/dashboard/attendance", icon: FaClipboardCheck, label: "Attendance", roles: ['admin', 'trainer'] },
    { href: "/dashboard/community-events", icon: FaCalendarPlus, label: "Community Events", roles: ['admin', 'trainer'] },
    { href: "/dashboard/insights", icon: FaChartLine, label: "Insights", roles: ['admin', 'trainer'] }, // Insights dashboard
    { href: "/dashboard/impact-feedback", icon: FaChartLine, label: "Impact & Feedback", roles: ['admin'] }, // Phase 21: Impact & Feedback
    { href: "/dashboard/trainer-performance", icon: FaChalkboardTeacher, label: "Trainer Performance", roles: ['admin', 'trainer'] }, // Phase 21: Trainer Performance
    { href: "/trainer/availability", icon: FaCalendarAlt, label: "My Availability", roles: ['trainer'] }, // Trainer availability
    { href: "/dashboard/trainer-availability", icon: FaCalendarAlt, label: "Trainer Availability", roles: ['admin'] }, // Admin view of trainer availability
    { href: "/dashboard/referrals", icon: FaShareAlt, label: "Referrals", roles: ['admin'] }, // Referral system
    { href: "/dashboard/subscriptions", icon: FaSubscript, label: "Subscriptions", roles: ['admin'] }, // Admin only
    { href: "/dashboard/invoices", icon: FaFileInvoice, label: "Invoices", roles: ['admin'] }, // Admin only
    { href: "/dashboard/billing", icon: FaDollarSign, label: "Billing", roles: ['admin'] }, // Admin only
    { href: "/dashboard/settings", icon: FaCog, label: "Settings", roles: ['admin', 'trainer'] },
  ];

  // Filter nav items based on user role
  const filteredNavItems = navItems.filter(item => {
    if (!user) return false;
    return item.roles.includes(user.role);
  });

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (!user) {
    return null; // Don't show navbar if not authenticated
  }

  return (
    <nav className="h-screen w-16 md:w-20 bg-white border-r flex flex-col items-center shadow-sm transition-all duration-200 overflow-hidden">
      {/* Logo Section - Fixed at top */}
      <div className="flex-shrink-0 pt-4 pb-2">
        <Link href="/dashboard" className="flex items-center justify-center">
          <Image 
            src="/logo.png" 
            alt="Penguin Fitness Logo" 
            width={40} 
            height={40} 
            className="rounded-full"
          />
        </Link>
      </div>
      
      {/* Role Badge - Fixed below logo */}
      <div className="flex-shrink-0 mb-2 text-center px-2">
        <div className="text-xs text-gray-500 capitalize font-medium">
          {user.role}
        </div>
      </div>

      {/* Scrollable Navigation Items */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden w-full px-2 py-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        <ul className="flex flex-col gap-2">
          {filteredNavItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/');
            return (
              <li key={href} className="w-full">
                <Link 
                  href={href}
                  className={`w-full p-2.5 rounded-lg transition-all duration-200 flex items-center justify-center group relative ${
                    isActive 
                      ? 'text-blue-600 bg-blue-50 shadow-sm' 
                      : 'text-gray-500 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                  title={label}
                >
                  <Icon size={18} className="flex-shrink-0" />
                  <span className="absolute left-full ml-3 px-2 py-1.5 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-50 shadow-lg">
                    {label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      
      {/* Logout button - Fixed at bottom */}
      <div className="flex-shrink-0 pb-4 pt-2 w-full px-2">
        <button
          onClick={handleLogout}
          className="w-full p-2.5 rounded-lg transition-all duration-200 flex items-center justify-center group relative text-gray-500 hover:text-red-600 hover:bg-red-50"
          title="Logout"
        >
          <FaSignOutAlt size={18} className="flex-shrink-0" />
          <span className="absolute left-full ml-3 px-2 py-1.5 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-50 shadow-lg">
            Logout
          </span>
        </button>
      </div>
    </nav>
  );
}
