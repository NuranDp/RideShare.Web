using Microsoft.EntityFrameworkCore;
using RideShare.Core.Entities;

namespace RideShare.Api.Data;

public class RideShareDbContext : DbContext
{
    public RideShareDbContext(DbContextOptions<RideShareDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<RiderProfile> RiderProfiles => Set<RiderProfile>();
    public DbSet<Ride> Rides => Set<Ride>();
    public DbSet<RideRequest> RideRequests => Set<RideRequest>();
    public DbSet<Rating> Ratings => Set<Rating>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasDefaultValueSql("NEWID()");
            entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.PasswordHash).IsRequired();
            entity.Property(e => e.FullName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Phone).HasMaxLength(20);
            entity.Property(e => e.ProfilePhotoUrl).HasMaxLength(500);
            entity.Property(e => e.Role).HasConversion<string>().HasMaxLength(20);
            entity.Property(e => e.EmergencyContactName).HasMaxLength(100);
            entity.Property(e => e.EmergencyContactPhone).HasMaxLength(20);
            entity.Property(e => e.EmergencyContactRelation).HasMaxLength(50);
        });

        // RiderProfile configuration
        modelBuilder.Entity<RiderProfile>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasDefaultValueSql("NEWID()");
            entity.Property(e => e.LicenseNumber).HasMaxLength(50);
            entity.Property(e => e.LicenseImageUrl).HasMaxLength(500);
            entity.Property(e => e.MotorcycleModel).HasMaxLength(100);
            entity.Property(e => e.PlateNumber).HasMaxLength(20);
            entity.Property(e => e.AverageRating).HasPrecision(3, 2);

            entity.HasOne(e => e.User)
                .WithOne(u => u.RiderProfile)
                .HasForeignKey<RiderProfile>(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.VerifiedByAdmin)
                .WithMany()
                .HasForeignKey(e => e.VerifiedByAdminId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasIndex(e => e.UserId).IsUnique();
        });

        // Ride configuration
        modelBuilder.Entity<Ride>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasDefaultValueSql("NEWID()");
            entity.Property(e => e.Origin).IsRequired().HasMaxLength(255);
            entity.Property(e => e.Destination).IsRequired().HasMaxLength(255);
            entity.Property(e => e.Notes).HasMaxLength(500);
            entity.Property(e => e.Status).HasConversion<string>().HasMaxLength(20);

            entity.HasOne(e => e.Rider)
                .WithMany(u => u.PostedRides)
                .HasForeignKey(e => e.RiderId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // RideRequest configuration
        modelBuilder.Entity<RideRequest>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasDefaultValueSql("NEWID()");
            entity.Property(e => e.Status).HasConversion<string>().HasMaxLength(20);
            entity.Property(e => e.Message).HasMaxLength(500);

            entity.HasOne(e => e.Ride)
                .WithMany(r => r.Requests)
                .HasForeignKey(e => e.RideId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Passenger)
                .WithMany(u => u.RideRequests)
                .HasForeignKey(e => e.PassengerId)
                .OnDelete(DeleteBehavior.NoAction); // Prevent cascade cycle
        });

        // Rating configuration
        modelBuilder.Entity<Rating>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasDefaultValueSql("NEWID()");
            entity.Property(e => e.Score).IsRequired();
            entity.Property(e => e.Comment).HasMaxLength(500);

            entity.HasOne(e => e.Ride)
                .WithMany()
                .HasForeignKey(e => e.RideId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(e => e.Rider)
                .WithMany()
                .HasForeignKey(e => e.RiderId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(e => e.Passenger)
                .WithMany()
                .HasForeignKey(e => e.PassengerId)
                .OnDelete(DeleteBehavior.NoAction);

            // One rating per passenger per ride
            entity.HasIndex(e => new { e.RideId, e.PassengerId }).IsUnique();
        });

        // Seed admin user with static values (required by EF Core for seeding)
        var adminId = Guid.Parse("00000000-0000-0000-0000-000000000001");
        modelBuilder.Entity<User>().HasData(new User
        {
            Id = adminId,
            Email = "admin@rideshare.com",
            // Pre-computed hash for "Admin@123"
            PasswordHash = "$2a$11$K0GyK.A0L1qJK8VuWJYQO.KJ8gPq4PKjX5l2V9hPJQZkKJ8kP0Wau",
            FullName = "System Admin",
            Role = UserRole.Admin,
            IsActive = true,
            CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        });
    }
}
