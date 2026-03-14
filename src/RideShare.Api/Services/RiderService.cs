using Microsoft.EntityFrameworkCore;
using RideShare.Api.Data;
using RideShare.Api.DTOs;
using RideShare.Core.Entities;

namespace RideShare.Api.Services;

public interface IRiderService
{
    Task<RiderProfileDto?> GetMyProfileAsync(Guid userId);
    Task<RiderProfileDto?> UpdateProfileAsync(Guid userId, UpdateRiderProfileRequest request);
    Task<RiderProfileDto?> SubmitLicenseAsync(Guid userId, SubmitLicenseRequest request);
    Task<PublicRiderProfileDto?> GetPublicProfileAsync(Guid riderId);
    Task<List<LicenseVerificationDto>> GetPendingLicenseRequestsAsync();
    Task<bool> ApproveLicenseAsync(Guid riderProfileId, Guid adminId);
    Task<bool> RejectLicenseAsync(Guid riderProfileId);
}

public class RiderService : IRiderService
{
    private readonly RideShareDbContext _context;

    public RiderService(RideShareDbContext context)
    {
        _context = context;
    }

    public async Task<RiderProfileDto?> GetMyProfileAsync(Guid userId)
    {
        var profile = await _context.RiderProfiles
            .FirstOrDefaultAsync(rp => rp.UserId == userId);

        if (profile == null) return null;

        return MapToRiderProfileDto(profile);
    }

    public async Task<RiderProfileDto?> UpdateProfileAsync(Guid userId, UpdateRiderProfileRequest request)
    {
        var profile = await _context.RiderProfiles
            .FirstOrDefaultAsync(rp => rp.UserId == userId);

        if (profile == null) return null;

        if (request.MotorcycleModel != null)
            profile.MotorcycleModel = request.MotorcycleModel;

        if (request.PlateNumber != null)
            profile.PlateNumber = request.PlateNumber;

        profile.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return MapToRiderProfileDto(profile);
    }

    public async Task<RiderProfileDto?> SubmitLicenseAsync(Guid userId, SubmitLicenseRequest request)
    {
        var profile = await _context.RiderProfiles
            .FirstOrDefaultAsync(rp => rp.UserId == userId);

        if (profile == null) return null;

        // Reset verification status when submitting new license
        profile.LicenseNumber = request.LicenseNumber;
        profile.LicenseImageUrl = request.LicenseImageUrl;
        profile.LicenseExpiryDate = request.LicenseExpiryDate;
        profile.IsLicenseVerified = false;
        profile.VerifiedAt = null;
        profile.VerifiedByAdminId = null;
        profile.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapToRiderProfileDto(profile);
    }

    public async Task<PublicRiderProfileDto?> GetPublicProfileAsync(Guid riderId)
    {
        var user = await _context.Users
            .Include(u => u.RiderProfile)
            .FirstOrDefaultAsync(u => u.Id == riderId && u.Role == UserRole.Rider);

        if (user?.RiderProfile == null) return null;

        return new PublicRiderProfileDto
        {
            UserId = user.Id,
            FullName = user.FullName,
            ProfilePhotoUrl = user.ProfilePhotoUrl,
            IsLicenseVerified = user.RiderProfile.IsLicenseVerified,
            MotorcycleModel = user.RiderProfile.MotorcycleModel,
            TotalRides = user.RiderProfile.TotalRides,
            AverageRating = user.RiderProfile.AverageRating,
            MemberSince = user.CreatedAt
        };
    }

    public async Task<List<LicenseVerificationDto>> GetPendingLicenseRequestsAsync()
    {
        var pendingProfiles = await _context.RiderProfiles
            .Include(rp => rp.User)
            .Where(rp => rp.LicenseNumber != null 
                && rp.LicenseImageUrl != null 
                && !rp.IsLicenseVerified)
            .OrderBy(rp => rp.UpdatedAt ?? rp.CreatedAt)
            .ToListAsync();

        return pendingProfiles.Select(rp => new LicenseVerificationDto
        {
            Id = rp.Id,
            UserId = rp.UserId,
            RiderName = rp.User.FullName,
            RiderEmail = rp.User.Email,
            LicenseNumber = rp.LicenseNumber,
            LicenseImageUrl = rp.LicenseImageUrl,
            LicenseExpiryDate = rp.LicenseExpiryDate,
            MotorcycleModel = rp.MotorcycleModel,
            PlateNumber = rp.PlateNumber,
            SubmittedAt = rp.UpdatedAt ?? rp.CreatedAt
        }).ToList();
    }

    public async Task<bool> ApproveLicenseAsync(Guid riderProfileId, Guid adminId)
    {
        var profile = await _context.RiderProfiles.FindAsync(riderProfileId);
        if (profile == null) return false;

        profile.IsLicenseVerified = true;
        profile.VerifiedAt = DateTime.UtcNow;
        profile.VerifiedByAdminId = adminId;
        profile.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RejectLicenseAsync(Guid riderProfileId)
    {
        var profile = await _context.RiderProfiles.FindAsync(riderProfileId);
        if (profile == null) return false;

        // Clear license info on rejection so they can resubmit
        profile.LicenseNumber = null;
        profile.LicenseImageUrl = null;
        profile.LicenseExpiryDate = null;
        profile.IsLicenseVerified = false;
        profile.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    private static RiderProfileDto MapToRiderProfileDto(RiderProfile profile)
    {
        return new RiderProfileDto
        {
            Id = profile.Id,
            UserId = profile.UserId,
            LicenseNumber = profile.LicenseNumber,
            LicenseImageUrl = profile.LicenseImageUrl,
            LicenseExpiryDate = profile.LicenseExpiryDate,
            IsLicenseVerified = profile.IsLicenseVerified,
            VerifiedAt = profile.VerifiedAt,
            MotorcycleModel = profile.MotorcycleModel,
            PlateNumber = profile.PlateNumber,
            TotalRides = profile.TotalRides,
            TotalRatings = profile.TotalRatings,
            AverageRating = profile.AverageRating,
            CreatedAt = profile.CreatedAt
        };
    }
}
