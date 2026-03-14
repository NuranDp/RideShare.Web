using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RideShare.Api.DTOs;
using RideShare.Api.Services;

namespace RideShare.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RiderController : ControllerBase
{
    private readonly IRiderService _riderService;

    public RiderController(IRiderService riderService)
    {
        _riderService = riderService;
    }

    [HttpGet("profile")]
    public async Task<IActionResult> GetMyProfile()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var profile = await _riderService.GetMyProfileAsync(userId.Value);
        if (profile == null)
        {
            return NotFound(new { message = "Rider profile not found. Are you registered as a rider?" });
        }

        return Ok(profile);
    }

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateRiderProfileRequest request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var profile = await _riderService.UpdateProfileAsync(userId.Value, request);
        if (profile == null)
        {
            return NotFound(new { message = "Rider profile not found" });
        }

        return Ok(profile);
    }

    [HttpPost("license")]
    public async Task<IActionResult> SubmitLicense([FromBody] SubmitLicenseRequest request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        if (string.IsNullOrEmpty(request.LicenseNumber))
        {
            return BadRequest(new { message = "License number is required" });
        }

        if (string.IsNullOrEmpty(request.LicenseImageUrl))
        {
            return BadRequest(new { message = "License image is required" });
        }

        if (request.LicenseExpiryDate < DateTime.UtcNow)
        {
            return BadRequest(new { message = "License has already expired" });
        }

        var profile = await _riderService.SubmitLicenseAsync(userId.Value, request);
        if (profile == null)
        {
            return NotFound(new { message = "Rider profile not found" });
        }

        return Ok(new { message = "License submitted for verification", profile });
    }

    [HttpGet("{riderId}/public")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPublicProfile(Guid riderId)
    {
        var profile = await _riderService.GetPublicProfileAsync(riderId);
        if (profile == null)
        {
            return NotFound(new { message = "Rider not found" });
        }

        return Ok(profile);
    }

    private Guid? GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}
