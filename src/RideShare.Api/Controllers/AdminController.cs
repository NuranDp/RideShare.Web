using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RideShare.Api.Data;
using RideShare.Api.DTOs;
using RideShare.Api.Services;
using RideShare.Core.Entities;

namespace RideShare.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly RideShareDbContext _context;
    private readonly IRiderService _riderService;
    private readonly IPricingService _pricingService;

    public AdminController(RideShareDbContext context, IRiderService riderService, IPricingService pricingService)
    {
        _context = context;
        _riderService = riderService;
        _pricingService = pricingService;
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetAllUsers([FromQuery] string? role, [FromQuery] bool? isActive)
    {
        var query = _context.Users.AsQueryable();

        if (!string.IsNullOrEmpty(role) && Enum.TryParse<UserRole>(role, out var userRole))
        {
            query = query.Where(u => u.Role == userRole);
        }

        if (isActive.HasValue)
        {
            query = query.Where(u => u.IsActive == isActive.Value);
        }

        var users = await query
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new
            {
                u.Id,
                u.Email,
                u.FullName,
                u.Phone,
                Role = u.Role.ToString(),
                u.IsActive,
                u.CreatedAt
            })
            .ToListAsync();

        return Ok(users);
    }

    [HttpPut("users/{userId}/activate")]
    public async Task<IActionResult> ActivateUser(Guid userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return NotFound(new { message = "User not found" });
        }

        user.IsActive = true;
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new { message = "User activated successfully" });
    }

    [HttpPut("users/{userId}/deactivate")]
    public async Task<IActionResult> DeactivateUser(Guid userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return NotFound(new { message = "User not found" });
        }

        // Prevent deactivating self
        var currentUserId = GetUserId();
        if (currentUserId == userId)
        {
            return BadRequest(new { message = "Cannot deactivate your own account" });
        }

        user.IsActive = false;
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new { message = "User deactivated successfully" });
    }

    [HttpGet("license-requests")]
    public async Task<IActionResult> GetPendingLicenseRequests()
    {
        var requests = await _riderService.GetPendingLicenseRequestsAsync();
        return Ok(requests);
    }

    [HttpPut("license/{riderProfileId}/approve")]
    public async Task<IActionResult> ApproveLicense(Guid riderProfileId)
    {
        var adminId = GetUserId();
        if (adminId == null) return Unauthorized();

        var result = await _riderService.ApproveLicenseAsync(riderProfileId, adminId.Value);
        if (!result)
        {
            return NotFound(new { message = "Rider profile not found" });
        }

        return Ok(new { message = "License approved successfully" });
    }

    [HttpPut("license/{riderProfileId}/reject")]
    public async Task<IActionResult> RejectLicense(Guid riderProfileId)
    {
        var result = await _riderService.RejectLicenseAsync(riderProfileId);
        if (!result)
        {
            return NotFound(new { message = "Rider profile not found" });
        }

        return Ok(new { message = "License rejected" });
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var totalUsers = await _context.Users.CountAsync();
        var totalRiders = await _context.Users.CountAsync(u => u.Role == UserRole.Rider);
        var totalPassengers = await _context.Users.CountAsync(u => u.Role == UserRole.Passenger);
        var verifiedRiders = await _context.RiderProfiles.CountAsync(rp => rp.IsLicenseVerified);
        var pendingVerifications = await _context.RiderProfiles
            .CountAsync(rp => rp.LicenseNumber != null && !rp.IsLicenseVerified);
        var totalRides = await _context.Rides.CountAsync();
        var activeRides = await _context.Rides.CountAsync(r => r.Status == RideStatus.Active);
        var completedRides = await _context.Rides.CountAsync(r => r.Status == RideStatus.Completed);

        return Ok(new
        {
            totalUsers,
            totalRiders,
            totalPassengers,
            verifiedRiders,
            pendingVerifications,
            totalRides,
            activeRides,
            completedRides
        });
    }

    // =====================
    // Pricing Settings
    // =====================

    [HttpGet("pricing")]
    public async Task<IActionResult> GetPricingSettings()
    {
        var settings = await _pricingService.GetPricingSettingsAsync();
        return Ok(settings);
    }

    [HttpPut("pricing")]
    public async Task<IActionResult> UpdatePricingSettings([FromBody] UpdatePricingSettingsRequest request)
    {
        var adminId = GetUserId();
        if (adminId == null) return Unauthorized();

        try
        {
            var settings = await _pricingService.UpdatePricingSettingsAsync(adminId.Value, request);
            return Ok(settings);
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
