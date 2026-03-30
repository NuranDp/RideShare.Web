using Microsoft.EntityFrameworkCore;
using RideShare.Api.Data;
using RideShare.Core.Entities;

namespace RideShare.Api.Services;

public interface IChatService
{
    Task<ChatMessage> SendMessageAsync(Guid rideId, Guid senderId, string message);
    Task<IEnumerable<ChatMessage>> GetRideMessagesAsync(Guid rideId);
    Task<bool> CanUserAccessRideAsync(Guid rideId, Guid userId);
}

public class ChatService : IChatService
{
    private readonly RideShareDbContext _context;

    public ChatService(RideShareDbContext context)
    {
        _context = context;
    }

    public async Task<ChatMessage> SendMessageAsync(Guid rideId, Guid senderId, string message)
    {
        if (string.IsNullOrWhiteSpace(message) || message.Length > 200)
            throw new ArgumentException("Message must be non-empty and <= 200 characters.");

        var ride = await _context.Rides.FirstOrDefaultAsync(r => r.Id == rideId);
        if (ride == null)
            throw new KeyNotFoundException("Ride not found.");

        var chatMessage = new ChatMessage
        {
            Id = Guid.NewGuid(),
            RideId = rideId,
            SenderId = senderId,
            Message = message.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        _context.ChatMessages.Add(chatMessage);
        await _context.SaveChangesAsync();

        // Re-fetch with sender info for notification
        return await _context.ChatMessages
            .Include(c => c.Sender)
            .FirstAsync(c => c.Id == chatMessage.Id);
    }

    public async Task<IEnumerable<ChatMessage>> GetRideMessagesAsync(Guid rideId)
    {
        return await _context.ChatMessages
            .Where(c => c.RideId == rideId)
            .Include(c => c.Sender)
            .OrderBy(c => c.CreatedAt)
            .Take(100) // Limit to last 100 messages
            .ToListAsync();
    }

    public async Task<bool> CanUserAccessRideAsync(Guid rideId, Guid userId)
    {
        var ride = await _context.Rides
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == rideId);

        if (ride == null) return false;

        // Rider can always access.
        if (ride.RiderId == userId) return true;

        // Traditional flow: passenger accepted into a posted ride.
        var hasAcceptedRideRequest = await _context.RideRequests
            .AsNoTracking()
            .AnyAsync(req =>
                req.RideId == rideId &&
                req.PassengerId == userId &&
                req.Status == RideRequestStatus.Accepted);

        if (hasAcceptedRideRequest) return true;

        // On-demand flow: passenger tied to the ride through OnDemandRequest.
        var hasOnDemandAccess = await _context.OnDemandRequests
            .AsNoTracking()
            .AnyAsync(req =>
                req.RideId == rideId &&
                req.PassengerId == userId &&
                (req.Status == OnDemandRequestStatus.Accepted || req.Status == OnDemandRequestStatus.Completed));

        return hasOnDemandAccess;
    }
}
