namespace RideShare.Core.Entities;

public class RideRequest
{
    public Guid Id { get; set; }
    public Guid RideId { get; set; }
    public Guid PassengerId { get; set; }
    public RideRequestStatus Status { get; set; } = RideRequestStatus.Pending;
    public string? Message { get; set; }

    // Passenger's pickup and dropoff points (within rider's route)
    public string? PickupLocation { get; set; }
    public double? PickupLat { get; set; }
    public double? PickupLng { get; set; }
    public string? DropoffLocation { get; set; }
    public double? DropoffLat { get; set; }
    public double? DropoffLng { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public Ride Ride { get; set; } = null!;
    public User Passenger { get; set; } = null!;
}

public enum RideRequestStatus
{
    Pending,
    Accepted,
    Rejected,
    Cancelled
}
