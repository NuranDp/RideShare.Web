namespace RideShare.Core.Entities;

public class Ride
{
    public Guid Id { get; set; }
    public Guid RiderId { get; set; }
    public string Origin { get; set; } = string.Empty;
    public string Destination { get; set; } = string.Empty;
    public double? OriginLat { get; set; }
    public double? OriginLng { get; set; }
    public double? DestLat { get; set; }
    public double? DestLng { get; set; }
    public DateTime DepartureTime { get; set; }
    public bool HelmetProvided { get; set; } = false;
    public string? Notes { get; set; }
    public RideStatus Status { get; set; } = RideStatus.Active;
    
    // Live tracking fields
    public double? CurrentLat { get; set; }
    public double? CurrentLng { get; set; }
    public DateTime? LocationUpdatedAt { get; set; }
    public DateTime? StartedAt { get; set; }
    public bool ArrivalNotified { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public User Rider { get; set; } = null!;
    public ICollection<RideRequest> Requests { get; set; } = new List<RideRequest>();
}

public enum RideStatus
{
    Active,
    Booked,
    InProgress,
    Completed,
    Cancelled
}
