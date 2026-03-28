namespace RideShare.Api.DTOs;

/// <summary>
/// DTOs for Uber-style on-demand ride requests
/// </summary>

public class CreateOnDemandRequestDto
{
    public string PickupLocation { get; set; } = string.Empty;
    public double PickupLat { get; set; }
    public double PickupLng { get; set; }
    public string DropoffLocation { get; set; } = string.Empty;
    public double DropoffLat { get; set; }
    public double DropoffLng { get; set; }
    public bool IsScheduled { get; set; } = false;  // false = "Now", true = scheduled
    public DateTime? ScheduledTime { get; set; }
    public string? Message { get; set; }
}

public class OnDemandRequestDto
{
    public Guid Id { get; set; }
    public Guid PassengerId { get; set; }
    public string PassengerName { get; set; } = string.Empty;
    public string? PassengerPhone { get; set; }
    public string? PassengerPhoto { get; set; }
    
    // Locations
    public string PickupLocation { get; set; } = string.Empty;
    public double PickupLat { get; set; }
    public double PickupLng { get; set; }
    public string DropoffLocation { get; set; } = string.Empty;
    public double DropoffLat { get; set; }
    public double DropoffLng { get; set; }
    
    // Timing
    public DateTime RequestedTime { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    
    // Status
    public string Status { get; set; } = string.Empty;
    public string? Message { get; set; }
    
    // Distance from rider (for nearby requests)
    public double? DistanceKm { get; set; }
    
    // Rider info (when accepted)
    public Guid? AcceptedRiderId { get; set; }
    public string? RiderName { get; set; }
    public string? RiderPhone { get; set; }
    public string? RiderPhoto { get; set; }
    public string? MotorcycleModel { get; set; }
    public string? PlateNumber { get; set; }
    public decimal? RiderRating { get; set; }
    public DateTime? AcceptedAt { get; set; }
    
    // Linked ride
    public Guid? RideId { get; set; }
}

public class NearbyRequestDto
{
    public Guid Id { get; set; }
    public string PassengerName { get; set; } = string.Empty;
    public string? PassengerPhoto { get; set; }
    
    public string PickupLocation { get; set; } = string.Empty;
    public double PickupLat { get; set; }
    public double PickupLng { get; set; }
    public string DropoffLocation { get; set; } = string.Empty;
    public double DropoffLat { get; set; }
    public double DropoffLng { get; set; }
    
    public DateTime RequestedTime { get; set; }
    public DateTime ExpiresAt { get; set; }
    public string? Message { get; set; }
    
    // Distance from rider's current location
    public double DistanceKm { get; set; }
    
    // Estimated route distance
    public double? EstimatedRouteKm { get; set; }
}

public class RiderLocationDto
{
    public double Latitude { get; set; }
    public double Longitude { get; set; }
}

public class NearbyRequestsResponseDto
{
    public bool IsRiderVerified { get; set; }
    public List<NearbyRequestDto> Requests { get; set; } = new();
}
