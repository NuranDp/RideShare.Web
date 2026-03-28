using Microsoft.AspNetCore.SignalR;
using RideShare.Api.Hubs;

namespace RideShare.Api.Services;

public interface INotificationService
{
    Task SendNotificationAsync(Guid userId, NotificationDto notification);
    Task SendRideRequestNotificationAsync(Guid riderId, string passengerName, string origin, string destination);
    Task SendRequestAcceptedNotificationAsync(Guid passengerId, Guid rideId, string riderName, string riderPhone, string origin, string destination, double? originLat, double? originLng, double? destLat, double? destLng, string? vehicleModel, string? plateNumber);
    Task SendRequestRejectedNotificationAsync(Guid passengerId, string riderName, string origin, string destination);
    Task SendRideCancelledNotificationAsync(Guid passengerId, Guid rideId, string riderName, string origin, string destination);
    Task SendRideCompletedNotificationAsync(Guid passengerId, Guid rideId, string riderName, string origin, string destination, DateTime? startedAt = null, DateTime? completedAt = null, string? vehicleModel = null, string? plateNumber = null);
    Task SendNewRatingNotificationAsync(Guid riderId, int rating, string passengerName);
    Task SendRideStartedNotificationAsync(Guid passengerId, Guid rideId, string riderName, string origin, string destination);
    Task SendRiderArrivedNotificationAsync(Guid passengerId, Guid rideId, string riderName, string pickupLocation);
    Task BroadcastLocationUpdateAsync(Guid rideId, double lat, double lng);
    
    // On-demand (Uber-style) notifications
    Task SendOnDemandRequestNotificationAsync(Guid requestId, string passengerName, string pickup, string dropoff, double pickupLat, double pickupLng);
    Task SendOnDemandAcceptedNotificationAsync(Guid passengerId, Guid rideId, string riderName, string motorcycleModel, string pickup, string dropoff, string? riderPhone = null, string? plateNumber = null);
    Task SendOnDemandExpiredNotificationAsync(Guid passengerId, string pickup, string dropoff);
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

    public async Task SendRequestAcceptedNotificationAsync(Guid passengerId, Guid rideId, string riderName, string riderPhone, string origin, string destination, double? originLat, double? originLng, double? destLat, double? destLng, string? vehicleModel, string? plateNumber)
    {
        var notification = new NotificationDto
        {
            Type = "request_accepted",
            Title = "Request Accepted! \ud83c\udf89",
            Message = $"{riderName} accepted your request for the ride from {origin} to {destination}",
            Data = new Dictionary<string, object>
            {
                { "rideId", rideId.ToString() },
                { "riderName", riderName },
                { "riderPhone", riderPhone ?? "" },
                { "origin", origin },
                { "destination", destination },
                { "originLat", originLat ?? 0 },
                { "originLng", originLng ?? 0 },
                { "destLat", destLat ?? 0 },
                { "destLng", destLng ?? 0 },
                { "vehicleModel", vehicleModel ?? "" },
                { "plateNumber", plateNumber ?? "" }
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

    public async Task SendRideCancelledNotificationAsync(Guid passengerId, Guid rideId, string riderName, string origin, string destination)
    {
        var notification = new NotificationDto
        {
            Type = "ride_cancelled",
            Title = "Ride Cancelled",
            Message = $"{riderName} cancelled the ride from {origin} to {destination}",
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

    public async Task SendRideCompletedNotificationAsync(Guid passengerId, Guid rideId, string riderName, string origin, string destination, DateTime? startedAt = null, DateTime? completedAt = null, string? vehicleModel = null, string? plateNumber = null)
    {
        var notification = new NotificationDto
        {
            Type = "ride_completed",
            Title = "Ride Completed",
            Message = $"Your ride with {riderName} from {origin} to {destination} has been completed. Don't forget to rate!",
            Data = new Dictionary<string, object>
            {
                { "rideId", rideId.ToString() },
                { "riderName", riderName },
                { "origin", origin },
                { "destination", destination },
                { "startedAt", startedAt?.ToString("o") ?? "" },
                { "completedAt", (completedAt ?? DateTime.UtcNow).ToString("o") },
                { "vehicleModel", vehicleModel ?? "" },
                { "plateNumber", plateNumber ?? "" }
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
    public async Task SendRiderArrivedNotificationAsync(Guid passengerId, Guid rideId, string riderName, string pickupLocation)
    {
        var notification = new NotificationDto
        {
            Type = "rider_arrived",
            Title = "Rider Has Arrived! \ud83d\udccd",
            Message = $"{riderName} has arrived at {pickupLocation}. Please meet your rider.",
            Data = new Dictionary<string, object>
            {
                { "rideId", rideId.ToString() },
                { "riderName", riderName },
                { "pickupLocation", pickupLocation }
            }
        };

        await SendNotificationAsync(passengerId, notification);
    }
    // On-demand (Uber-style) notifications
    public async Task SendOnDemandRequestNotificationAsync(Guid requestId, string passengerName, string pickup, string dropoff, double pickupLat, double pickupLng)
    {
        var notification = new NotificationDto
        {
            Type = "ondemand_request",
            Title = "New Ride Request Nearby! 🚕",
            Message = $"{passengerName} needs a ride from {pickup} to {dropoff}",
            Data = new Dictionary<string, object>
            {
                { "requestId", requestId.ToString() },
                { "passengerName", passengerName },
                { "pickup", pickup },
                { "dropoff", dropoff },
                { "pickupLat", pickupLat },
                { "pickupLng", pickupLng }
            }
        };

        // Broadcast to all riders (they filter by distance on client)
        await _notificationHub.Clients.Group("riders").SendAsync("ReceiveNotification", notification);
    }

    public async Task SendOnDemandAcceptedNotificationAsync(Guid passengerId, Guid rideId, string riderName, string motorcycleModel, string pickup, string dropoff, string? riderPhone = null, string? plateNumber = null)
    {
        var data = new Dictionary<string, object>
        {
            { "rideId", rideId.ToString() },
            { "riderName", riderName },
            { "motorcycleModel", motorcycleModel },
            { "pickup", pickup },
            { "dropoff", dropoff }
        };

        if (!string.IsNullOrEmpty(riderPhone))
            data["riderPhone"] = riderPhone;
        if (!string.IsNullOrEmpty(plateNumber))
            data["plateNumber"] = plateNumber;

        var notification = new NotificationDto
        {
            Type = "ondemand_accepted",
            Title = "Rider Found! \ud83c\udf89",
            Message = $"{riderName} is on the way with {motorcycleModel}",
            Data = data
        };

        await SendNotificationAsync(passengerId, notification);
    }

    public async Task SendOnDemandExpiredNotificationAsync(Guid passengerId, string pickup, string dropoff)
    {
        var notification = new NotificationDto
        {
            Type = "ondemand_expired",
            Title = "Request Expired",
            Message = $"No riders available for your ride from {pickup} to {dropoff}. Please try again.",
            Data = new Dictionary<string, object>
            {
                { "pickup", pickup },
                { "dropoff", dropoff }
            }
        };

        await SendNotificationAsync(passengerId, notification);
    }
}
