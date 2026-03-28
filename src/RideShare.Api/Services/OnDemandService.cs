using Microsoft.EntityFrameworkCore;
using RideShare.Api.Data;
using RideShare.Api.DTOs;
using RideShare.Core.Entities;

namespace RideShare.Api.Services;

public interface IOnDemandService
{
    // Passenger operations
    Task<OnDemandRequestDto?> CreateRequestAsync(Guid passengerId, CreateOnDemandRequestDto request);
    Task<OnDemandRequestDto?> GetRequestByIdAsync(Guid requestId);
    Task<List<OnDemandRequestDto>> GetMyRequestsAsync(Guid passengerId);
    Task<bool> CancelRequestAsync(Guid requestId, Guid passengerId);
    
    // Rider operations
    Task<NearbyRequestsResponseDto> GetNearbyRequestsAsync(Guid riderId, double lat, double lng, double radiusKm = 10);
    Task<OnDemandRequestDto?> AcceptRequestAsync(Guid requestId, Guid riderId);
    Task<List<OnDemandRequestDto>> GetMyAcceptedRequestsAsync(Guid riderId);
    Task<bool> IsRiderVerifiedAsync(Guid riderId);
    
    // Background task
    Task ExpireOldRequestsAsync();
}

public class OnDemandService : IOnDemandService
{
    private readonly RideShareDbContext _context;
    private readonly INotificationService _notificationService;
    private const int EXPIRATION_MINUTES = 15;
    private const double DEFAULT_RADIUS_KM = 10;

    public OnDemandService(RideShareDbContext context, INotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
    }

    public async Task<OnDemandRequestDto?> CreateRequestAsync(Guid passengerId, CreateOnDemandRequestDto request)
    {
        // Check if passenger already has an active (non-expired) request
        var existingRequest = await _context.OnDemandRequests
            .FirstOrDefaultAsync(r => r.PassengerId == passengerId && 
                                      r.Status == OnDemandRequestStatus.Searching &&
                                      r.ExpiresAt > DateTime.UtcNow);
        
        if (existingRequest != null)
        {
            return null; // Already has active request
        }

        // Clean up any expired searching requests for this user
        var expiredRequests = await _context.OnDemandRequests
            .Where(r => r.PassengerId == passengerId && 
                        r.Status == OnDemandRequestStatus.Searching &&
                        r.ExpiresAt <= DateTime.UtcNow)
            .ToListAsync();
        
        foreach (var expired in expiredRequests)
        {
            expired.Status = OnDemandRequestStatus.Expired;
        }

        var requestedTime = request.IsScheduled && request.ScheduledTime.HasValue 
            ? request.ScheduledTime.Value 
            : DateTime.UtcNow;

        var onDemandRequest = new OnDemandRequest
        {
            PassengerId = passengerId,
            PickupLocation = request.PickupLocation,
            PickupLat = request.PickupLat,
            PickupLng = request.PickupLng,
            DropoffLocation = request.DropoffLocation,
            DropoffLat = request.DropoffLat,
            DropoffLng = request.DropoffLng,
            RequestedTime = requestedTime,
            Message = request.Message,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddMinutes(EXPIRATION_MINUTES),
            Status = OnDemandRequestStatus.Searching
        };

        _context.OnDemandRequests.Add(onDemandRequest);
        await _context.SaveChangesAsync();

        // Send notification to nearby riders (broadcast)
        var passenger = await _context.Users.FindAsync(passengerId);
        if (passenger != null)
        {
            await _notificationService.SendOnDemandRequestNotificationAsync(
                onDemandRequest.Id,
                passenger.FullName,
                request.PickupLocation,
                request.DropoffLocation,
                request.PickupLat,
                request.PickupLng
            );
        }

        return await GetRequestByIdAsync(onDemandRequest.Id);
    }

    public async Task<OnDemandRequestDto?> GetRequestByIdAsync(Guid requestId)
    {
        var request = await _context.OnDemandRequests
            .Include(r => r.Passenger)
            .Include(r => r.AcceptedRider)
                .ThenInclude(u => u!.RiderProfile)
            .FirstOrDefaultAsync(r => r.Id == requestId);

        if (request == null) return null;

        return MapToDto(request);
    }

