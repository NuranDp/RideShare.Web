using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RideShare.Api.DTOs;
using RideShare.Api.Services;

namespace RideShare.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly IReportService _reportService;

    public ReportsController(IReportService reportService)
    {
        _reportService = reportService;
    }

    /// <summary>
    /// Submit a report against another user
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateReport([FromBody] CreateReportRequest request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        try
        {
            var report = await _reportService.CreateReportAsync(userId.Value, request);
            return Ok(report);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Get my submitted reports
    /// </summary>
    [HttpGet("my-reports")]
    public async Task<IActionResult> GetMyReports()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var reports = await _reportService.GetMyReportsAsync(userId.Value);
        return Ok(reports);
    }

    /// <summary>
    /// Admin: Get all reports (optionally filter by status)
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAllReports([FromQuery] string? status)
    {
        var reports = await _reportService.GetAllReportsAsync(status);
        return Ok(reports);
    }

    /// <summary>
    /// Admin: Get a specific report by ID
    /// </summary>
    [HttpGet("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetReport(Guid id)
    {
        var report = await _reportService.GetReportByIdAsync(id);
        if (report == null)
            return NotFound(new { message = "Report not found" });

        return Ok(report);
    }

    /// <summary>
    /// Admin: Resolve or dismiss a report
    /// </summary>
    [HttpPut("{id}/resolve")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ResolveReport(Guid id, [FromBody] ResolveReportRequest request)
    {
        var adminId = GetUserId();
        if (adminId == null) return Unauthorized();

        try
        {
            var report = await _reportService.ResolveReportAsync(id, adminId.Value, request);
            if (report == null)
                return NotFound(new { message = "Report not found" });

            return Ok(report);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    private Guid? GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}
