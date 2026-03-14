using Microsoft.AspNetCore.SignalR;
using RideShare.Api.Hubs;

namespace RideShare.Api.Services;

public interface INotificationService
{
    Task SendNotificationAsync(Guid userId, NotificationDto notification);
    Task SendRideRequestNotificationAsync(Guid riderId, string passengerName, string origin, string destination);
    Task SendRequestAcceptedNotificationAsync(Guid passengerId, string riderName, string origin, string destination);
    Task SendRequestRejectedNotificationAsync(Guid passengerId, string riderName, string origin, string destination);
    Task SendRideCancelledNotificationAsync(Guid passengerId, string riderName, string origin, string destination);
    Task SendRideCompletedNotificationAsync(Guid passengerId, string riderName, string origin, string destination);
    Task SendNewRatingNotificationAsync(Guid riderId, int rating, string passengerName);
    Task SendRideStartedNotificationAsync(Guid passengerId, Guid rideId, string riderName, string origin, string destination);
    Task BroadcastLocationUpdateAsync(Guid rideId, double lat, double lng);
}

public class NotificationDto
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public Dictionary<string, object>? Data { get; set; }
}

public class NotificationService : INotificationService
{
    private readonly IHubContext<NotificationHub> _notificationHub;
    private readonly IHubContext<LocationTrackingHub> _locationHub;

    public NotificationService(
        IHubContext<NotificationHub> notificationHub,
        IHubContext<LocationTrackingHub> locationHub)
    {
        _notificationHub = notificationHub;
        _locationHub = locationHub;
    }

    public async Task SendNotificationAsync(Guid userId, NotificationDto notification)
    {
        await _notificationHub.Clients.Group($"user_{userId}").SendAsync("ReceiveNotification", notification);
    }

    public async Task BroadcastLocationUpdateAsync(Guid rideId, double lat, double lng)
    {
        var locationUpdate = new LocationUpdate
        {
            RideId = rideId,
            Lat = lat,
            Lng = lng,
            Timestamp = DateTime.UtcNow
        };
        
        await _locationHub.Clients.Group($"ride_{rideId}").SendAsync("LocationUpdate", locationUpdate);
    }

    public async Task SendRideStartedNotificationAsync(Guid passengerId, Guid rideId, string riderName, string origin, string destination)
    {
        var notification = new NotificationDto
        {
            Type = "ride_started",
            Title = "Ride Started! 🚀",
            Message = $"{riderName} has started the ride from {origin} to {destination}. You can now track their location!",
            Data = new Dictionary<string, object>
            {
                { "rideId", rideId.ToString() },
                { "riderName", riderName },
                { "origin", origin },
                { "destination", destination }
            }
        };

        await SendNotificationAsync(passengerId, notification);
    }

    public async Task SendRideRequestNotificationAsync(Guid riderId, string passengerName, string origin, string destination)
    {
        var notification = new NotificationDto
        {
            Type = "ride_request",
            Title = "New Ride Request",
            Message = $"{passengerName} wants to join your ride from {origin} to {destination}",
            Data = new Dictionary<string, object>
            {
                { "passengerName", passengerName },
                { "origin", origin },
                { "destination", destination }
            }
        };

        await SendNotificationAsync(riderId, notification);
    }

    public async Task SendRequestAcceptedNotificationAsync(Guid passengerId, string riderName, string origin, string destination)
    {
        var notification = new NotificationDto
        {
            Type = "request_accepted",
            Title = "Request Accepted! 🎉",
            Message = $"{riderName} accepted your request for the ride from {origin} to {destination}",
            Data = new Dictionary<string, object>
            {
                { "riderName", riderName },
                { "origin", origin },
                { "destination", destination }
            }
        };

        await SendNotificationAsync(passengerId, notification);
    }

    public async Task SendRequestRejectedNotificationAsync(Guid passengerId, string riderName, string origin, string destination)
    {
        var notification = new NotificationDto
        {
            Type = "request_rejected",
            Title = "Request Declined",
            Message = $"{riderName} declined your request for the ride from {origin} to {destination}",
            Data = new Dictionary<string, object>
            {
                { "riderName", riderName },
                { "origin", origin },
                { "destination", destination }
            }
        };

        await SendNotificationAsync(passengerId, notification);
    }

    public async Task SendRideCancelledNotificationAsync(Guid passengerId, string riderName, string origin, string destination)
    {
        var notification = new NotificationDto
        {
            Type = "ride_cancelled",
            Title = "Ride Cancelled",
            Message = $"{riderName} cancelled the ride from {origin} to {destination}",
            Data = new Dictionary<string, object>
            {
                { "riderName", riderName },
                { "origin", origin },
                { "destination", destination }
            }
        };

        await SendNotificationAsync(passengerId, notification);
    }

    public async Task SendRideCompletedNotificationAsync(Guid passengerId, string riderName, string origin, string destination)
    {
        var notification = new NotificationDto
        {
            Type = "ride_completed",
            Title = "Ride Completed",
            Message = $"Your ride with {riderName} from {origin} to {destination} has been completed. Don't forget to rate!",
            Data = new Dictionary<string, object>
            {
                { "riderName", riderName },
                { "origin", origin },
                { "destination", destination }
            }
        };

        await SendNotificationAsync(passengerId, notification);
    }

    public async Task SendNewRatingNotificationAsync(Guid riderId, int rating, string passengerName)
    {
        var stars = new string('⭐', rating);
        var notification = new NotificationDto
        {
            Type = "new_rating",
            Title = "New Rating Received",
            Message = $"{passengerName} gave you {stars} ({rating}/5)",
            Data = new Dictionary<string, object>
            {
                { "rating", rating },
                { "passengerName", passengerName }
            }
        };

        await SendNotificationAsync(riderId, notification);
    }
}
