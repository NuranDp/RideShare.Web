namespace RideShare.Api.DTOs;

public class CreateRatingRequest
{
    public int Score { get; set; } // 1-5 stars
    public string? Comment { get; set; }
}

public class RatingDto
{
    public Guid Id { get; set; }
    public Guid RideId { get; set; }
    public Guid RiderId { get; set; }
    public string RiderName { get; set; } = string.Empty;
    public Guid PassengerId { get; set; }
    public string PassengerName { get; set; } = string.Empty;
    public int Score { get; set; }
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class RiderTrustScore
{
    public bool IsVerified { get; set; }
    public int TotalRides { get; set; }
    public int TotalRatings { get; set; }
    public decimal AverageRating { get; set; }
}
