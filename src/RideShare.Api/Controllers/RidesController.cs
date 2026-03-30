using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RideShare.Api.DTOs;
using RideShare.Api.Services;

namespace RideShare.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RidesController : ControllerBase
{
    private readonly IRideService _rideService;

    public RidesController(IRideService rideService)
    {
        _rideService = rideService;
    }

    /// <summary>
    /// Get available rides (public, but auth users get more details)
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAvailableRides([FromQuery] RideSearchParams? search)
    {
        var rides = await _rideService.GetAvailableRidesAsync(search);
        return Ok(rides);
    }

    /// <summary>
    /// Get popular routes based on historical data with traffic consideration
    /// </summary>
    [HttpGet("popular-routes")]
    public async Task<IActionResult> GetPopularRoutes([FromQuery] int limit = 10)
    {
        var routes = await _rideService.GetPopularRoutesAsync(limit);
        return Ok(routes);
    }

    /// <summary>
    /// Get ride details by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetRide(Guid id)
    {
        var ride = await _rideService.GetRideByIdAsync(id);
        if (ride == null)
        {
            return NotFound(new { message = "Ride not found" });
        }
        return Ok(ride);
    }

    /// <summary>
    /// Create a new ride (Rider only, must be verified)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Rider")]
    public async Task<IActionResult> CreateRide([FromBody] CreateRideRequest request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var ride = await _rideService.CreateRideAsync(userId.Value, request);
        if (ride == null)
        {
            return BadRequest(new { message = "You must be a verified rider to post rides" });
        }

        return CreatedAtAction(nameof(GetRide), new { id = ride.Id }, ride);
    }

