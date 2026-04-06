using Microsoft.EntityFrameworkCore;
using RideShare.Api.Data;
using RideShare.Api.DTOs;
using RideShare.Core.Entities;

namespace RideShare.Api.Services;

public interface IPricingService
{
    Task<PricingSettingsDto> GetPricingSettingsAsync();
    Task<PricingSettingsDto> UpdatePricingSettingsAsync(Guid adminId, UpdatePricingSettingsRequest request);
    Task<FareCalculationResult> CalculateFareAsync(double originLat, double originLng, double destLat, double destLng);
    double CalculateDistanceKm(double lat1, double lng1, double lat2, double lng2);
}

public class PricingService : IPricingService
{
    private readonly RideShareDbContext _context;

    public PricingService(RideShareDbContext context)
    {
        _context = context;
    }

    public async Task<PricingSettingsDto> GetPricingSettingsAsync()
    {
        var settings = await GetOrCreateSettingsAsync();
        return MapToDto(settings);
    }

    public async Task<PricingSettingsDto> UpdatePricingSettingsAsync(Guid adminId, UpdatePricingSettingsRequest request)
    {
        var settings = await GetOrCreateSettingsAsync();

        if (request.BaseFare.HasValue)
            settings.BaseFare = request.BaseFare.Value;
        
        if (request.PerKmRate.HasValue)
            settings.PerKmRate = request.PerKmRate.Value;
        
        if (request.MinimumFare.HasValue)
            settings.MinimumFare = request.MinimumFare.Value;
        
        if (request.MaximumFare.HasValue)
            settings.MaximumFare = request.MaximumFare.Value;
        
        if (!string.IsNullOrWhiteSpace(request.Currency))
            settings.Currency = request.Currency.Trim().ToUpperInvariant();
        
        if (!string.IsNullOrWhiteSpace(request.CurrencySymbol))
            settings.CurrencySymbol = request.CurrencySymbol.Trim();
        
        if (request.IsEnabled.HasValue)
            settings.IsEnabled = request.IsEnabled.Value;
        
        if (request.PlatformFeePercent.HasValue)
        {
            if (request.PlatformFeePercent < 0 || request.PlatformFeePercent > 100)
                throw new ArgumentException("Platform fee must be between 0 and 100.");
            settings.PlatformFeePercent = request.PlatformFeePercent.Value;
        }

        settings.UpdatedAt = DateTime.UtcNow;
        settings.UpdatedByAdminId = adminId;

        await _context.SaveChangesAsync();
        return MapToDto(settings);
    }

    public async Task<FareCalculationResult> CalculateFareAsync(double originLat, double originLng, double destLat, double destLng)
    {
        var settings = await GetOrCreateSettingsAsync();
        
        var distanceKm = CalculateDistanceKm(originLat, originLng, destLat, destLng);
        
        if (!settings.IsEnabled)
        {
            return new FareCalculationResult
            {
                Fare = null,
                DistanceKm = Math.Round(distanceKm, 2),
                IsEnabled = false,
                Currency = settings.Currency,
                CurrencySymbol = settings.CurrencySymbol,
                DisplayText = "Fare to negotiate"
            };
        }

        // Calculate: BaseFare + (distance * PerKmRate)
        var calculatedFare = settings.BaseFare + ((decimal)distanceKm * settings.PerKmRate);
        
        // Apply minimum
        calculatedFare = Math.Max(calculatedFare, settings.MinimumFare);
        
        // Apply maximum cap (if set)
        if (settings.MaximumFare > 0)
            calculatedFare = Math.Min(calculatedFare, settings.MaximumFare);
        
        // Round to 2 decimal places
        calculatedFare = Math.Round(calculatedFare, 2);

        return new FareCalculationResult
        {
            Fare = calculatedFare,
            DistanceKm = Math.Round(distanceKm, 2),
            IsEnabled = true,
            Currency = settings.Currency,
            CurrencySymbol = settings.CurrencySymbol,
            DisplayText = $"{settings.CurrencySymbol}{calculatedFare:N2}"
        };
    }

    /// <summary>
    /// Calculate distance between two coordinates using Haversine formula.
    /// </summary>
    public double CalculateDistanceKm(double lat1, double lng1, double lat2, double lng2)
    {
        const double EarthRadiusKm = 6371.0;

        var dLat = ToRadians(lat2 - lat1);
        var dLng = ToRadians(lng2 - lng1);

        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                Math.Sin(dLng / 2) * Math.Sin(dLng / 2);

        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

        return EarthRadiusKm * c;
    }

    private static double ToRadians(double degrees) => degrees * Math.PI / 180.0;

    private async Task<PricingSettings> GetOrCreateSettingsAsync()
    {
        var settings = await _context.PricingSettings.FirstOrDefaultAsync(s => s.Id == 1);
        
        if (settings == null)
        {
            settings = new PricingSettings { Id = 1 };
            _context.PricingSettings.Add(settings);
            await _context.SaveChangesAsync();
        }

        return settings;
    }

    private static PricingSettingsDto MapToDto(PricingSettings settings)
    {
        return new PricingSettingsDto
        {
            BaseFare = settings.BaseFare,
            PerKmRate = settings.PerKmRate,
            MinimumFare = settings.MinimumFare,
            MaximumFare = settings.MaximumFare,
            Currency = settings.Currency,
            CurrencySymbol = settings.CurrencySymbol,
            IsEnabled = settings.IsEnabled,
            PlatformFeePercent = settings.PlatformFeePercent,
            UpdatedAt = settings.UpdatedAt
        };
    }
}

public class FareCalculationResult
{
    public decimal? Fare { get; set; }
    public double DistanceKm { get; set; }
    public bool IsEnabled { get; set; }
    public string Currency { get; set; } = "PHP";
    public string CurrencySymbol { get; set; } = "₱";
    public string DisplayText { get; set; } = string.Empty;
}
