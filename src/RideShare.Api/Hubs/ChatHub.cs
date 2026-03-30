using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using RideShare.Api.Services;

namespace RideShare.Api.Hubs;

[Authorize]
public class ChatHub : Hub
{
    private readonly IChatService _chatService;

    public ChatHub(IChatService chatService)
    {
        _chatService = chatService;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = GetUserId();
        if (!string.IsNullOrEmpty(userId))
        {
            // Add user to their personal group for ride-specific chat routes
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
        }
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = GetUserId();
        if (!string.IsNullOrEmpty(userId))
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{userId}");
        }
        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>
    /// Rider or passenger joins the chat group for a specific ride
    /// </summary>
    public async Task JoinRideChat(Guid rideId)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return;

        if (!Guid.TryParse(userId, out var userGuid))
        {
            // Notify client of error
            await Clients.Caller.SendAsync("error", "Invalid user ID");
            return;
        }

        // Verify user can access this ride's chat
        var canAccess = await _chatService.CanUserAccessRideAsync(rideId, userGuid);
        if (!canAccess)
        {
            await Clients.Caller.SendAsync("error", "You don't have access to this ride's chat");
            return;
        }

        // Add to ride-specific group
        await Groups.AddToGroupAsync(Context.ConnectionId, $"ride_{rideId}");
        
        // Notify others in the ride chat that someone joined
        await Clients.Group($"ride_{rideId}").SendAsync("userJoinedChat", new { rideId, userId });
    }

    /// <summary>
    /// Leave the chat group for a ride
    /// </summary>
    public async Task LeaveRideChat(Guid rideId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"ride_{rideId}");
    }

    /// <summary>
    /// Send a message to the ride chat
    /// </summary>
    public async Task SendMessage(Guid rideId, string message)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var userGuid))
        {
            await Clients.Caller.SendAsync("error", "Authentication failed");
            return;
        }

        try
        {
            var chatMessage = await _chatService.SendMessageAsync(rideId, userGuid, message);

            // Send to all users in the ride chat group
            await Clients.Group($"ride_{rideId}").SendAsync("receiveMessage", new
            {
                id = chatMessage.Id,
                rideId = chatMessage.RideId,
                senderId = chatMessage.SenderId,
                senderName = chatMessage.Sender.FullName,
                senderPhotoUrl = chatMessage.Sender.ProfilePhotoUrl,
                message = chatMessage.Message,
                createdAt = chatMessage.CreatedAt,
                isOwnMessage = chatMessage.SenderId == userGuid
            });
        }
        catch (Exception ex)
        {
            await Clients.Caller.SendAsync("error", $"Failed to send message: {ex.Message}");
        }
    }

    private string? GetUserId()
    {
        return Context.User?.FindFirst("sub")?.Value
            ?? Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
    }
}
