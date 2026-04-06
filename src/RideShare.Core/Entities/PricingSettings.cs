namespace RideShare.Core.Entities;

/// <summary>
/// Singleton configuration for ride pricing.
/// Only one row exists - use Id = 1 as the singleton key.
/// </summary>
public class PricingSettings
{
    public int Id { get; set; } = 1; // Singleton ID
    
    /// <summary>
    /// Base fare charged for every ride (flat fee)
    /// </summary>
    public decimal BaseFare { get; set; } = 20.00m;
    
    /// <summary>
    /// Rate charged per kilometer
    /// </summary>
    public decimal PerKmRate { get; set; } = 5.00m;
    
    /// <summary>
    /// Minimum fare regardless of distance
    /// </summary>
    public decimal MinimumFare { get; set; } = 25.00m;
    
    /// <summary>
    /// Maximum fare cap (0 = no cap)
    /// </summary>
    public decimal MaximumFare { get; set; } = 500.00m;
    
    /// <summary>
    /// Currency code (e.g., "PHP", "USD")
    /// </summary>
    public string Currency { get; set; } = "PHP";
    
    /// <summary>
    /// Currency symbol for display (e.g., "₱", "$")
    /// </summary>
    public string CurrencySymbol { get; set; } = "₱";
    
    /// <summary>
    /// Whether pricing is enabled. If disabled, rides show "Negotiate" instead of fare.
    /// </summary>
    public bool IsEnabled { get; set; } = true;
    
    /// <summary>
    /// Platform fee percentage (0-100). Deducted from rider earnings.
    /// </summary>
    public decimal PlatformFeePercent { get; set; } = 10.00m;
    
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public Guid? UpdatedByAdminId { get; set; }
    
    // Navigation
    public User? UpdatedByAdmin { get; set; }
}
