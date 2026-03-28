namespace RideShare.Api.DTOs;

public class CreateRideRequest
{
    public string Origin { get; set; } = string.Empty;
    public string Destination { get; set; } = string.Empty;
    public double? OriginLat { get; set; }
    public double? OriginLng { get; set; }
    public double? DestLat { get; set; }
    public double? DestLng { get; set; }
    public DateTime DepartureTime { get; set; }
    public bool HelmetProvided { get; set; }
    public string? Notes { get; set; }
}

public class UpdateRideRequest
{
    public string? Origin { get; set; }
    public string? Destination { get; set; }
    public DateTime? DepartureTime { get; set; }
    public bool? HelmetProvided { get; set; }
    public string? Notes { get; set; }
}

public class RideDto
{
    public Guid Id { get; set; }
    public Guid RiderId { get; set; }
    public string RiderName { get; set; } = string.Empty;
    public string? RiderPhone { get; set; }
    public string? RiderPhoto { get; set; }
    public string? MotorcycleModel { get; set; }
    public string? PlateNumber { get; set; }
    public decimal RiderRating { get; set; }
    public int RiderTotalRides { get; set; }
    public string Origin { get; set; } = string.Empty;
    public string Destination { get; set; } = string.Empty;
    public double? OriginLat { get; set; }
    public double? OriginLng { get; set; }
    public double? DestLat { get; set; }
    public double? DestLng { get; set; }
    public DateTime DepartureTime { get; set; }
    public bool HelmetProvided { get; set; }
    public string? Notes { get; set; }
    public string Status { get; set; } = string.Empty;
    public int RequestCount { get; set; }
    public DateTime CreatedAt { get; set; }
    // Accepted passenger info (for active rides)
    public Guid? PassengerId { get; set; }
    public string? PassengerName { get; set; }
    public string? PassengerPhone { get; set; }
    public string? PassengerPhoto { get; set; }
}

