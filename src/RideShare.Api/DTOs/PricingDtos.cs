namespace RideShare.Api.DTOs;

public class PricingSettingsDto
{
    public decimal BaseFare { get; set; }
    public decimal PerKmRate { get; set; }
    public decimal MinimumFare { get; set; }
    public decimal MaximumFare { get; set; }
    public string Currency { get; set; } = "PHP";
    public string CurrencySymbol { get; set; } = "₱";
    public bool IsEnabled { get; set; }
    public decimal PlatformFeePercent { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class UpdatePricingSettingsRequest
{
    public decimal? BaseFare { get; set; }
    public decimal? PerKmRate { get; set; }
    public decimal? MinimumFare { get; set; }
    public decimal? MaximumFare { get; set; }
    public string? Currency { get; set; }
    public string? CurrencySymbol { get; set; }
    public bool? IsEnabled { get; set; }
    public decimal? PlatformFeePercent { get; set; }
}

public class FareCalculationRequest
{
    public double OriginLat { get; set; }
    public double OriginLng { get; set; }
    public double DestLat { get; set; }
    public double DestLng { get; set; }
}

public class FareCalculationResponse
{
    public decimal? Fare { get; set; }
    public double DistanceKm { get; set; }
    public bool IsEnabled { get; set; }
    public string Currency { get; set; } = "PHP";
    public string CurrencySymbol { get; set; } = "₱";
    public string DisplayText { get; set; } = string.Empty;
}
