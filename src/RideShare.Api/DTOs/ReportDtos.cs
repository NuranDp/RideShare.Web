namespace RideShare.Api.DTOs;

public class CreateReportRequest
{
    public Guid ReportedUserId { get; set; }
    public Guid? RideId { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public class ResolveReportRequest
{
    public string Status { get; set; } = string.Empty; // "Resolved" or "Dismissed"
    public string? AdminNotes { get; set; }
}

public class ReportDto
{
    public Guid Id { get; set; }
    public Guid ReporterId { get; set; }
    public string ReporterName { get; set; } = string.Empty;
    public string ReporterEmail { get; set; } = string.Empty;
    public Guid ReportedUserId { get; set; }
    public string ReportedUserName { get; set; } = string.Empty;
    public string ReportedUserEmail { get; set; } = string.Empty;
    public string ReportedUserRole { get; set; } = string.Empty;
    public Guid? RideId { get; set; }
    public string? RideOrigin { get; set; }
    public string? RideDestination { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? AdminNotes { get; set; }
    public string? ResolvedByAdminName { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}
