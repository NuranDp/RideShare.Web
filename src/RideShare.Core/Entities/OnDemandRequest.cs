namespace RideShare.Core.Entities;

/// <summary>
/// Uber-style on-demand ride request where passenger requests first and riders accept.
/// This is separate from RideRequest which is for joining existing rides.
/// </summary>
public class OnDemandRequest
{
    public Guid Id { get; set; }
    public Guid PassengerId { get; set; }
    
    // Pickup location
    public string PickupLocation { get; set; } = string.Empty;
    public double PickupLat { get; set; }
    public double PickupLng { get; set; }
    
    // Dropoff location
    public string DropoffLocation { get; set; } = string.Empty;
    public double DropoffLat { get; set; }
    public double DropoffLng { get; set; }
    
    // Timing
    public DateTime RequestedTime { get; set; }  // When passenger wants the ride
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; }      // Auto-expire after 15 mins
    
    // Status tracking
    public OnDemandRequestStatus Status { get; set; } = OnDemandRequestStatus.Searching;
    
    // Rider acceptance
    public Guid? AcceptedRiderId { get; set; }
    public DateTime? AcceptedAt { get; set; }
    
    // Linked ride (created after acceptance)
    public Guid? RideId { get; set; }
    
    // Optional message from passenger
    public string? Message { get; set; }
    
    // Navigation properties
    public User Passenger { get; set; } = null!;
    public User? AcceptedRider { get; set; }
    public Ride? Ride { get; set; }
}

public enum OnDemandRequestStatus
{
    Searching,      // Looking for riders
    Accepted,       // Rider accepted, ride created
    Cancelled,      // Passenger cancelled
    Expired,        // No rider accepted within time limit
    Completed       // Ride completed
}