    public async Task<List<OnDemandRequestDto>> GetMyRequestsAsync(Guid passengerId)
    {
        var requests = await _context.OnDemandRequests
            .Include(r => r.Passenger)
            .Include(r => r.AcceptedRider)
                .ThenInclude(u => u!.RiderProfile)
            .Where(r => r.PassengerId == passengerId)
            .OrderByDescending(r => r.CreatedAt)
            .Take(20)
            .ToListAsync();

        // Auto-fix stale accepted requests whose linked ride is already completed/cancelled
        var staleAccepted = requests.Where(r => r.Status == OnDemandRequestStatus.Accepted && r.RideId.HasValue).ToList();
        if (staleAccepted.Any())
        {
            var rideIds = staleAccepted.Select(r => r.RideId!.Value).ToList();
            var completedRides = await _context.Rides
                .Where(ride => rideIds.Contains(ride.Id) && (ride.Status == RideStatus.Completed || ride.Status == RideStatus.Cancelled))
                .Select(ride => ride.Id)
                .ToListAsync();

            foreach (var req in staleAccepted.Where(r => completedRides.Contains(r.RideId!.Value)))
            {
                req.Status = OnDemandRequestStatus.Completed;
            }

            if (completedRides.Any())
            {
                await _context.SaveChangesAsync();
            }
        }

        return requests.Select(r => MapToDto(r)).ToList();
    }

    public async Task<List<OnDemandRequestDto>> GetMyAcceptedRequestsAsync(Guid riderId)
    {
        var requests = await _context.OnDemandRequests
            .Include(r => r.Passenger)
            .Include(r => r.AcceptedRider)
                .ThenInclude(u => u!.RiderProfile)
            .Where(r => r.AcceptedRiderId == riderId)
            .OrderByDescending(r => r.AcceptedAt ?? r.CreatedAt)
            .Take(50)
            .ToListAsync();

        return requests.Select(r => MapToDto(r)).ToList();
    }

