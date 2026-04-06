using Microsoft.EntityFrameworkCore;
using RideShare.Api.Data;
using RideShare.Api.DTOs;
using RideShare.Core.Entities;

namespace RideShare.Api.Services;

public interface IRideService
{
    // Ride operations
    Task<RideDto?> CreateRideAsync(Guid riderId, CreateRideRequest request);
    Task<RideDto?> GetRideByIdAsync(Guid rideId);
    Task<List<RideListDto>> GetAvailableRidesAsync(RideSearchParams? search);
    Task<List<RideDto>> GetMyPostedRidesAsync(Guid riderId);
    Task<RideDto?> UpdateRideAsync(Guid rideId, Guid riderId, UpdateRideRequest request);
    Task<bool> CancelRideAsync(Guid rideId, Guid riderId);
    Task<bool> StartRideAsync(Guid rideId, Guid riderId, double lat, double lng);
    Task<bool> UpdateRideLocationAsync(Guid rideId, Guid riderId, double lat, double lng);
    Task<RideLocationDto?> GetRideLocationAsync(Guid rideId);
    Task<bool> CompleteRideAsync(Guid rideId, Guid riderId);

    // Request operations
    Task<RideRequestDto?> RequestToJoinRideAsync(Guid rideId, Guid passengerId, CreateRideRequestDto request);
    Task<List<RideRequestDto>> GetRideRequestsAsync(Guid rideId, Guid riderId);
    Task<List<MyRideRequestDto>> GetMyRequestsAsync(Guid passengerId);
    Task<List<PendingRequestWithRideDto>> GetMyPendingRequestsAsync(Guid riderId);
    Task<bool> AcceptRequestAsync(Guid requestId, Guid riderId);
    Task<bool> RejectRequestAsync(Guid requestId, Guid riderId);
    Task<bool> CancelRequestAsync(Guid requestId, Guid passengerId);
    
    // Rating operations
    Task<RatingDto?> RateRiderAsync(Guid rideId, Guid passengerId, CreateRatingRequest request);
    Task<List<RatingDto>> GetRiderRatingsAsync(Guid riderId);
    Task<bool> HasRatedRideAsync(Guid rideId, Guid passengerId);
    Task<RiderTrustScore?> GetRiderTrustScoreAsync(Guid riderId);
    
    // History operations
    Task<List<PassengerRideHistoryDto>> GetPassengerRideHistoryAsync(Guid passengerId);
    
    // Popular routes
    Task<PopularRoutesResponse> GetPopularRoutesAsync(int limit = 10);
    
    // Debug
    Task<object> GetAllRidesDebugAsync();
}

public class RideService : IRideService
{
    private readonly RideShareDbContext _context;
    private readonly INotificationService _notificationService;
    private readonly IPricingService _pricingService;

    public RideService(RideShareDbContext context, INotificationService notificationService, IPricingService pricingService)
    {
        _context = context;
        _notificationService = notificationService;
        _pricingService = pricingService;
    }

    public async Task<RideDto?> CreateRideAsync(Guid riderId, CreateRideRequest request)
    {
        // Verify rider is verified
        var riderProfile = await _context.RiderProfiles
            .FirstOrDefaultAsync(rp => rp.UserId == riderId && rp.IsLicenseVerified);

        if (riderProfile == null)
        {
            return null; // Rider not verified
        }

        // Calculate fare if coordinates are provided
        decimal? fare = null;
        decimal? distanceKm = null;
        if (request.OriginLat.HasValue && request.OriginLng.HasValue && 
            request.DestLat.HasValue && request.DestLng.HasValue)
        {
            var fareResult = await _pricingService.CalculateFareAsync(
                request.OriginLat.Value, request.OriginLng.Value,
                request.DestLat.Value, request.DestLng.Value);
            
            fare = fareResult.Fare;
            distanceKm = (decimal)fareResult.DistanceKm;
        }

        var ride = new Ride
        {
            RiderId = riderId,
            Origin = request.Origin,
            Destination = request.Destination,
            OriginLat = request.OriginLat,
            OriginLng = request.OriginLng,
            DestLat = request.DestLat,
            DestLng = request.DestLng,
            DepartureTime = request.DepartureTime,
            HelmetProvided = request.HelmetProvided,
            Notes = request.Notes,
            Fare = fare,
            EstimatedDistanceKm = distanceKm,
            Status = RideStatus.Active,
            CreatedAt = DateTime.UtcNow
        };

        _context.Rides.Add(ride);
        await _context.SaveChangesAsync();

        return await GetRideByIdAsync(ride.Id);
    }

    public async Task<RideDto?> GetRideByIdAsync(Guid rideId)
    {
        var ride = await _context.Rides
            .Include(r => r.Rider)
                .ThenInclude(u => u.RiderProfile)
            .Include(r => r.Requests)
                .ThenInclude(req => req.Passenger)
            .FirstOrDefaultAsync(r => r.Id == rideId);

        if (ride == null) return null;

        return MapToRideDto(ride);
    }

