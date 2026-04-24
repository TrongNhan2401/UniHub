// ─── Workshop list ────────────────────────────────────────────
export const workshops = [
  {
    id: 1,
    title: "Advanced UI Design Systems",
    code: "DS-102",
    speaker: "Dr. Helena Vance",
    dateLabel: "Oct 24, 2023",
    shortTime: "09:00 AM",
    room: "Auditorium B",
    status: "Active",
  },
  {
    id: 2,
    title: "Data Science Ethics",
    code: "CS-405",
    speaker: "Prof. Julian Marat",
    dateLabel: "Oct 26, 2023",
    shortTime: "02:30 PM",
    room: "Lab 402",
    status: "Scheduled",
  },
  {
    id: 3,
    title: "Modern Architecture Trends",
    code: "AR-201",
    speaker: "Sonia Rodriguez",
    dateLabel: "Oct 22, 2023",
    shortTime: "11:00 AM",
    room: "Studio 1",
    status: "Completed",
  },
  {
    id: 4,
    title: "Creative Writing Workshop",
    code: "EN-332",
    speaker: "Liam Sterling",
    dateLabel: "Nov 02, 2023",
    shortTime: "04:00 PM",
    room: "Room 12B",
    status: "Draft",
  },
];

// ─── Recent registrations ─────────────────────────────────────
export const recentRegistrations = [
  {
    id: 1,
    name: "Jane Doe",
    email: "j.doe@university.edu",
    initials: "JD",
    color: "bg-blue-200 text-blue-700",
    workshop: "Advanced React Patterns",
    status: "CONFIRMED",
    date: "Oct 12, 2023",
  },
  {
    id: 2,
    name: "Mark Smith",
    email: "mark.s@college.edu",
    initials: "MS",
    color: "bg-orange-200 text-orange-700",
    workshop: "Cloud Architecture",
    status: "PENDING",
    date: "Oct 11, 2023",
  },
  {
    id: 3,
    name: "Emma Lou",
    email: "emma.a@edu.com",
    initials: "EL",
    color: "bg-purple-200 text-purple-700",
    workshop: "Cybersecurity 101",
    status: "CONFIRMED",
    date: "Oct 11, 2023",
  },
];

// ─── Upcoming deadlines ───────────────────────────────────────
export const upcomingDeadlines = [
  {
    id: 1,
    title: "AI Ethics Workshop",
    sub: "Registration closes in 4h",
    tag: "URGENT",
    tagColor: "bg-red-500 text-white",
    icon: "⏰",
  },
  {
    id: 2,
    title: "Data Science 101",
    sub: "Starting Tomorrow, 10:00 AM",
    tag: null,
    icon: "📅",
  },
  {
    id: 3,
    title: "Certification Review",
    sub: "Due Oct 24th",
    tag: null,
    icon: "📋",
  },
];

// ─── AI Summary queue ─────────────────────────────────────────
export const processingQueue = [
  {
    id: 1,
    name: "Modern_Architecture_History_V2.pdf",
    size: "2.4 MB",
    progress: 75,
    state: "processing",
    label: "Processing AI Summary",
  },
  {
    id: 2,
    name: "Neural_Networks_Intro.pdf",
    size: "1.1 MB",
    progress: 42,
    state: "processing",
    label: "Extracting Key Concepts",
  },
  { id: 3, name: "Macroeconomics_Exam_Prep.pdf", size: "842 KB", progress: 100, state: "done", label: "Summary Ready" },
];

export const recentSummaries = [
  { id: 1, title: "Cell Biology Midterm Prep", time: "2 hours ago", icon: "📄" },
  { id: 2, title: "Advanced Calculus Notes", time: "Yesterday", icon: "📘" },
];

// ─── Chart data (simple sparkline) ────────────────────────────
export const weeklyData = [
  { day: "MON", value: 30 },
  { day: "TUE", value: 55 },
  { day: "WED", value: 40 },
  { day: "THU", value: 70 },
  { day: "FRI", value: 50 },
  { day: "SAT", value: 65 },
  { day: "SUN", value: 45 },
];
