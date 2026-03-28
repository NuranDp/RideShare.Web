using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace RideShare.Api.Hubs;

[Authorize]
public class NotificationHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        // Get user ID from JWT claims
        var userId = Context.User?.FindFirst("sub")?.Value 
                  ?? Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        
        if (!string.IsNullOrEmpty(userId))
        {
            // Add user to their personal group for targeted notifications
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
        }

        // Check if user is a rider and add to riders group
        var role = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
        if (role == "Rider")
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, "riders");
        }
        
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.User?.FindFirst("sub")?.Value
                  ?? Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        
        if (!string.IsNullOrEmpty(userId))
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{userId}");
        }

        // Remove from riders group if applicable
        var role = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
        if (role == "Rider")
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, "riders");
        }
        
        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>
    /// Rider can toggle availability for on-demand requests
    /// </summary>
    public async Task SetAvailableForRequests(bool available)
    {
        var role = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
        if (role != "Rider") return;

        if (available)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, "available_riders");
        }
        else
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, "available_riders");
        }
    }
}
