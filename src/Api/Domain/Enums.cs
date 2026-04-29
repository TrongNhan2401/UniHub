namespace Domain
{
    public enum UserRole
    {
        Student = 0,
        Organizer = 1,
        CheckInStaff = 2
    }

    public enum WorkshopStatus
    {
        Draft = 0,
        Published = 1,
        Cancelled = 2,
        Completed = 3
    }

    public enum RegistrationStatus
    {
        Pending = 0,
        Confirmed = 1,
        Cancelled = 2,
        WaitListed = 3,
        PendingPayment = 4,
        PaymentFailed = 5
    }

    public enum PaymentStatus
    {
        Pending = 0,
        Completed = 1,
        Failed = 2,
        Refunded = 3,
        Timeout = 4
    }

    public enum AttendanceStatus
    {
        CheckedIn = 0,
        Absent = 1
    }

    public enum NotificationChannel
    {
        Email = 0,
        App = 1,
        Telegram = 2
    }

    public enum JobStatus
    {
        Pending = 0,
        Processing = 1,
        Completed = 2,
        Failed = 3
    }

}
