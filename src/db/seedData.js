export const INITIAL_USERS = [
  {
    id: "usr_admin",
    employeeId: "EMP-1001",
    name: "Eleanor Vance (HR Admin)",
    email: "admin@dayflow.com",
    password: "Password@123",
    role: "ADMIN",
    department: "Human Resources",
    designation: "Head of HR & Operations",
    phone: "+1 (555) 019-2831",
    address: "742 Evergreen Terrace, Springfield, OR",
    dob: "1988-04-12",
    dateOfJoining: "2020-01-15",
    emergencyContact: "+1 (555) 998-1122",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "usr_emp1",
    employeeId: "EMP-1002",
    name: "Sarah Connor",
    email: "sarah@dayflow.com",
    password: "Password@123",
    role: "EMPLOYEE",
    department: "Engineering",
    designation: "Senior Frontend Engineer",
    phone: "+1 (555) 234-5678",
    address: "101 Cyberdyne Way, Los Angeles, CA",
    dob: "1993-09-18",
    dateOfJoining: "2022-03-01",
    emergencyContact: "+1 (555) 887-3344",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "usr_emp2",
    employeeId: "EMP-1003",
    name: "Alex Rivera",
    email: "alex@dayflow.com",
    password: "Password@123",
    role: "EMPLOYEE",
    department: "Product Management",
    designation: "Product Lead",
    phone: "+1 (555) 345-6789",
    address: "456 Market St, San Francisco, CA",
    dob: "1991-11-05",
    dateOfJoining: "2021-08-15",
    emergencyContact: "+1 (555) 776-5544",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "usr_emp3",
    employeeId: "EMP-1004",
    name: "Priya Sharma",
    email: "priya@dayflow.com",
    password: "Password@123",
    role: "EMPLOYEE",
    department: "Design & UX",
    designation: "UI/UX Designer",
    phone: "+1 (555) 456-7890",
    address: "89 Orchard Rd, Austin, TX",
    dob: "1995-02-24",
    dateOfJoining: "2023-06-10",
    emergencyContact: "+1 (555) 665-4433",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "usr_emp4",
    employeeId: "EMP-1005",
    name: "Marcus Chen",
    email: "marcus@dayflow.com",
    password: "Password@123",
    role: "EMPLOYEE",
    department: "Finance & Accounting",
    designation: "Financial Analyst",
    phone: "+1 (555) 567-8921",
    address: "220 Lakeview Ave, Seattle, WA",
    dob: "1990-07-16",
    dateOfJoining: "2024-01-08",
    emergencyContact: "+1 (555) 440-2819",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "usr_emp5",
    employeeId: "EMP-1006",
    name: "Nadia Brooks",
    email: "nadia@dayflow.com",
    password: "Password@123",
    role: "EMPLOYEE",
    department: "Engineering",
    designation: "Backend Engineer",
    phone: "+1 (555) 678-1450",
    address: "18 Willow Street, Denver, CO",
    dob: "1994-12-03",
    dateOfJoining: "2024-04-22",
    emergencyContact: "+1 (555) 391-7642",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80"
  }
];

export const INITIAL_ATTENDANCE = [
  {
    id: "att_1",
    userId: "usr_emp1",
    date: "2026-08-21",
    checkIn: "09:02 AM",
    checkOut: "05:45 PM",
    workHours: "8h 43m",
    status: "PRESENT",
    notes: "Completed daily tasks and sprint review."
  },
  {
    id: "att_2",
    userId: "usr_emp1",
    date: "2026-08-20",
    checkIn: "09:15 AM",
    checkOut: "05:30 PM",
    workHours: "8h 15m",
    status: "PRESENT",
    notes: "Regular work day."
  },
  {
    id: "att_3",
    userId: "usr_emp1",
    date: "2026-08-19",
    checkIn: "09:00 AM",
    checkOut: "01:15 PM",
    workHours: "4h 15m",
    status: "HALF_DAY",
    notes: "Personal appointment in afternoon."
  },
  {
    id: "att_4",
    userId: "usr_emp2",
    date: "2026-08-21",
    checkIn: "08:55 AM",
    checkOut: "06:10 PM",
    workHours: "9h 15m",
    status: "PRESENT",
    notes: "Client roadmap presentation."
  },
  {
    id: "att_5",
    userId: "usr_emp3",
    date: "2026-08-21",
    checkIn: "09:30 AM",
    checkOut: "05:30 PM",
    workHours: "8h 00m",
    status: "PRESENT",
    notes: "Figma design system sync."
  }
];

