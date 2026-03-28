using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RideShare.Api.DTOs;
using RideShare.Api.Services;

namespace RideShare.Api.Controllers;

/// <summary>
/// On-Demand Ride Requests (Uber-style)
/// Passengers request rides, riders accept
/// </summary>
[ApiController]
[Route("api/on-demand")]
public class OnDemandController : ControllerBase
{
    private readonly IOnDemandService _onDemandService;

    public OnDemandController(IOnDemandService onDemandService)
    {
        _onDemandService = onDemandService;
    }

    /// <summary>
    /// Create a new on-demand ride request (Passenger)
    /// </summary>
    [HttpPost("request")]
    [Authorize(Roles = "Passenger")]
    public async Task<IActionResult> CreateRequest([FromBody] CreateOnDemandRequestDto request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var result = await _onDemandService.CreateRequestAsync(userId.Value, request);
        if (result == null)
        {
            return BadRequest(new { message = "You already have an active request. Cancel it first or wait for a rider." });
        }

        return Ok(result);
    }

    /// <summary>
    /// Get my on-demand requests (Passenger)
    /// </summary>
    [HttpGet("my-requests")]
    [Authorize(Roles = "Passenger")]
    public async Task<IActionResult> GetMyRequests()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var requests = await _onDemandService.GetMyRequestsAsync(userId.Value);
        return Ok(requests);
    }

    /// <summary>
    /// Get a specific request by ID
    /// </summary>
    [HttpGet("request/{id}")]
    [Authorize]
    public async Task<IActionResult> GetRequest(Guid id)
    {
        var request = await _onDemandService.GetRequestByIdAsync(id);
        if (request == null)
        {
            return NotFound(new { message = "Request not found" });
        }
        return Ok(request);
    }

    /// <summary>
    /// Cancel my on-demand request (Passenger)
    /// </summary>
    [HttpDelete("request/{id}")]
    [Authorize(Roles = "Passenger")]
    public async Task<IActionResult> CancelRequest(Guid id)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var success = await _onDemandService.CancelRequestAsync(id, userId.Value);
        if (!success)
        {
            return BadRequest(new { message = "Cannot cancel this request. It may already be accepted or you are not the owner." });
        }

        return Ok(new { message = "Request cancelled" });
    }

    /// <summary>
    /// Get rider's accepted on-demand requests (history)
    /// </summary>
    [HttpGet("my-accepted")]
    [Authorize(Roles = "Rider")]
    public async Task<IActionResult> GetMyAcceptedRequests()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var requests = await _onDemandService.GetMyAcceptedRequestsAsync(userId.Value);
        return Ok(requests);
    }

    /// <summary>
    /// Get nearby on-demand requests (Rider)
    /// Requires rider's current location
    /// </summary>
    [HttpGet("nearby")]
    [Authorize(Roles = "Rider")]
    public async Task<IActionResult> GetNearbyRequests([FromQuery] double lat, [FromQuery] double lng, [FromQuery] double radiusKm = 10)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var result = await _onDemandService.GetNearbyRequestsAsync(userId.Value, lat, lng, radiusKm);
        return Ok(result);
    }

    /// <summary>
    /// Accept an on-demand request (Rider)
    /// Creates a ride and auto-accepts the passenger
    /// </summary>
    [HttpPost("request/{id}/accept")]
    [Authorize(Roles = "Rider")]
    public async Task<IActionResult> AcceptRequest(Guid id)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        // Check if rider has a verified profile
        var hasVerifiedProfile = await _onDemandService.IsRiderVerifiedAsync(userId.Value);
        if (!hasVerifiedProfile)
        {
            return BadRequest(new { message = "Your rider profile is not verified. Please complete verification to accept requests." });
        }

        var result = await _onDemandService.AcceptRequestAsync(id, userId.Value);
        if (result == null)
        {
            return BadRequest(new { message = "This request is no longer available. It may have been accepted by another rider or expired." });
        }

        return Ok(result);
    }

    private Guid? GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (Guid.TryParse(userIdClaim, out var userId))
        {
            return userId;
        }
        return null;
    }
}
