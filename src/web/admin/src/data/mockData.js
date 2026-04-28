// ─── Danh sách Workshop ────────────────────────────────────────────
export const workshops = [
  {
    id: 1,
    title: "Hệ thống Thiết kế UI Nâng cao",
    code: "DS-102",
    speaker: "TS. Helena Vance",
    dateLabel: "24 Tháng 10, 2026",
    shortTime: "09:00 SA",
    room: "Hội trường B",
    status: "Active",
  },
  {
    id: 2,
    title: "Đạo đức trong Khoa học Dữ liệu",
    code: "CS-405",
    speaker: "GS. Julian Marat",
    dateLabel: "26 Tháng 10, 2026",
    shortTime: "02:30 CH",
    room: "Phòng Lab 402",
    status: "Scheduled",
  },
  {
    id: 3,
    title: "Xu hướng Kiến trúc Hiện đại",
    code: "AR-201",
    speaker: "Sonia Rodriguez",
    dateLabel: "22 Tháng 10, 2026",
    shortTime: "11:00 SA",
    room: "Studio 1",
    status: "Completed",
  },
  {
    id: 4,
    title: "Workshop Viết lách Sáng tạo",
    code: "EN-332",
    speaker: "Liam Sterling",
    dateLabel: "02 Tháng 11, 2026",
    shortTime: "04:00 CH",
    room: "Phòng 12B",
    status: "Draft",
  },
];

// ─── Đăng ký gần đây ─────────────────────────────────────
export const recentRegistrations = [
  {
    id: 1,
    name: "Nguyễn Văn A",
    email: "vana@university.edu",
    initials: "VA",
    color: "bg-blue-200 text-blue-700",
    workshop: "Mẫu Thiết kế React Nâng cao",
    status: "CONFIRMED",
    date: "12 Tháng 10, 2026",
  },
  {
    id: 2,
    name: "Trần Thị B",
    email: "thib@college.edu",
    initials: "TB",
    color: "bg-orange-200 text-orange-700",
    workshop: "Kiến trúc Đám mây",
    status: "PENDING",
    date: "11 Tháng 10, 2026",
  },
  {
    id: 3,
    name: "Lê Văn C",
    email: "vanc@edu.com",
    initials: "VC",
    color: "bg-purple-200 text-purple-700",
    workshop: "An ninh mạng cơ bản",
    status: "CONFIRMED",
    date: "11 Tháng 10, 2026",
  },
];

// ─── Thời hạn sắp tới ───────────────────────────────────────
export const upcomingDeadlines = [
  {
    id: 1,
    title: "Workshop Đạo đức AI",
    sub: "Đóng đăng ký sau 4 giờ",
    tag: "KHẨN CẤP",
    tagColor: "bg-red-500 text-white",
    icon: "⏰",
  },
  {
    id: 2,
    title: "Khoa học Dữ liệu 101",
    sub: "Bắt đầu vào ngày mai, 10:00 SA",
    tag: null,
    icon: "📅",
  },
  {
    id: 3,
    title: "Xét duyệt Chứng chỉ",
    sub: "Hạn chót 24 Tháng 10",
    tag: null,
    icon: "📋",
  },
];

// ─── Hàng chờ tóm tắt AI ─────────────────────────────────────────
export const processingQueue = [
  {
    id: 1,
    name: "Lich_su_Kien_truc_Hien_dai_V2.pdf",
    size: "2.4 MB",
    progress: 75,
    state: "processing",
    label: "Đang xử lý tóm tắt AI",
  },
  {
    id: 2,
    name: "Nhap_mon_Mang_than_kinh.pdf",
    size: "1.1 MB",
    progress: 42,
    state: "processing",
    label: "Đang trích xuất khái niệm chính",
  },
  { id: 3, name: "On_tap_Kinh_te_Vi_mo.pdf", size: "842 KB", progress: 100, state: "done", label: "Tóm tắt đã sẵn sàng" },
];

export const recentSummaries = [
  { id: 1, title: "Ôn tập giữa kỳ Sinh học tế bào", time: "2 giờ trước", icon: "📄" },
  { id: 2, title: "Ghi chú Giải tích nâng cao", time: "Hôm qua", icon: "📘" },
];

// ─── Dữ liệu biểu đồ (sparkline đơn giản) ────────────────────────────
export const weeklyData = [
  { day: "T2", value: 30 },
  { day: "T3", value: 55 },
  { day: "T4", value: 40 },
  { day: "T5", value: 70 },
  { day: "T6", value: 50 },
  { day: "T7", value: 65 },
  { day: "CN", value: 45 },
];