    public async Task<List<RideListDto>> GetAvailableRidesAsync(RideSearchParams? search)
    {
        // Show rides from today onwards (including past times today for testing)
        var todayStart = DateTime.Today;
        
        var query = _context.Rides
            .Include(r => r.Rider)
            .Where(r => r.Status == RideStatus.Active && r.DepartureTime >= todayStart)
            .AsQueryable();

        if (!string.IsNullOrEmpty(search?.Origin))
        {
            query = query.Where(r => r.Origin.Contains(search.Origin));
        }

        if (!string.IsNullOrEmpty(search?.Destination))
        {
            query = query.Where(r => r.Destination.Contains(search.Destination));
        }

        if (search?.Date.HasValue == true)
        {
            var startOfDay = search.Date.Value.Date;
            var endOfDay = startOfDay.AddDays(1);
            query = query.Where(r => r.DepartureTime >= startOfDay && r.DepartureTime < endOfDay);
        }

        if (search?.HelmetProvided.HasValue == true)
        {
            query = query.Where(r => r.HelmetProvided == search.HelmetProvided.Value);
        }

        var rides = await query
            .OrderBy(r => r.DepartureTime)
            .ToListAsync();

        return rides.Select(r => new RideListDto
        {
            Id = r.Id,
            RiderName = r.Rider.FullName,
            RiderPhoto = r.Rider.ProfilePhotoUrl,
            RiderRating = r.Rider.RiderProfile?.AverageRating ?? 0,
            Origin = r.Origin,
            Destination = r.Destination,
            OriginLat = r.OriginLat,
            OriginLng = r.OriginLng,
            DestLat = r.DestLat,
            DestLng = r.DestLng,
            DepartureTime = r.DepartureTime,
            HelmetProvided = r.HelmetProvided,
            Status = r.Status.ToString(),
            CreatedAt = r.CreatedAt,
            Fare = r.Fare,
            EstimatedDistanceKm = r.EstimatedDistanceKm
        }).ToList();
    }

