namespace RideShare.Api.DTOs;

public class RiderProfileDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string? LicenseNumber { get; set; }
    public string? LicenseImageUrl { get; set; }
    public DateTime? LicenseExpiryDate { get; set; }
    public bool IsLicenseVerified { get; set; }
    public DateTime? VerifiedAt { get; set; }
    public string? MotorcycleModel { get; set; }
    public string? PlateNumber { get; set; }
    public int TotalRides { get; set; }
    public int TotalRatings { get; set; }
    public decimal AverageRating { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class SubmitLicenseRequest
{
    public string LicenseNumber { get; set; } = string.Empty;
    public string LicenseImageUrl { get; set; } = string.Empty;
    public DateTime LicenseExpiryDate { get; set; }
}

public class UpdateRiderProfileRequest
{
    public string? MotorcycleModel { get; set; }
    public string? PlateNumber { get; set; }
}

public class LicenseVerificationDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string RiderName { get; set; } = string.Empty;
    public string RiderEmail { get; set; } = string.Empty;
    public string? LicenseNumber { get; set; }
    public string? LicenseImageUrl { get; set; }
    public DateTime? LicenseExpiryDate { get; set; }
    public string? MotorcycleModel { get; set; }
    public string? PlateNumber { get; set; }
    public DateTime SubmittedAt { get; set; }
}

public class VerifyLicenseRequest
{
    public bool Approved { get; set; }
    public string? RejectionReason { get; set; }
}

public class PublicRiderProfileDto
{
    public Guid UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? ProfilePhotoUrl { get; set; }
    public bool IsLicenseVerified { get; set; }
    public string? MotorcycleModel { get; set; }
    public int TotalRides { get; set; }
    public decimal AverageRating { get; set; }
    public DateTime MemberSince { get; set; }
}
