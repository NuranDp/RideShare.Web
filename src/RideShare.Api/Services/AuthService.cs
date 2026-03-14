using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using RideShare.Api.Configuration;
using RideShare.Api.Data;
using RideShare.Api.DTOs;
using RideShare.Core.Entities;

namespace RideShare.Api.Services;

public interface IAuthService
{
    Task<AuthResponse?> RegisterAsync(RegisterRequest request);
    Task<AuthResponse?> LoginAsync(LoginRequest request);
    Task<UserDto?> GetCurrentUserAsync(Guid userId);
    Task<UserDto?> UpdateProfileAsync(Guid userId, UpdateProfileRequest request);
    Task<UserDto?> UpdateEmergencyContactAsync(Guid userId, UpdateEmergencyContactRequest request);
}

public class AuthService : IAuthService
{
    private readonly RideShareDbContext _context;
    private readonly JwtSettings _jwtSettings;

    public AuthService(RideShareDbContext context, IOptions<JwtSettings> jwtSettings)
    {
        _context = context;
        _jwtSettings = jwtSettings.Value;
    }

    public async Task<AuthResponse?> RegisterAsync(RegisterRequest request)
    {
        // Check if email already exists
        if (await _context.Users.AnyAsync(u => u.Email == request.Email))
        {
            return null;
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            FullName = request.FullName,
            Phone = request.Phone,
            Role = request.Role,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);

        // If registering as Rider, create RiderProfile
        if (request.Role == UserRole.Rider)
        {
            var riderProfile = new RiderProfile
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                CreatedAt = DateTime.UtcNow
            };
            _context.RiderProfiles.Add(riderProfile);
        }

        await _context.SaveChangesAsync();

        var token = GenerateJwtToken(user);
        return new AuthResponse
        {
            Token = token,
            User = MapToUserDto(user)
        };
    }

    public async Task<AuthResponse?> LoginAsync(LoginRequest request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);

        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return null;
        }

        if (!user.IsActive)
        {
            return null;
        }

        var token = GenerateJwtToken(user);
        return new AuthResponse
        {
            Token = token,
            User = MapToUserDto(user)
        };
    }

    public async Task<UserDto?> GetCurrentUserAsync(Guid userId)
    {
        var user = await _context.Users.FindAsync(userId);
        return user != null ? MapToUserDto(user) : null;
    }

    public async Task<UserDto?> UpdateProfileAsync(Guid userId, UpdateProfileRequest request)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return null;

        if (!string.IsNullOrEmpty(request.FullName))
            user.FullName = request.FullName;

        if (request.Phone != null)
            user.Phone = request.Phone;

        if (request.ProfilePhotoUrl != null)
            user.ProfilePhotoUrl = request.ProfilePhotoUrl;

        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return MapToUserDto(user);
    }

    public async Task<UserDto?> UpdateEmergencyContactAsync(Guid userId, UpdateEmergencyContactRequest request)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return null;

        user.EmergencyContactName = request.Name;
        user.EmergencyContactPhone = request.Phone;
        user.EmergencyContactRelation = request.Relation;
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapToUserDto(user);
    }

    private string GenerateJwtToken(User user)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.FullName),
            new Claim(ClaimTypes.Role, user.Role.ToString())
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.SecretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _jwtSettings.Issuer,
            audience: _jwtSettings.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_jwtSettings.ExpirationInMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static UserDto MapToUserDto(User user)
    {
        return new UserDto
        {
            Id = user.Id,
            Email = user.Email,
            FullName = user.FullName,
            Phone = user.Phone,
            ProfilePhotoUrl = user.ProfilePhotoUrl,
            Role = user.Role.ToString(),
            IsActive = user.IsActive,
            EmergencyContact = new EmergencyContactDto
            {
                Name = user.EmergencyContactName,
                Phone = user.EmergencyContactPhone,
                Relation = user.EmergencyContactRelation
            },
            CreatedAt = user.CreatedAt
        };
    }
}
