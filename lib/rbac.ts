export type RoleKey =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "TEACHER"
  | "STUDENT"
  | "PARENT"
  | "ACCOUNTANT"
  | "LIBRARIAN"
  | "HOSTEL_WARDEN"
  | "NURSE"
  | "SECURITY";

export type NavItem = {
  label: string;
  href: string;
  icon: string;
};

export const ROLE_LABELS: Record<RoleKey, string> = {
  SUPER_ADMIN: "Super Administrator",
  ADMIN: "School Administrator",
  TEACHER: "Teacher",
  STUDENT: "Student",
  PARENT: "Parent",
  ACCOUNTANT: "Accountant",
  LIBRARIAN: "Librarian",
  HOSTEL_WARDEN: "Hostel Warden",
  NURSE: "Nurse",
  SECURITY: "Security",
};

// Every module and which roles may view it.
const ALL_NAV: (NavItem & { roles: RoleKey[] })[] = [
  { label: "Dashboard", href: "/dashboard", icon: "layout-dashboard", roles: ["SUPER_ADMIN","ADMIN","TEACHER","STUDENT","PARENT","ACCOUNTANT","LIBRARIAN","HOSTEL_WARDEN","NURSE","SECURITY"] },
  { label: "Students", href: "/students", icon: "users", roles: ["SUPER_ADMIN","ADMIN","TEACHER","ACCOUNTANT","NURSE"] },
  { label: "Teachers", href: "/teachers", icon: "user-check", roles: ["SUPER_ADMIN","ADMIN"] },
  { label: "Parents", href: "/parents", icon: "users-round", roles: ["SUPER_ADMIN","ADMIN"] },
  { label: "Classes & Streams", href: "/classes", icon: "school", roles: ["SUPER_ADMIN","ADMIN"] },
  { label: "Subjects", href: "/subjects", icon: "book-open", roles: ["SUPER_ADMIN","ADMIN"] },
  { label: "Attendance", href: "/attendance", icon: "calendar-check", roles: ["SUPER_ADMIN","ADMIN","TEACHER","STUDENT","PARENT"] },
  { label: "Examinations", href: "/exams", icon: "file-text", roles: ["SUPER_ADMIN","ADMIN","TEACHER"] },
  { label: "Report Cards", href: "/report-cards", icon: "graduation-cap", roles: ["SUPER_ADMIN","ADMIN","TEACHER","STUDENT","PARENT"] },
  { label: "Fees", href: "/fees", icon: "banknote", roles: ["SUPER_ADMIN","ADMIN","ACCOUNTANT","STUDENT","PARENT"] },
  { label: "Payroll", href: "/payroll", icon: "wallet", roles: ["SUPER_ADMIN","ADMIN","ACCOUNTANT","TEACHER"] },
  { label: "Library", href: "/library", icon: "library", roles: ["SUPER_ADMIN","ADMIN","LIBRARIAN","TEACHER","STUDENT"] },
  { label: "Hostel", href: "/hostel", icon: "building-2", roles: ["SUPER_ADMIN","ADMIN","HOSTEL_WARDEN","NURSE"] },
  { label: "Transport", href: "/transport", icon: "bus", roles: ["SUPER_ADMIN","ADMIN"] },
  { label: "Inventory", href: "/inventory", icon: "boxes", roles: ["SUPER_ADMIN","ADMIN"] },
  { label: "Discipline", href: "/discipline", icon: "shield-alert", roles: ["SUPER_ADMIN","ADMIN","TEACHER"] },
  { label: "Assignments", href: "/assignments", icon: "clipboard-list", roles: ["SUPER_ADMIN","ADMIN","TEACHER","STUDENT"] },
  { label: "Learning Resources", href: "/learning-resources", icon: "book-marked", roles: ["SUPER_ADMIN","ADMIN","TEACHER","STUDENT"] },
  { label: "Events", href: "/events", icon: "calendar-days", roles: ["SUPER_ADMIN","ADMIN","TEACHER","STUDENT","PARENT"] },
  { label: "Certificates", href: "/certificates", icon: "award", roles: ["SUPER_ADMIN","ADMIN"] },
  { label: "Announcements", href: "/announcements", icon: "megaphone", roles: ["SUPER_ADMIN","ADMIN","TEACHER","STUDENT","PARENT","ACCOUNTANT","LIBRARIAN","HOSTEL_WARDEN","NURSE","SECURITY"] },
  { label: "Notifications", href: "/notifications", icon: "bell", roles: ["SUPER_ADMIN","ADMIN","TEACHER","STUDENT","PARENT","ACCOUNTANT","LIBRARIAN","HOSTEL_WARDEN","NURSE","SECURITY"] },
  { label: "Users & Roles", href: "/users", icon: "shield", roles: ["SUPER_ADMIN"] },
  { label: "Subscription", href: "/subscription", icon: "wallet", roles: ["SUPER_ADMIN", "ADMIN"] },
  { label: "Reports", href: "/reports", icon: "bar-chart-3", roles: ["SUPER_ADMIN","ADMIN"] },
  { label: "Settings", href: "/settings", icon: "settings", roles: ["SUPER_ADMIN","ADMIN"] },
  { label: "My Profile", href: "/profile", icon: "user", roles: ["SUPER_ADMIN","ADMIN","TEACHER","STUDENT","PARENT","ACCOUNTANT","LIBRARIAN","HOSTEL_WARDEN","NURSE","SECURITY"] },
];

export function navForRole(role: string): NavItem[] {
  return ALL_NAV.filter((n) => n.roles.includes(role as RoleKey)).map(({ roles, ...rest }) => rest);
}

export function can(role: string, roles: RoleKey[]) {
  return roles.includes(role as RoleKey);
}
