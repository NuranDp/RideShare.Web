using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace RideShare.Api.Hubs;

[Authorize]
public class LocationTrackingHub : Hub
{
    /// <summary>
    /// Called when a client wants to start tracking a specific ride
    /// </summary>
    public async Task JoinRideTracking(string rideId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"ride_{rideId}");
    }

    /// <summary>
    /// Called when a client wants to stop tracking a specific ride
    /// </summary>
    public async Task LeaveRideTracking(string rideId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"ride_{rideId}");
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await base.OnDisconnectedAsync(exception);
    }
}

public class LocationUpdate
{
    public Guid RideId { get; set; }
    public double Lat { get; set; }
    public double Lng { get; set; }
    public DateTime Timestamp { get; set; }
}
