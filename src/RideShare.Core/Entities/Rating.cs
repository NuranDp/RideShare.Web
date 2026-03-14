namespace RideShare.Core.Entities;

public class Rating
{
    public Guid Id { get; set; }
    public Guid RideId { get; set; }
    public Guid RiderId { get; set; }
    public Guid PassengerId { get; set; }
    
    public int Score { get; set; } // 1-5 stars
    public string? Comment { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Ride Ride { get; set; } = null!;
    public User Rider { get; set; } = null!;
    public User Passenger { get; set; } = null!;
}
