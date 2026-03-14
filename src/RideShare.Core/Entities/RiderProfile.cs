namespace RideShare.Core.Entities;

public class RiderProfile
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }

    // License Information
    public string? LicenseNumber { get; set; }
    public string? LicenseImageUrl { get; set; }
    public DateTime? LicenseExpiryDate { get; set; }
    public bool IsLicenseVerified { get; set; } = false;
    public DateTime? VerifiedAt { get; set; }
    public Guid? VerifiedByAdminId { get; set; }

    // Motorcycle Information
    public string? MotorcycleModel { get; set; }
    public string? PlateNumber { get; set; }

    // Trust Score
    public int TotalRides { get; set; } = 0;
    public int TotalRatings { get; set; } = 0;
    public decimal AverageRating { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public User User { get; set; } = null!;
    public User? VerifiedByAdmin { get; set; }
}
