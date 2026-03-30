namespace RideShare.Core.Entities;

public class ChatMessage
{
    public Guid Id { get; set; }
    public Guid RideId { get; set; }
    public Guid SenderId { get; set; }
    
    public string Message { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public Ride Ride { get; set; } = null!;
    public User Sender { get; set; } = null!;
}
