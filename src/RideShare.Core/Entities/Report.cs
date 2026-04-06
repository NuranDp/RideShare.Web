namespace RideShare.Core.Entities;

public class Report
{
    public Guid Id { get; set; }
    public Guid ReporterId { get; set; }
    public Guid ReportedUserId { get; set; }
    public Guid? RideId { get; set; }

    public ReportReason Reason { get; set; }
    public string? Description { get; set; }
    public ReportStatus Status { get; set; } = ReportStatus.Pending;
    public string? AdminNotes { get; set; }
    public Guid? ResolvedByAdminId { get; set; }
    public DateTime? ResolvedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public User Reporter { get; set; } = null!;
    public User ReportedUser { get; set; } = null!;
    public Ride? Ride { get; set; }
    public User? ResolvedByAdmin { get; set; }
}

public enum ReportReason
{
    SafetyConcern,
    Harassment,
    NoShow,
    RecklessDriving,
    FakeProfile,
    InappropriateBehavior,
    Other
}

public enum ReportStatus
{
    Pending,
    Reviewing,
    Resolved,
    Dismissed
}