    public async Task<bool> CancelRequestAsync(Guid requestId, Guid passengerId)
    {
        var request = await _context.OnDemandRequests
            .FirstOrDefaultAsync(r => r.Id == requestId && r.PassengerId == passengerId);

        if (request == null) return false;
        
        // Can only cancel if still searching
        if (request.Status != OnDemandRequestStatus.Searching)
        {
            return false;
        }

        request.Status = OnDemandRequestStatus.Cancelled;
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<NearbyRequestsResponseDto> GetNearbyRequestsAsync(Guid riderId, double lat, double lng, double radiusKm = 10)
    {
        // Verify rider is verified
        var riderProfile = await _context.RiderProfiles
            .FirstOrDefaultAsync(rp => rp.UserId == riderId && rp.IsLicenseVerified);

        if (riderProfile == null)
        {
            return new NearbyRequestsResponseDto { IsRiderVerified = false, Requests = new List<NearbyRequestDto>() };
        }

        // Get all searching requests that haven't expired
        var requests = await _context.OnDemandRequests
            .Include(r => r.Passenger)
            .Where(r => r.Status == OnDemandRequestStatus.Searching && 
                        r.ExpiresAt > DateTime.UtcNow)
            .ToListAsync();

        // Filter by distance and map to DTO
        var nearbyRequests = requests
            .Select(r => new
            {
                Request = r,
                Distance = CalculateDistanceKm(lat, lng, r.PickupLat, r.PickupLng)
            })
            .Where(x => x.Distance <= radiusKm)
            .OrderBy(x => x.Distance)
            .Select(x => new NearbyRequestDto
            {
                Id = x.Request.Id,
                PassengerName = x.Request.Passenger.FullName,
                PassengerPhoto = x.Request.Passenger.ProfilePhotoUrl,
                PickupLocation = x.Request.PickupLocation,
                PickupLat = x.Request.PickupLat,
                PickupLng = x.Request.PickupLng,
                DropoffLocation = x.Request.DropoffLocation,
                DropoffLat = x.Request.DropoffLat,
                DropoffLng = x.Request.DropoffLng,
                RequestedTime = x.Request.RequestedTime,
                ExpiresAt = x.Request.ExpiresAt,
                Message = x.Request.Message,
                DistanceKm = Math.Round(x.Distance, 1),
                EstimatedRouteKm = CalculateDistanceKm(
                    x.Request.PickupLat, x.Request.PickupLng,
                    x.Request.DropoffLat, x.Request.DropoffLng
                )
            })
            .ToList();

        return new NearbyRequestsResponseDto { IsRiderVerified = true, Requests = nearbyRequests };
    }

    public async Task<OnDemandRequestDto?> AcceptRequestAsync(Guid requestId, Guid riderId)
    {
        var request = await _context.OnDemandRequests
            .Include(r => r.Passenger)
            .FirstOrDefaultAsync(r => r.Id == requestId);

        if (request == null) return null;

        // Check if still searching
        if (request.Status != OnDemandRequestStatus.Searching)
        {
            return null; // Already accepted or cancelled
        }

        // Check if expired
        if (request.ExpiresAt <= DateTime.UtcNow)
        {
            // Mark as expired
            request.Status = OnDemandRequestStatus.Expired;
            await _context.SaveChangesAsync();
            return null;
        }

        // Verify rider is verified
        var riderProfile = await _context.RiderProfiles
            .Include(rp => rp.User)
            .FirstOrDefaultAsync(rp => rp.UserId == riderId && rp.IsLicenseVerified);

        if (riderProfile == null)
        {
            return null; // Rider not verified
        }

        // Create the ride (Uber-style: ride is created when rider accepts)
        var ride = new Ride
        {
            RiderId = riderId,
            Origin = request.PickupLocation,
            Destination = request.DropoffLocation,
            OriginLat = request.PickupLat,
            OriginLng = request.PickupLng,
            DestLat = request.DropoffLat,
            DestLng = request.DropoffLng,
            DepartureTime = request.RequestedTime,
            HelmetProvided = true, // Default for on-demand
            Notes = request.Message,
            Status = RideStatus.Booked, // Directly booked
            CreatedAt = DateTime.UtcNow
        };

        _context.Rides.Add(ride);
        
        // Save ride first to get the ID (required for FK constraint)
        await _context.SaveChangesAsync();

        // Create the ride request (auto-accepted)
        var rideRequest = new RideRequest
        {
            RideId = ride.Id,
            PassengerId = request.PassengerId,
            Status = RideRequestStatus.Accepted,
            PickupLocation = request.PickupLocation,
            PickupLat = request.PickupLat,
            PickupLng = request.PickupLng,
            DropoffLocation = request.DropoffLocation,
            DropoffLat = request.DropoffLat,
            DropoffLng = request.DropoffLng,
            Message = request.Message,
            CreatedAt = DateTime.UtcNow
        };

        _context.RideRequests.Add(rideRequest);

        // Update the on-demand request
        request.Status = OnDemandRequestStatus.Accepted;
        request.AcceptedRiderId = riderId;
        request.AcceptedAt = DateTime.UtcNow;
        request.RideId = ride.Id;

        await _context.SaveChangesAsync();

        // Notify passenger
        await _notificationService.SendOnDemandAcceptedNotificationAsync(
            request.PassengerId,
            ride.Id,
            riderProfile.User.FullName,
            riderProfile.MotorcycleModel ?? "Motorcycle",
            request.PickupLocation,
            request.DropoffLocation,
            riderProfile.User.Phone,
            riderProfile.PlateNumber
        );

        return await GetRequestByIdAsync(requestId);
    }

    public async Task ExpireOldRequestsAsync()
    {
        var expiredRequests = await _context.OnDemandRequests
            .Include(r => r.Passenger)
            .Where(r => r.Status == OnDemandRequestStatus.Searching && 
                        r.ExpiresAt <= DateTime.UtcNow)
            .ToListAsync();

        foreach (var request in expiredRequests)
        {
            request.Status = OnDemandRequestStatus.Expired;
            
            // Notify passenger that request expired
            await _notificationService.SendOnDemandExpiredNotificationAsync(
                request.PassengerId,
                request.PickupLocation,
                request.DropoffLocation
            );
        }

        await _context.SaveChangesAsync();
    }

    public async Task<bool> IsRiderVerifiedAsync(Guid riderId)
    {
        return await _context.RiderProfiles
            .AnyAsync(rp => rp.UserId == riderId && rp.IsLicenseVerified);
    }

    // Haversine formula to calculate distance between two points
    private static double CalculateDistanceKm(double lat1, double lng1, double lat2, double lng2)
    {
        const double R = 6371; // Earth's radius in km
        var dLat = ToRadians(lat2 - lat1);
        var dLng = ToRadians(lng2 - lng1);
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                Math.Sin(dLng / 2) * Math.Sin(dLng / 2);
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return R * c;
    }

    private static double ToRadians(double degrees) => degrees * Math.PI / 180;

    private OnDemandRequestDto MapToDto(OnDemandRequest request)
    {
        return new OnDemandRequestDto
        {
            Id = request.Id,
            PassengerId = request.PassengerId,
            PassengerName = request.Passenger.FullName,
            PassengerPhone = request.Passenger.Phone,
            PassengerPhoto = request.Passenger.ProfilePhotoUrl,
            PickupLocation = request.PickupLocation,
            PickupLat = request.PickupLat,
            PickupLng = request.PickupLng,
            DropoffLocation = request.DropoffLocation,
            DropoffLat = request.DropoffLat,
            DropoffLng = request.DropoffLng,
            RequestedTime = request.RequestedTime,
            CreatedAt = request.CreatedAt,
            ExpiresAt = request.ExpiresAt,
            Status = request.Status.ToString(),
            Message = request.Message,
            AcceptedRiderId = request.AcceptedRiderId,
            RiderName = request.AcceptedRider?.FullName,
            RiderPhone = request.AcceptedRider?.Phone,
            RiderPhoto = request.AcceptedRider?.ProfilePhotoUrl,
            MotorcycleModel = request.AcceptedRider?.RiderProfile?.MotorcycleModel,
            PlateNumber = request.AcceptedRider?.RiderProfile?.PlateNumber,
            RiderRating = request.AcceptedRider?.RiderProfile?.AverageRating,
            AcceptedAt = request.AcceptedAt,
            RideId = request.RideId
        };
    }
}
