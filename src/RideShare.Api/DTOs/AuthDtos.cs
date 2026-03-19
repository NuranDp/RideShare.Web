using System.ComponentModel.DataAnnotations;
using RideShare.Core.Entities;

namespace RideShare.Api.DTOs;

public class RegisterRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(6)]
    public string Password { get; set; } = string.Empty;

    [Required]
    public string FullName { get; set; } = string.Empty;

    public string? Phone { get; set; }

    [Required]
    public UserRole Role { get; set; }
}

public class LoginRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}

public class AuthResponse
{
    public string Token { get; set; } = string.Empty;
    public UserDto User { get; set; } = null!;
}

public class UserDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? ProfilePhotoUrl { get; set; }
    public string Role { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public string ThemePreference { get; set; } = "light";
    public EmergencyContactDto? EmergencyContact { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class EmergencyContactDto
{
    public string? Name { get; set; }
    public string? Phone { get; set; }
    public string? Relation { get; set; }
}

public class UpdateProfileRequest
{
    public string? FullName { get; set; }
    public string? Phone { get; set; }
    public string? ProfilePhotoUrl { get; set; }
}

public class UpdateEmergencyContactRequest
{
    public string? Name { get; set; }
    public string? Phone { get; set; }
    public string? Relation { get; set; }
}

public class UpdateThemeRequest
{
    public string Theme { get; set; } = "light";
}