    /// <summary>
    /// Get my posted rides (Rider)
    /// </summary>
    [HttpGet("my-rides")]
    [Authorize(Roles = "Rider")]
    public async Task<IActionResult> GetMyPostedRides()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var rides = await _rideService.GetMyPostedRidesAsync(userId.Value);
        return Ok(rides);
    }

    /// <summary>
    /// Update a ride (Rider - owner only)
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "Rider")]
    public async Task<IActionResult> UpdateRide(Guid id, [FromBody] UpdateRideRequest request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var ride = await _rideService.UpdateRideAsync(id, userId.Value, request);
        if (ride == null)
        {
            return NotFound(new { message = "Ride not found or cannot be updated" });
        }

        return Ok(ride);
    }

    /// <summary>
    /// Cancel a ride (Rider - owner only)
    /// </summary>
    [HttpPut("{id}/cancel")]
    [Authorize(Roles = "Rider")]
    public async Task<IActionResult> CancelRide(Guid id)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var result = await _rideService.CancelRideAsync(id, userId.Value);
        if (!result)
        {
            return NotFound(new { message = "Ride not found" });
        }

        return Ok(new { message = "Ride cancelled successfully" });
    }

    /// <summary>
    /// Mark ride as completed (Rider - owner only)
    /// </summary>
    [HttpPut("{id}/complete")]
    [Authorize(Roles = "Rider")]
    public async Task<IActionResult> CompleteRide(Guid id)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var result = await _rideService.CompleteRideAsync(id, userId.Value);
        if (!result)
        {
            return NotFound(new { message = "Ride not found or cannot be completed" });
        }

        return Ok(new { message = "Ride marked as completed" });
    }

    /// <summary>
    /// Start a ride - changes status from Booked to InProgress (Rider - owner only)
    /// </summary>
    [HttpPut("{id}/start")]
    [Authorize(Roles = "Rider")]
    public async Task<IActionResult> StartRide(Guid id, [FromBody] StartRideRequest request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var result = await _rideService.StartRideAsync(id, userId.Value, request.Lat, request.Lng);
        if (!result)
        {
            return BadRequest(new { message = "Ride not found or cannot be started. Only booked rides can be started." });
        }

        return Ok(new { message = "Ride started! Passenger has been notified." });
    }

    /// <summary>
    /// Update rider's current location during an active ride (Rider - owner only)
    /// </summary>
    [HttpPut("{id}/location")]
    [Authorize(Roles = "Rider")]
    public async Task<IActionResult> UpdateLocation(Guid id, [FromBody] UpdateLocationRequest request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var result = await _rideService.UpdateRideLocationAsync(id, userId.Value, request.Lat, request.Lng);
        if (!result)
        {
            return NotFound(new { message = "Ride not found or not in progress" });
        }

        return Ok(new { message = "Location updated" });
    }

    /// <summary>
    /// Get current location of a ride (Passenger with accepted request)
    /// </summary>
    [HttpGet("{id}/location")]
    [Authorize]
    public async Task<IActionResult> GetRideLocation(Guid id)
    {
        var location = await _rideService.GetRideLocationAsync(id);
        if (location == null)
        {
            return NotFound(new { message = "Ride not found" });
        }

        return Ok(location);
    }

    /// <summary>
    /// Request to join a ride (Passenger)
    /// </summary>
    [HttpPost("{id}/request")]
    [Authorize(Roles = "Passenger")]
    public async Task<IActionResult> RequestToJoin(Guid id, [FromBody] CreateRideRequestDto request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var rideRequest = await _rideService.RequestToJoinRideAsync(id, userId.Value, request);
        if (rideRequest == null)
        {
            return BadRequest(new { message = "Cannot request to join this ride. It may not exist, or you already requested." });
        }

        return Ok(rideRequest);
    }

    /// <summary>
    /// Get requests for a specific ride (Rider - owner only)
    /// </summary>
    [HttpGet("{id}/requests")]
    [Authorize(Roles = "Rider")]
    public async Task<IActionResult> GetRideRequests(Guid id)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var requests = await _rideService.GetRideRequestsAsync(id, userId.Value);
        return Ok(requests);
    }

    /// <summary>
    /// Get my ride requests (Passenger)
    /// </summary>
    [HttpGet("my-requests")]
    [Authorize(Roles = "Passenger")]
    public async Task<IActionResult> GetMyRequests()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var requests = await _rideService.GetMyRequestsAsync(userId.Value);
        return Ok(requests);
    }

    /// <summary>
    /// Get all pending requests for my rides (Rider)
    /// </summary>
    [HttpGet("my-pending-requests")]
    [Authorize(Roles = "Rider")]
    public async Task<IActionResult> GetMyPendingRequests()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var requests = await _rideService.GetMyPendingRequestsAsync(userId.Value);
        return Ok(requests);
    }

    /// <summary>
    /// Accept a ride request (Rider - owner only)
    /// </summary>
    [HttpPut("requests/{requestId}/accept")]
    [Authorize(Roles = "Rider")]
    public async Task<IActionResult> AcceptRequest(Guid requestId)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var result = await _rideService.AcceptRequestAsync(requestId, userId.Value);
        if (!result)
        {
            return NotFound(new { message = "Request not found or already processed" });
        }

        return Ok(new { message = "Request accepted. Contact info shared with passenger." });
    }

    /// <summary>
    /// Reject a ride request (Rider - owner only)
    /// </summary>
    [HttpPut("requests/{requestId}/reject")]
    [Authorize(Roles = "Rider")]
    public async Task<IActionResult> RejectRequest(Guid requestId)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var result = await _rideService.RejectRequestAsync(requestId, userId.Value);
        if (!result)
        {
            return NotFound(new { message = "Request not found or already processed" });
        }

        return Ok(new { message = "Request rejected" });
    }

    /// <summary>
    /// Cancel my request (Passenger)
    /// </summary>
    [HttpPut("requests/{requestId}/cancel")]
    [Authorize(Roles = "Passenger")]
    public async Task<IActionResult> CancelRequest(Guid requestId)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var result = await _rideService.CancelRequestAsync(requestId, userId.Value);
        if (!result)
        {
            return NotFound(new { message = "Request not found or cannot be cancelled" });
        }

        return Ok(new { message = "Request cancelled" });
    }

    /// <summary>
    /// Rate a rider after completing a ride (Passenger)
    /// </summary>
    [HttpPost("{id}/rate")]
    [Authorize(Roles = "Passenger")]
    public async Task<IActionResult> RateRider(Guid id, [FromBody] CreateRatingRequest request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var rating = await _rideService.RateRiderAsync(id, userId.Value, request);
        if (rating == null)
        {
            return BadRequest(new { message = "Cannot rate this ride. It may not be completed, you may not have been the passenger, or you already rated." });
        }

        return Ok(rating);
    }

    /// <summary>
    /// Check if user has already rated a ride
    /// </summary>
    [HttpGet("{id}/has-rated")]
    [Authorize(Roles = "Passenger")]
    public async Task<IActionResult> HasRatedRide(Guid id)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var hasRated = await _rideService.HasRatedRideAsync(id, userId.Value);
        return Ok(new { hasRated });
    }

    /// <summary>
    /// Get ratings for a specific rider
    /// </summary>
    [HttpGet("rider/{riderId}/ratings")]
    public async Task<IActionResult> GetRiderRatings(Guid riderId)
    {
        var ratings = await _rideService.GetRiderRatingsAsync(riderId);
        return Ok(ratings);
    }

    /// <summary>
    /// Get trust score for a rider
    /// </summary>
    [HttpGet("rider/{riderId}/trust-score")]
    public async Task<IActionResult> GetRiderTrustScore(Guid riderId)
    {
        var trustScore = await _rideService.GetRiderTrustScoreAsync(riderId);
        if (trustScore == null)
        {
            return NotFound(new { message = "Rider profile not found" });
        }
        return Ok(trustScore);
    }

    /// <summary>
    /// Get passenger's ride history (completed/cancelled rides)
    /// </summary>
    [HttpGet("my-history")]
    [Authorize(Roles = "Passenger")]
    public async Task<IActionResult> GetMyRideHistory()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var history = await _rideService.GetPassengerRideHistoryAsync(userId.Value);
        return Ok(history);
    }

    private Guid? GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }

    /// <summary>
    /// Debug: Get all rides without filters
    /// </summary>
    [HttpGet("debug/all")]
    public async Task<IActionResult> GetAllRidesDebug()
    {
        var rides = await _rideService.GetAllRidesDebugAsync();
        return Ok(rides);
    }

    // ── Chat Endpoints ──
    
    /// <summary>
    /// Get all messages for a ride (Rider or accepted passenger only)
    /// </summary>
    [HttpGet("{rideId}/messages")]
    [Authorize]
    public async Task<IActionResult> GetRideMessages(Guid rideId)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var canAccess = await _getChatService().CanUserAccessRideAsync(rideId, userId.Value);
        if (!canAccess)
            return Forbid("You don't have access to this ride's chat");

        var messages = await _getChatService().GetRideMessagesAsync(rideId);
        return Ok(messages.Select(m => new
        {
            id = m.Id,
            rideId = m.RideId,
            senderId = m.SenderId,
            senderName = m.Sender.FullName,
            senderPhotoUrl = m.Sender.ProfilePhotoUrl,
            message = m.Message,
            createdAt = m.CreatedAt
        }));
    }

    private IChatService _getChatService() => HttpContext.RequestServices.GetRequiredService<IChatService>();
}