export const INITIAL_LEAVE_REQUESTS = [
  {
    id: "lv_101",
    userId: "usr_emp1",
    leaveType: "Paid Leave",
    startDate: "2026-08-28",
    endDate: "2026-08-30",
    daysCount: 3,
    reason: "Family vacation and short break.",
    status: "PENDING",
    adminComment: "",
    createdAt: "2026-08-20T10:30:00Z"
  },
  {
    id: "lv_102",
    userId: "usr_emp2",
    leaveType: "Sick Leave",
    startDate: "2026-08-14",
    endDate: "2026-08-14",
    daysCount: 1,
    reason: "Doctor appointment & recovery.",
    status: "APPROVED",
    adminComment: "Approved. Take rest and recover well!",
    createdAt: "2026-08-13T14:20:00Z"
  },
  {
    id: "lv_103",
    userId: "usr_emp3",
    leaveType: "Unpaid Leave",
    startDate: "2026-09-05",
    endDate: "2026-09-07",
    daysCount: 3,
    reason: "Attending design conference out of state.",
    status: "PENDING",
    adminComment: "",
    createdAt: "2026-08-21T09:15:00Z"
  }
];

export const INITIAL_PAYROLL = [
  {
    id: "pay_usr_emp1",
    userId: "usr_emp1",
    basicSalary: 6500,
    hra: 2600,
    specialAllowance: 1400,
    pfDeduction: 780,
    taxDeduction: 650,
    grossSalary: 10500,
    netSalary: 9070,
    payPeriod: "August 2026",
    paymentStatus: "PAID"
  },
  {
    id: "pay_usr_emp2",
    userId: "usr_emp2",
    basicSalary: 7500,
    hra: 3000,
    specialAllowance: 2000,
    pfDeduction: 900,
    taxDeduction: 950,
    grossSalary: 12500,
    netSalary: 10650,
    payPeriod: "August 2026",
    paymentStatus: "PAID"
  },
  {
    id: "pay_usr_emp3",
    userId: "usr_emp3",
    basicSalary: 5500,
    hra: 2200,
    specialAllowance: 1100,
    pfDeduction: 660,
    taxDeduction: 500,
    grossSalary: 8800,
    netSalary: 7640,
    payPeriod: "August 2026",
    paymentStatus: "PAID"
  },
  {
    id: "pay_usr_admin",
    userId: "usr_admin",
    basicSalary: 8500,
    hra: 3400,
    specialAllowance: 2500,
    pfDeduction: 1020,
    taxDeduction: 1200,
    grossSalary: 14400,
    netSalary: 12180,
    payPeriod: "August 2026",
    paymentStatus: "PAID"
  },
  {
    id: "pay_usr_emp4",
    userId: "usr_emp4",
    basicSalary: 6200,
    hra: 2480,
    specialAllowance: 1320,
    pfDeduction: 744,
    taxDeduction: 600,
    grossSalary: 10000,
    netSalary: 8656,
    payPeriod: "August 2026",
    paymentStatus: "PAID"
  },
  {
    id: "pay_usr_emp5",
    userId: "usr_emp5",
    basicSalary: 6800,
    hra: 2720,
    specialAllowance: 1480,
    pfDeduction: 816,
    taxDeduction: 720,
    grossSalary: 11000,
    netSalary: 9464,
    payPeriod: "August 2026",
    paymentStatus: "PAID"
  }
];

export const INITIAL_DOCUMENTS = [
  {
    id: "doc_1",
    userId: "usr_emp1",
    title: "Government ID Card / Passport",
    category: "Identity Proof",
    fileName: "sarah_connor_passport.pdf",
    fileSize: "2.4 MB",
    uploadedAt: "2022-03-01"
  },
  {
    id: "doc_2",
    userId: "usr_emp1",
    title: "Signed Employment Contract",
    category: "Contract",
    fileName: "employment_offer_letter_2022.pdf",
    fileSize: "1.1 MB",
    uploadedAt: "2022-03-01"
  },
  {
    id: "doc_3",
    userId: "usr_emp1",
    title: "Degree Certificate (B.S. Computer Science)",
    category: "Education",
    fileName: "degree_certificate.pdf",
    fileSize: "3.8 MB",
    uploadedAt: "2022-03-02"
  }
];

export const INITIAL_NOTIFICATIONS = [
  {
    id: "notif_1",
    userId: "usr_emp1",
    title: "Leave Request Submitted",
    message: "Your Paid Leave request for Aug 28 - Aug 30 has been received and is pending HR review.",
    timestamp: "2026-08-20T10:30:00Z",
    read: false,
    type: "info"
  },
  {
    id: "notif_2",
    userId: "usr_admin",
    title: "New Leave Application",
    message: "Sarah Connor has submitted a new leave application (3 Days).",
    timestamp: "2026-08-20T10:30:00Z",
    read: false,
    type: "action"
  }
];