    public async Task<List<RideDto>> GetMyPostedRidesAsync(Guid riderId)
    {
        var rides = await _context.Rides
            .Include(r => r.Rider)
                .ThenInclude(u => u.RiderProfile)
            .Include(r => r.Requests)
                .ThenInclude(req => req.Passenger)
            .Where(r => r.RiderId == riderId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        return rides.Select(MapToRideDto).ToList();
    }

    public async Task<RideDto?> UpdateRideAsync(Guid rideId, Guid riderId, UpdateRideRequest request)
    {
        var ride = await _context.Rides.FirstOrDefaultAsync(r => r.Id == rideId && r.RiderId == riderId);
        if (ride == null) return null;

        if (ride.Status != RideStatus.Active)
        {
            return null; // Can only update active rides
        }

        if (request.Origin != null) ride.Origin = request.Origin;
        if (request.Destination != null) ride.Destination = request.Destination;
        if (request.DepartureTime.HasValue) ride.DepartureTime = request.DepartureTime.Value;
        if (request.HelmetProvided.HasValue) ride.HelmetProvided = request.HelmetProvided.Value;
        if (request.Notes != null) ride.Notes = request.Notes;

        ride.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return await GetRideByIdAsync(rideId);
    }

    public async Task<bool> CancelRideAsync(Guid rideId, Guid riderId)
    {
        var ride = await _context.Rides
            .Include(r => r.Rider)
            .Include(r => r.Requests)
            .FirstOrDefaultAsync(r => r.Id == rideId && r.RiderId == riderId);

        if (ride == null) return false;

        // Get accepted passenger before updating
        var acceptedRequest = ride.Requests.FirstOrDefault(r => r.Status == RideRequestStatus.Accepted);

        ride.Status = RideStatus.Cancelled;
        ride.UpdatedAt = DateTime.UtcNow;

        // Cancel all pending requests
        foreach (var request in ride.Requests.Where(r => r.Status == RideRequestStatus.Pending))
        {
            request.Status = RideRequestStatus.Cancelled;
            request.UpdatedAt = DateTime.UtcNow;
        }

        // Mark linked on-demand request as cancelled
        var onDemandRequest = await _context.OnDemandRequests
            .FirstOrDefaultAsync(r => r.RideId == rideId && r.Status == OnDemandRequestStatus.Accepted);
        if (onDemandRequest != null)
        {
            onDemandRequest.Status = OnDemandRequestStatus.Cancelled;
        }

        await _context.SaveChangesAsync();

        // Notify accepted passenger about cancellation
        if (acceptedRequest != null)
        {
            await _notificationService.SendRideCancelledNotificationAsync(
                acceptedRequest.PassengerId,
                ride.Id,
                ride.Rider.FullName,
                ride.Origin,
                ride.Destination);
        }

        return true;
    }

    public async Task<bool> CompleteRideAsync(Guid rideId, Guid riderId)
    {
        var ride = await _context.Rides
            .Include(r => r.Rider)
            .Include(r => r.Requests)
            .FirstOrDefaultAsync(r => r.Id == rideId && r.RiderId == riderId);
        if (ride == null) return false;

        // Can only complete rides that are InProgress
        if (ride.Status != RideStatus.InProgress && ride.Status != RideStatus.Booked) return false;

        // Get accepted passenger
        var acceptedRequest = ride.Requests.FirstOrDefault(r => r.Status == RideRequestStatus.Accepted);

        ride.Status = RideStatus.Completed;
        ride.UpdatedAt = DateTime.UtcNow;
        ride.CurrentLat = null;
        ride.CurrentLng = null;

        // Update rider stats
        var riderProfile = await _context.RiderProfiles.FirstOrDefaultAsync(rp => rp.UserId == riderId);
        if (riderProfile != null)
        {
            riderProfile.TotalRides++;
            riderProfile.UpdatedAt = DateTime.UtcNow;
        }

        // Mark linked on-demand request as completed
        var onDemandRequest = await _context.OnDemandRequests
            .FirstOrDefaultAsync(r => r.RideId == rideId && r.Status == OnDemandRequestStatus.Accepted);
        if (onDemandRequest != null)
        {
            onDemandRequest.Status = OnDemandRequestStatus.Completed;
        }

        await _context.SaveChangesAsync();

        // Notify passenger about ride completion
        if (acceptedRequest != null)
        {
            await _notificationService.SendRideCompletedNotificationAsync(
                acceptedRequest.PassengerId,
                ride.Id,
                ride.Rider.FullName,
                ride.Origin,
                ride.Destination,
                ride.StartedAt,
                ride.UpdatedAt,
                riderProfile?.MotorcycleModel,
                riderProfile?.PlateNumber);
        }

        return true;
    }

    public async Task<bool> StartRideAsync(Guid rideId, Guid riderId, double lat, double lng)
    {
        var ride = await _context.Rides
            .Include(r => r.Rider)
            .Include(r => r.Requests)
            .FirstOrDefaultAsync(r => r.Id == rideId && r.RiderId == riderId);
        
        if (ride == null) return false;
        if (ride.Status != RideStatus.Booked) return false;

        ride.Status = RideStatus.InProgress;
        ride.StartedAt = DateTime.UtcNow;
        ride.CurrentLat = lat;
        ride.CurrentLng = lng;
        ride.LocationUpdatedAt = DateTime.UtcNow;
        ride.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // Notify accepted passenger that ride has started
        var acceptedRequest = ride.Requests.FirstOrDefault(r => r.Status == RideRequestStatus.Accepted);
        if (acceptedRequest != null)
        {
            await _notificationService.SendRideStartedNotificationAsync(
                acceptedRequest.PassengerId,
                ride.Id,
                ride.Rider.FullName,
                ride.Origin,
                ride.Destination);
        }

        return true;
    }

    public async Task<bool> UpdateRideLocationAsync(Guid rideId, Guid riderId, double lat, double lng)
    {
        var ride = await _context.Rides
            .Include(r => r.Rider)
            .Include(r => r.Requests)
            .FirstOrDefaultAsync(r => r.Id == rideId && r.RiderId == riderId && r.Status == RideStatus.InProgress);
        
        if (ride == null) return false;

        ride.CurrentLat = lat;
        ride.CurrentLng = lng;
        ride.LocationUpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // Broadcast location to all tracking passengers
        await _notificationService.BroadcastLocationUpdateAsync(rideId, lat, lng);

        // Check if rider has arrived at pickup point (within ~100 meters)
        if (!ride.ArrivalNotified)
        {
            var acceptedRequest = ride.Requests.FirstOrDefault(r => r.Status == RideRequestStatus.Accepted);
            if (acceptedRequest != null)
            {
                // Use passenger's custom pickup if set, otherwise ride origin
                double? pickupLat = acceptedRequest.PickupLat ?? ride.OriginLat;
                double? pickupLng = acceptedRequest.PickupLng ?? ride.OriginLng;
                string pickupLocation = acceptedRequest.PickupLocation ?? ride.Origin;

                if (pickupLat.HasValue && pickupLng.HasValue)
                {
                    double distance = CalculateDistanceMeters(lat, lng, pickupLat.Value, pickupLng.Value);
                    if (distance <= 100) // Within 100 meters
                    {
                        ride.ArrivalNotified = true;
                        await _context.SaveChangesAsync();

                        await _notificationService.SendRiderArrivedNotificationAsync(
                            acceptedRequest.PassengerId,
                            ride.Id,
                            ride.Rider.FullName,
                            pickupLocation);
                    }
                }
            }
        }

        return true;
    }

    /// <summary>
    /// Calculate distance between two GPS coordinates in meters using Haversine formula
    /// </summary>
    private static double CalculateDistanceMeters(double lat1, double lng1, double lat2, double lng2)
    {
        const double R = 6371000; // Earth's radius in meters
        double dLat = (lat2 - lat1) * Math.PI / 180;
        double dLng = (lng2 - lng1) * Math.PI / 180;
        double a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                   Math.Cos(lat1 * Math.PI / 180) * Math.Cos(lat2 * Math.PI / 180) *
                   Math.Sin(dLng / 2) * Math.Sin(dLng / 2);
        double c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return R * c;
    }

    public async Task<RideLocationDto?> GetRideLocationAsync(Guid rideId)
    {
        var ride = await _context.Rides
            .Include(r => r.Rider)
                .ThenInclude(u => u.RiderProfile)
            .FirstOrDefaultAsync(r => r.Id == rideId);
        
        if (ride == null) return null;

        return new RideLocationDto
        {
            RideId = ride.Id,
            RiderName = ride.Rider.FullName,
            RiderPhone = ride.Rider.Phone,
            VehicleNumber = ride.Rider.RiderProfile?.PlateNumber,
            VehicleModel = ride.Rider.RiderProfile?.MotorcycleModel,
            Origin = ride.Origin,
            Destination = ride.Destination,
            OriginLat = ride.OriginLat,
            OriginLng = ride.OriginLng,
            DestLat = ride.DestLat,
            DestLng = ride.DestLng,
            CurrentLat = ride.CurrentLat,
            CurrentLng = ride.CurrentLng,
            LocationUpdatedAt = ride.LocationUpdatedAt,
            StartedAt = ride.StartedAt,
            Status = ride.Status.ToString()
        };
    }

    public async Task<RideRequestDto?> RequestToJoinRideAsync(Guid rideId, Guid passengerId, CreateRideRequestDto request)
    {
        var ride = await _context.Rides
            .Include(r => r.Rider)
            .FirstOrDefaultAsync(r => r.Id == rideId && r.Status == RideStatus.Active);
        if (ride == null) return null;

        // Check if passenger already requested
        var existingRequest = await _context.RideRequests
            .AnyAsync(rr => rr.RideId == rideId && rr.PassengerId == passengerId && rr.Status != RideRequestStatus.Cancelled);

        if (existingRequest) return null; // Already requested

        // Can't request own ride
        if (ride.RiderId == passengerId) return null;

        var passenger = await _context.Users.FindAsync(passengerId);
        if (passenger == null) return null;

        var rideRequest = new RideRequest
        {
            RideId = rideId,
            PassengerId = passengerId,
            Message = request.Message,
            PickupLocation = request.PickupLocation,
            PickupLat = request.PickupLat,
            PickupLng = request.PickupLng,
            DropoffLocation = request.DropoffLocation,
            DropoffLat = request.DropoffLat,
            DropoffLng = request.DropoffLng,
            Status = RideRequestStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        _context.RideRequests.Add(rideRequest);
        await _context.SaveChangesAsync();

        // Send notification to rider
        await _notificationService.SendRideRequestNotificationAsync(
            ride.RiderId,
            passenger.FullName,
            ride.Origin,
            ride.Destination);

        // Load passenger info
        var savedRequest = await _context.RideRequests
            .Include(rr => rr.Passenger)
            .FirstOrDefaultAsync(rr => rr.Id == rideRequest.Id);

        return MapToRideRequestDto(savedRequest!);
    }

    public async Task<List<RideRequestDto>> GetRideRequestsAsync(Guid rideId, Guid riderId)
    {
        // Verify the rider owns this ride
        var ride = await _context.Rides.FirstOrDefaultAsync(r => r.Id == rideId && r.RiderId == riderId);
        if (ride == null) return new List<RideRequestDto>();

        var requests = await _context.RideRequests
            .Include(rr => rr.Passenger)
            .Where(rr => rr.RideId == rideId)
            .OrderByDescending(rr => rr.CreatedAt)
            .ToListAsync();

        return requests.Select(MapToRideRequestDto).ToList();
    }

    public async Task<List<MyRideRequestDto>> GetMyRequestsAsync(Guid passengerId)
    {
        var requests = await _context.RideRequests
            .Include(rr => rr.Ride)
                .ThenInclude(r => r.Rider)
            .Where(rr => rr.PassengerId == passengerId)
            .OrderByDescending(rr => rr.CreatedAt)
            .ToListAsync();

        var rideIds = requests.Select(r => r.RideId).ToList();
        var ratings = await _context.Ratings
            .Where(r => rideIds.Contains(r.RideId) && r.PassengerId == passengerId)
            .Select(r => r.RideId)
            .ToListAsync();

        return requests.Select(rr => new MyRideRequestDto
        {
            Id = rr.Id,
            RideId = rr.RideId,
            RiderId = rr.Ride.RiderId,
            RiderName = rr.Ride.Rider.FullName,
            RiderPhone = rr.Status == RideRequestStatus.Accepted ? rr.Ride.Rider.Phone : null,
            Origin = rr.Ride.Origin,
            Destination = rr.Ride.Destination,
            PickupLocation = rr.PickupLocation,
            PickupLat = rr.PickupLat,
            PickupLng = rr.PickupLng,
            DropoffLocation = rr.DropoffLocation,
            DropoffLat = rr.DropoffLat,
            DropoffLng = rr.DropoffLng,
            DepartureTime = rr.Ride.DepartureTime,
            Message = rr.Message,
            Status = rr.Status.ToString(),
            RideStatus = rr.Ride.Status.ToString(),
            HasRated = ratings.Contains(rr.RideId),
            CreatedAt = rr.CreatedAt
        }).ToList();
    }

    public async Task<List<PendingRequestWithRideDto>> GetMyPendingRequestsAsync(Guid riderId)
    {
        var requests = await _context.RideRequests
            .Include(rr => rr.Passenger)
            .Include(rr => rr.Ride)
            .Where(rr => rr.Ride.RiderId == riderId && rr.Status == RideRequestStatus.Pending)
            .OrderByDescending(rr => rr.CreatedAt)
            .ToListAsync();

        return requests.Select(rr => new PendingRequestWithRideDto
        {
            Id = rr.Id,
            RideId = rr.RideId,
            PassengerId = rr.PassengerId,
            PassengerName = rr.Passenger.FullName,
            PassengerPhone = rr.Passenger.Phone,
            PassengerPhoto = rr.Passenger.ProfilePhotoUrl,
            Message = rr.Message,
            PickupLocation = rr.PickupLocation,
            PickupLat = rr.PickupLat,
            PickupLng = rr.PickupLng,
            DropoffLocation = rr.DropoffLocation,
            DropoffLat = rr.DropoffLat,
            DropoffLng = rr.DropoffLng,
            RequestedAt = rr.CreatedAt,
            RideOrigin = rr.Ride.Origin,
            RideDestination = rr.Ride.Destination,
            RideOriginLat = rr.Ride.OriginLat,
            RideOriginLng = rr.Ride.OriginLng,
            RideDestLat = rr.Ride.DestLat,
            RideDestLng = rr.Ride.DestLng,
            DepartureTime = rr.Ride.DepartureTime
        }).ToList();
    }

    public async Task<bool> AcceptRequestAsync(Guid requestId, Guid riderId)
    {
        var request = await _context.RideRequests
            .Include(rr => rr.Ride)
                .ThenInclude(r => r.Rider)
                    .ThenInclude(u => u.RiderProfile)
            .FirstOrDefaultAsync(rr => rr.Id == requestId && rr.Ride.RiderId == riderId);

        if (request == null) return false;
        if (request.Status != RideRequestStatus.Pending) return false;

        request.Status = RideRequestStatus.Accepted;
        request.UpdatedAt = DateTime.UtcNow;

        // Mark ride as booked
        request.Ride.Status = RideStatus.Booked;
        request.Ride.UpdatedAt = DateTime.UtcNow;

        // Reject all other pending requests for this ride
        var otherRequests = await _context.RideRequests
            .Where(rr => rr.RideId == request.RideId && rr.Id != requestId && rr.Status == RideRequestStatus.Pending)
            .ToListAsync();

        foreach (var other in otherRequests)
        {
            other.Status = RideRequestStatus.Rejected;
            other.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        // Send notification to accepted passenger with full ride details
        await _notificationService.SendRequestAcceptedNotificationAsync(
            request.PassengerId,
            request.RideId,
            request.Ride.Rider.FullName,
            request.Ride.Rider.Phone ?? "",
            request.Ride.Origin,
            request.Ride.Destination,
            request.Ride.OriginLat,
            request.Ride.OriginLng,
            request.Ride.DestLat,
            request.Ride.DestLng,
            request.Ride.Rider.RiderProfile?.MotorcycleModel,
            request.Ride.Rider.RiderProfile?.PlateNumber);

        // Send rejection notifications to other passengers
        foreach (var other in otherRequests)
        {
            await _notificationService.SendRequestRejectedNotificationAsync(
                other.PassengerId,
                request.Ride.Rider.FullName,
                request.Ride.Origin,
                request.Ride.Destination);
        }

        return true;
    }

    public async Task<bool> RejectRequestAsync(Guid requestId, Guid riderId)
    {
        var request = await _context.RideRequests
            .Include(rr => rr.Ride)
                .ThenInclude(r => r.Rider)
            .FirstOrDefaultAsync(rr => rr.Id == requestId && rr.Ride.RiderId == riderId);

        if (request == null) return false;
        if (request.Status != RideRequestStatus.Pending) return false;

        request.Status = RideRequestStatus.Rejected;
        request.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // Send notification to passenger
        await _notificationService.SendRequestRejectedNotificationAsync(
            request.PassengerId,
            request.Ride.Rider.FullName,
            request.Ride.Origin,
            request.Ride.Destination);

        return true;
    }

    public async Task<bool> CancelRequestAsync(Guid requestId, Guid passengerId)
    {
        var request = await _context.RideRequests
            .FirstOrDefaultAsync(rr => rr.Id == requestId && rr.PassengerId == passengerId);

        if (request == null) return false;
        if (request.Status != RideRequestStatus.Pending) return false;

        request.Status = RideRequestStatus.Cancelled;
        request.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<RatingDto?> RateRiderAsync(Guid rideId, Guid passengerId, CreateRatingRequest request)
    {
        // Validate score
        if (request.Score < 1 || request.Score > 5)
            return null;

        // Check if the ride exists and is completed
        var ride = await _context.Rides
            .Include(r => r.Rider)
            .FirstOrDefaultAsync(r => r.Id == rideId);

        if (ride == null || ride.Status != RideStatus.Completed)
            return null;

        // Check if passenger had an accepted request for this ride
        var acceptedRequest = await _context.RideRequests
            .FirstOrDefaultAsync(rr => rr.RideId == rideId && rr.PassengerId == passengerId && rr.Status == RideRequestStatus.Accepted);

        if (acceptedRequest == null)
            return null;

        // Check if already rated
        var existingRating = await _context.Ratings
            .FirstOrDefaultAsync(r => r.RideId == rideId && r.PassengerId == passengerId);

        if (existingRating != null)
            return null; // Already rated

        // Create rating
        var rating = new Rating
        {
            RideId = rideId,
            RiderId = ride.RiderId,
            PassengerId = passengerId,
            Score = request.Score,
            Comment = request.Comment,
            CreatedAt = DateTime.UtcNow
        };

        _context.Ratings.Add(rating);

        // Update rider's trust score
        var riderProfile = await _context.RiderProfiles.FirstOrDefaultAsync(rp => rp.UserId == ride.RiderId);
        if (riderProfile != null)
        {
            var allRatings = await _context.Ratings.Where(r => r.RiderId == ride.RiderId).ToListAsync();
            var newTotalRatings = allRatings.Count + 1;
            var newAverageRating = (decimal)(allRatings.Sum(r => r.Score) + request.Score) / newTotalRatings;
            
            riderProfile.TotalRatings = newTotalRatings;
            riderProfile.AverageRating = Math.Round(newAverageRating, 2);
            riderProfile.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        var passenger = await _context.Users.FindAsync(passengerId);

        // Send notification to rider about the new rating
        await _notificationService.SendNewRatingNotificationAsync(
            ride.RiderId,
            request.Score,
            passenger?.FullName ?? "A passenger");

        return new RatingDto
        {
            Id = rating.Id,
            RideId = rating.RideId,
            RiderId = rating.RiderId,
            RiderName = ride.Rider.FullName,
            PassengerId = rating.PassengerId,
            PassengerName = passenger?.FullName ?? "Unknown",
            Score = rating.Score,
            Comment = rating.Comment,
            CreatedAt = rating.CreatedAt
        };
    }

    public async Task<List<RatingDto>> GetRiderRatingsAsync(Guid riderId)
    {
        var ratings = await _context.Ratings
            .Include(r => r.Rider)
            .Include(r => r.Passenger)
            .Where(r => r.RiderId == riderId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        return ratings.Select(r => new RatingDto
        {
            Id = r.Id,
            RideId = r.RideId,
            RiderId = r.RiderId,
            RiderName = r.Rider.FullName,
            PassengerId = r.PassengerId,
            PassengerName = r.Passenger.FullName,
            Score = r.Score,
            Comment = r.Comment,
            CreatedAt = r.CreatedAt
        }).ToList();
    }

    public async Task<bool> HasRatedRideAsync(Guid rideId, Guid passengerId)
    {
        return await _context.Ratings.AnyAsync(r => r.RideId == rideId && r.PassengerId == passengerId);
    }

    public async Task<RiderTrustScore?> GetRiderTrustScoreAsync(Guid riderId)
    {
        var profile = await _context.RiderProfiles.FirstOrDefaultAsync(rp => rp.UserId == riderId);
        if (profile == null) return null;

        return new RiderTrustScore
        {
            IsVerified = profile.IsLicenseVerified,
            TotalRides = profile.TotalRides,
            TotalRatings = profile.TotalRatings,
            AverageRating = profile.AverageRating
        };
    }

    public async Task<List<PassengerRideHistoryDto>> GetPassengerRideHistoryAsync(Guid passengerId)
    {
        // Get all accepted requests where the ride is completed or cancelled
        var completedRequests = await _context.RideRequests
            .Include(rr => rr.Ride)
                .ThenInclude(r => r.Rider)
                    .ThenInclude(u => u.RiderProfile)
            .Where(rr => rr.PassengerId == passengerId 
                && rr.Status == RideRequestStatus.Accepted
                && (rr.Ride.Status == RideStatus.Completed || rr.Ride.Status == RideStatus.Cancelled))
            .OrderByDescending(rr => rr.Ride.UpdatedAt ?? rr.Ride.CreatedAt)
            .ToListAsync();

        var rideIds = completedRequests.Select(r => r.RideId).ToList();
        var ratings = await _context.Ratings
            .Where(r => rideIds.Contains(r.RideId) && r.PassengerId == passengerId)
            .ToDictionaryAsync(r => r.RideId, r => r.Score);

        return completedRequests.Select(rr => new PassengerRideHistoryDto
        {
            RideId = rr.RideId,
            RiderId = rr.Ride.RiderId,
            RiderName = rr.Ride.Rider.FullName,
            RiderPhone = rr.Ride.Rider.Phone,
            RiderRating = rr.Ride.Rider.RiderProfile?.AverageRating ?? 0,
            Origin = rr.Ride.Origin,
            Destination = rr.Ride.Destination,
            DepartureTime = rr.Ride.DepartureTime,
            RideStatus = rr.Ride.Status.ToString(),
            HelmetProvided = rr.Ride.HelmetProvided,
            HasRated = ratings.ContainsKey(rr.RideId),
            MyRating = ratings.ContainsKey(rr.RideId) ? ratings[rr.RideId] : null,
            CompletedAt = rr.Ride.UpdatedAt ?? rr.Ride.CreatedAt
        }).ToList();
    }

    private static RideDto MapToRideDto(Ride ride)
    {
        // Find the accepted passenger (if any)
        var acceptedRequest = ride.Requests?.FirstOrDefault(r => r.Status == RideRequestStatus.Accepted);
        
        return new RideDto
        {
            Id = ride.Id,
            RiderId = ride.RiderId,
            RiderName = ride.Rider.FullName,
            RiderPhone = ride.Rider.Phone,
            RiderPhoto = ride.Rider.ProfilePhotoUrl,
            MotorcycleModel = ride.Rider.RiderProfile?.MotorcycleModel,
            PlateNumber = ride.Rider.RiderProfile?.PlateNumber,
            RiderRating = ride.Rider.RiderProfile?.AverageRating ?? 0,
            RiderTotalRides = ride.Rider.RiderProfile?.TotalRides ?? 0,
            Origin = ride.Origin,
            Destination = ride.Destination,
            OriginLat = ride.OriginLat,
            OriginLng = ride.OriginLng,
            DestLat = ride.DestLat,
            DestLng = ride.DestLng,
            DepartureTime = ride.DepartureTime,
            HelmetProvided = ride.HelmetProvided,
            Notes = ride.Notes,
            Status = ride.Status.ToString(),
            RequestCount = ride.Requests?.Count ?? 0,
            CreatedAt = ride.CreatedAt,
            Fare = ride.Fare,
            EstimatedDistanceKm = ride.EstimatedDistanceKm,
            // Accepted passenger info
            PassengerId = acceptedRequest?.PassengerId,
            PassengerName = acceptedRequest?.Passenger?.FullName,
            PassengerPhone = acceptedRequest?.Passenger?.Phone,
            PassengerPhoto = acceptedRequest?.Passenger?.ProfilePhotoUrl
        };
    }

    private static RideRequestDto MapToRideRequestDto(RideRequest request)
    {
        return new RideRequestDto
        {
            Id = request.Id,
            RideId = request.RideId,
            PassengerId = request.PassengerId,
            PassengerName = request.Passenger.FullName,
            PassengerPhone = request.Status == RideRequestStatus.Accepted ? request.Passenger.Phone : null,
            PassengerPhoto = request.Passenger.ProfilePhotoUrl,
            Message = request.Message,
            PickupLocation = request.PickupLocation,
            PickupLat = request.PickupLat,
            PickupLng = request.PickupLng,
            DropoffLocation = request.DropoffLocation,
            DropoffLat = request.DropoffLat,
            DropoffLng = request.DropoffLng,
            Status = request.Status.ToString(),
            CreatedAt = request.CreatedAt
        };
    }

    public async Task<object> GetAllRidesDebugAsync()
    {
        var rides = await _context.Rides
            .Include(r => r.Rider)
            .ToListAsync();

        var now = DateTime.Now;
        var utcNow = DateTime.UtcNow;

        return new
        {
            ServerTimeLocal = now.ToString("o"),
            ServerTimeUtc = utcNow.ToString("o"),
            TotalRidesInDb = rides.Count,
            Rides = rides.Select(r => new
            {
                r.Id,
                r.Origin,
                r.Destination,
                DepartureTime = r.DepartureTime.ToString("o"),
                Status = r.Status.ToString(),
                RiderName = r.Rider.FullName,
                r.CreatedAt,
                IsFutureRide = r.DepartureTime > now,
                IsFutureRideUtc = r.DepartureTime > utcNow
            }).ToList()
        };
    }

    public async Task<PopularRoutesResponse> GetPopularRoutesAsync(int limit = 10)
    {
        var now = DateTime.Now;
        var currentHour = now.Hour;
        
        // Determine current time slot and traffic level
        var (currentTimeSlot, currentTrafficLevel) = GetTimeSlotAndTraffic(currentHour);

        // Get all rides from the last 90 days for analysis
        var cutoffDate = DateTime.UtcNow.AddDays(-90);
        var rides = await _context.Rides
            .Where(r => r.CreatedAt >= cutoffDate)
            .ToListAsync();

        // Group by normalized origin-destination pairs
        var routeGroups = rides
            .GroupBy(r => new { 
                Origin = NormalizeLocation(r.Origin), 
                Destination = NormalizeLocation(r.Destination) 
            })
            .Select(g => {
                var completedCount = g.Count(r => r.Status == RideStatus.Completed);
                var totalCount = g.Count();
                
                // Calculate time slot distribution
                var timeSlots = g.GroupBy(r => GetTimeSlot(r.DepartureTime.Hour))
                    .OrderByDescending(ts => ts.Count())
                    .FirstOrDefault();
                
                var peakTimeSlot = timeSlots?.Key ?? "Morning";
                var peakHour = GetPeakHour(peakTimeSlot);
                var (_, peakTraffic) = GetTimeSlotAndTraffic(peakHour);

                // Calculate popularity score considering:
                // 1. Total rides (40% weight)
                // 2. Completion rate (30% weight)
                // 3. Recency (30% weight - more recent rides weighted higher)
                var recentRides = g.Count(r => r.CreatedAt >= DateTime.UtcNow.AddDays(-30));
                var completionRate = totalCount > 0 ? (double)completedCount / totalCount : 0;
                var recencyScore = totalCount > 0 ? (double)recentRides / totalCount : 0;
                
                var popularityScore = (totalCount * 0.4) + (completionRate * 100 * 0.3) + (recencyScore * 100 * 0.3);

                // Get representative coordinates (from the most recent ride)
                var latestRide = g.OrderByDescending(r => r.CreatedAt).FirstOrDefault();

                return new PopularRouteDto
                {
                    Origin = g.First().Origin,
                    Destination = g.First().Destination,
                    OriginLat = latestRide?.OriginLat,
                    OriginLng = latestRide?.OriginLng,
                    DestLat = latestRide?.DestLat,
                    DestLng = latestRide?.DestLng,
                    TotalRides = totalCount,
                    CompletedRides = completedCount,
                    PopularityScore = Math.Round(popularityScore, 2),
                    PeakTimeSlot = peakTimeSlot,
                    TrafficLevel = peakTraffic,
                    RecommendedTime = GetRecommendedTime(peakTimeSlot, peakTraffic)
                };
            })
            .OrderByDescending(r => r.PopularityScore)
            .Take(limit)
            .ToList();

        return new PopularRoutesResponse
        {
            Routes = routeGroups,
            CurrentTimeSlot = currentTimeSlot,
            CurrentTrafficLevel = currentTrafficLevel
        };
    }

    private static string NormalizeLocation(string location)
    {
        // Normalize location for grouping (lowercase, trim, remove extra spaces)
        return location?.ToLower().Trim().Replace("  ", " ") ?? "";
    }

    private static string GetTimeSlot(int hour)
    {
        return hour switch
        {
            >= 5 and < 9 => "Morning Rush",
            >= 9 and < 12 => "Late Morning",
            >= 12 and < 14 => "Lunch",
            >= 14 and < 17 => "Afternoon",
            >= 17 and < 20 => "Evening Rush",
            >= 20 and < 23 => "Night",
            _ => "Late Night"
        };
    }

    private static (string timeSlot, string trafficLevel) GetTimeSlotAndTraffic(int hour)
    {
        var timeSlot = GetTimeSlot(hour);
        var trafficLevel = timeSlot switch
        {
            "Morning Rush" => "Heavy",
            "Evening Rush" => "Heavy",
            "Lunch" => "Moderate",
            "Afternoon" => "Moderate",
            "Late Morning" => "Light",
            "Night" => "Light",
            _ => "Very Light"
        };
        return (timeSlot, trafficLevel);
    }

    private static int GetPeakHour(string timeSlot)
    {
        return timeSlot switch
        {
            "Morning Rush" => 8,
            "Late Morning" => 10,
            "Lunch" => 13,
            "Afternoon" => 15,
            "Evening Rush" => 18,
            "Night" => 21,
            _ => 0
        };
    }

    private static string GetRecommendedTime(string peakTimeSlot, string trafficLevel)
    {
        // Suggest optimal departure times based on traffic patterns
        return (peakTimeSlot, trafficLevel) switch
        {
            ("Morning Rush", "Heavy") => "Leave early (6:00-7:00 AM) to avoid peak traffic",
            ("Evening Rush", "Heavy") => "Leave after 7:30 PM for lighter traffic",
            ("Lunch", _) => "12:00-1:00 PM is ideal for this route",
            ("Afternoon", _) => "2:00-4:00 PM offers moderate traffic",
            ("Late Morning", _) => "9:00-11:00 AM is a great window",
            ("Night", _) => "Light traffic, flexible timing",
            _ => "Flexible timing recommended"
        };
    }
}
