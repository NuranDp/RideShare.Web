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
        
        await base.OnDisconnectedAsync(exception);
    }
}
