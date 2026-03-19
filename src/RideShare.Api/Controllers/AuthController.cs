using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RideShare.Api.DTOs;
using RideShare.Api.Services;

namespace RideShare.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var result = await _authService.RegisterAsync(request);

        if (result == null)
        {
            return BadRequest(new { message = "Email already exists" });
        }

        return Ok(result);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var result = await _authService.LoginAsync(request);

        if (result == null)
        {
            return Unauthorized(new { message = "Invalid email or password" });
        }

        return Ok(result);
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUser()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var user = await _authService.GetCurrentUserAsync(userId.Value);

        if (user == null)
        {
            return NotFound();
        }

        return Ok(user);
    }

    [Authorize]
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var user = await _authService.UpdateProfileAsync(userId.Value, request);

        if (user == null)
        {
            return NotFound();
        }

        return Ok(user);
    }

    [Authorize]
    [HttpPut("emergency-contact")]
    public async Task<IActionResult> UpdateEmergencyContact([FromBody] UpdateEmergencyContactRequest request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var user = await _authService.UpdateEmergencyContactAsync(userId.Value, request);

        if (user == null)
        {
            return NotFound();
        }

        return Ok(user);
    }

    [Authorize]
    [HttpPut("theme")]
    public async Task<IActionResult> UpdateTheme([FromBody] UpdateThemeRequest request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var user = await _authService.UpdateThemeAsync(userId.Value, request);

        if (user == null)
        {
            return NotFound();
        }

        return Ok(user);
    }

    [Authorize]
    [HttpPut("fcm-token")]
    public async Task<IActionResult> UpdateFcmToken([FromBody] FcmTokenRequest request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var success = await _authService.UpdateFcmTokenAsync(userId.Value, request.Token);

        if (!success)
        {
            return NotFound();
        }

        return Ok(new { message = "FCM token updated successfully" });
    }

    private Guid? GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}
