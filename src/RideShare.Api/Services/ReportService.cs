using Microsoft.EntityFrameworkCore;
using RideShare.Api.Data;
using RideShare.Api.DTOs;
using RideShare.Core.Entities;

namespace RideShare.Api.Services;

public interface IReportService
{
    Task<ReportDto> CreateReportAsync(Guid reporterId, CreateReportRequest request);
    Task<IEnumerable<ReportDto>> GetMyReportsAsync(Guid userId);
    Task<IEnumerable<ReportDto>> GetAllReportsAsync(string? status);
    Task<ReportDto?> GetReportByIdAsync(Guid reportId);
    Task<ReportDto?> ResolveReportAsync(Guid reportId, Guid adminId, ResolveReportRequest request);
}

public class ReportService : IReportService
{
    private readonly RideShareDbContext _context;

    public ReportService(RideShareDbContext context)
    {
        _context = context;
    }

    public async Task<ReportDto> CreateReportAsync(Guid reporterId, CreateReportRequest request)
    {
        if (request.ReportedUserId == reporterId)
            throw new ArgumentException("You cannot report yourself.");

        var reportedUser = await _context.Users.FindAsync(request.ReportedUserId);
        if (reportedUser == null)
            throw new KeyNotFoundException("Reported user not found.");

        if (!Enum.TryParse<ReportReason>(request.Reason, out var reason))
            throw new ArgumentException("Invalid report reason.");

        if (request.RideId.HasValue)
        {
            var ride = await _context.Rides.FindAsync(request.RideId.Value);
            if (ride == null)
                throw new KeyNotFoundException("Ride not found.");
        }

        var report = new Report
        {
            Id = Guid.NewGuid(),
            ReporterId = reporterId,
            ReportedUserId = request.ReportedUserId,
            RideId = request.RideId,
            Reason = reason,
            Description = request.Description?.Trim(),
            Status = ReportStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        _context.Reports.Add(report);
        await _context.SaveChangesAsync();

        return await GetReportByIdAsync(report.Id) ?? throw new Exception("Failed to create report.");
    }

    public async Task<IEnumerable<ReportDto>> GetMyReportsAsync(Guid userId)
    {
        return await _context.Reports
            .Where(r => r.ReporterId == userId)
            .Include(r => r.Reporter)
            .Include(r => r.ReportedUser)
            .Include(r => r.Ride)
            .Include(r => r.ResolvedByAdmin)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => MapToDto(r))
            .ToListAsync();
    }

    public async Task<IEnumerable<ReportDto>> GetAllReportsAsync(string? status)
    {
        var query = _context.Reports
            .Include(r => r.Reporter)
            .Include(r => r.ReportedUser)
            .Include(r => r.Ride)
            .Include(r => r.ResolvedByAdmin)
            .AsQueryable();

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<ReportStatus>(status, out var reportStatus))
        {
            query = query.Where(r => r.Status == reportStatus);
        }

        return await query
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => MapToDto(r))
            .ToListAsync();
    }

    public async Task<ReportDto?> GetReportByIdAsync(Guid reportId)
    {
        var report = await _context.Reports
            .Include(r => r.Reporter)
            .Include(r => r.ReportedUser)
            .Include(r => r.Ride)
            .Include(r => r.ResolvedByAdmin)
            .FirstOrDefaultAsync(r => r.Id == reportId);

        return report == null ? null : MapToDto(report);
    }

    public async Task<ReportDto?> ResolveReportAsync(Guid reportId, Guid adminId, ResolveReportRequest request)
    {
        var report = await _context.Reports.FindAsync(reportId);
        if (report == null) return null;

        if (!Enum.TryParse<ReportStatus>(request.Status, out var newStatus)
            || (newStatus != ReportStatus.Resolved && newStatus != ReportStatus.Dismissed))
        {
            throw new ArgumentException("Status must be 'Resolved' or 'Dismissed'.");
        }

        report.Status = newStatus;
        report.AdminNotes = request.AdminNotes?.Trim();
        report.ResolvedByAdminId = adminId;
        report.ResolvedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return await GetReportByIdAsync(reportId);
    }

    private static ReportDto MapToDto(Report r) => new()
    {
        Id = r.Id,
        ReporterId = r.ReporterId,
        ReporterName = r.Reporter.FullName,
        ReporterEmail = r.Reporter.Email,
        ReportedUserId = r.ReportedUserId,
        ReportedUserName = r.ReportedUser.FullName,
        ReportedUserEmail = r.ReportedUser.Email,
        ReportedUserRole = r.ReportedUser.Role.ToString(),
        RideId = r.RideId,
        RideOrigin = r.Ride?.Origin,
        RideDestination = r.Ride?.Destination,
        Reason = r.Reason.ToString(),
        Description = r.Description,
        Status = r.Status.ToString(),
        AdminNotes = r.AdminNotes,
        ResolvedByAdminName = r.ResolvedByAdmin?.FullName,
        ResolvedAt = r.ResolvedAt,
        CreatedAt = r.CreatedAt
    };
}
