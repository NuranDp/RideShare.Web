namespace RideShare.Core.Entities;

public class User
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? ProfilePhotoUrl { get; set; }
    public UserRole Role { get; set; }
    public bool IsActive { get; set; } = true;
    public string ThemePreference { get; set; } = "light";
    public string? FcmToken { get; set; }

    // Emergency Contact
    public string? EmergencyContactName { get; set; }
    public string? EmergencyContactPhone { get; set; }
    public string? EmergencyContactRelation { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public RiderProfile? RiderProfile { get; set; }
    public ICollection<Ride> PostedRides { get; set; } = new List<Ride>();
    public ICollection<RideRequest> RideRequests { get; set; } = new List<RideRequest>();
}

public enum UserRole
{
    Passenger,
    Rider,
    Admin
}