public class RideListDto
{
    public Guid Id { get; set; }
    public string RiderName { get; set; } = string.Empty;
    public string? RiderPhoto { get; set; }
    public decimal RiderRating { get; set; }
    public string Origin { get; set; } = string.Empty;
    public string Destination { get; set; } = string.Empty;
    public double? OriginLat { get; set; }
    public double? OriginLng { get; set; }
    public double? DestLat { get; set; }
    public double? DestLng { get; set; }
    public DateTime DepartureTime { get; set; }
    public bool HelmetProvided { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class CreateRideRequestDto
{
    public string? Message { get; set; }
    public string? PickupLocation { get; set; }
    public double? PickupLat { get; set; }
    public double? PickupLng { get; set; }
    public string? DropoffLocation { get; set; }
    public double? DropoffLat { get; set; }
    public double? DropoffLng { get; set; }
}

public class RideRequestDto
{
    public Guid Id { get; set; }
    public Guid RideId { get; set; }
    public Guid PassengerId { get; set; }
    public string PassengerName { get; set; } = string.Empty;
    public string? PassengerPhone { get; set; }
    public string? PassengerPhoto { get; set; }
    public string? Message { get; set; }
    public string? PickupLocation { get; set; }
    public double? PickupLat { get; set; }
    public double? PickupLng { get; set; }
    public string? DropoffLocation { get; set; }
    public double? DropoffLat { get; set; }
    public double? DropoffLng { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class MyRideRequestDto
{
    public Guid Id { get; set; }
    public Guid RideId { get; set; }
    public Guid RiderId { get; set; }
    public string RiderName { get; set; } = string.Empty;
    public string? RiderPhone { get; set; }
    public string Origin { get; set; } = string.Empty;
    public string Destination { get; set; } = string.Empty;
    public string? PickupLocation { get; set; }
    public double? PickupLat { get; set; }
    public double? PickupLng { get; set; }
    public string? DropoffLocation { get; set; }
    public double? DropoffLat { get; set; }
    public double? DropoffLng { get; set; }
    public DateTime DepartureTime { get; set; }
    public string? Message { get; set; }
    public string Status { get; set; } = string.Empty;
    public string RideStatus { get; set; } = string.Empty;
    public bool HasRated { get; set; } = false;
    public DateTime CreatedAt { get; set; }
}

public class RideSearchParams
{
    public string? Origin { get; set; }
    public string? Destination { get; set; }
    public DateTime? Date { get; set; }
    public bool? HelmetProvided { get; set; }
}

public class PassengerRideHistoryDto
{
    public Guid RideId { get; set; }
    public Guid RiderId { get; set; }
    public string RiderName { get; set; } = string.Empty;
    public string? RiderPhone { get; set; }
    public decimal RiderRating { get; set; }
    public string Origin { get; set; } = string.Empty;
    public string Destination { get; set; } = string.Empty;
    public DateTime DepartureTime { get; set; }
    public string RideStatus { get; set; } = string.Empty;
    public bool HelmetProvided { get; set; }
    public bool HasRated { get; set; }
    public int? MyRating { get; set; }
    public DateTime CompletedAt { get; set; }
}

public class StartRideRequest
{
    public double Lat { get; set; }
    public double Lng { get; set; }
}

public class UpdateLocationRequest
{
    public double Lat { get; set; }
    public double Lng { get; set; }
}

public class RideLocationDto
{
    public Guid RideId { get; set; }
    public string RiderName { get; set; } = string.Empty;
    public string? RiderPhone { get; set; }
    public string? VehicleNumber { get; set; }
    public string? VehicleModel { get; set; }
    public string Origin { get; set; } = string.Empty;
    public string Destination { get; set; } = string.Empty;
    public double? OriginLat { get; set; }
    public double? OriginLng { get; set; }
    public double? DestLat { get; set; }
    public double? DestLng { get; set; }
    public double? CurrentLat { get; set; }
    public double? CurrentLng { get; set; }
    public DateTime? LocationUpdatedAt { get; set; }
    public DateTime? StartedAt { get; set; }
    public string Status { get; set; } = string.Empty;
}

public class PopularRouteDto
{
    public string Origin { get; set; } = string.Empty;
    public string Destination { get; set; } = string.Empty;
    public double? OriginLat { get; set; }
    public double? OriginLng { get; set; }
    public double? DestLat { get; set; }
    public double? DestLng { get; set; }
    public int TotalRides { get; set; }
    public int CompletedRides { get; set; }
    public double PopularityScore { get; set; }
    public string PeakTimeSlot { get; set; } = string.Empty;
    public string TrafficLevel { get; set; } = string.Empty;
    public string RecommendedTime { get; set; } = string.Empty;
}

public class PopularRoutesResponse
{
    public List<PopularRouteDto> Routes { get; set; } = new();
    public string CurrentTimeSlot { get; set; } = string.Empty;
    public string CurrentTrafficLevel { get; set; } = string.Empty;
}

public class PendingRequestWithRideDto
{
    public Guid Id { get; set; }
    public Guid RideId { get; set; }
    public Guid PassengerId { get; set; }
    public string PassengerName { get; set; } = string.Empty;
    public string? PassengerPhone { get; set; }
    public string? PassengerPhoto { get; set; }
    public string? Message { get; set; }
    public string? PickupLocation { get; set; }
    public double? PickupLat { get; set; }
    public double? PickupLng { get; set; }
    public string? DropoffLocation { get; set; }
    public double? DropoffLat { get; set; }
    public double? DropoffLng { get; set; }
    public DateTime RequestedAt { get; set; }
    // Ride info
    public string RideOrigin { get; set; } = string.Empty;
    public string RideDestination { get; set; } = string.Empty;
    public double? RideOriginLat { get; set; }
    public double? RideOriginLng { get; set; }
    public double? RideDestLat { get; set; }
    public double? RideDestLng { get; set; }
    public DateTime DepartureTime { get; set; }
}
