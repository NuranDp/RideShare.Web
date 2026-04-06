using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace RideShare.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddPricingSystem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "EstimatedDistanceKm",
                table: "Rides",
                type: "numeric(10,2)",
                precision: 10,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Fare",
                table: "Rides",
                type: "numeric(10,2)",
                precision: 10,
                scale: 2,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "PricingSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    BaseFare = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    PerKmRate = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    MinimumFare = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    MaximumFare = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    Currency = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    CurrencySymbol = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: false),
                    IsEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    PlatformFeePercent = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedByAdminId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PricingSettings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PricingSettings_Users_UpdatedByAdminId",
                        column: x => x.UpdatedByAdminId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.InsertData(
                table: "PricingSettings",
                columns: new[] { "Id", "BaseFare", "Currency", "CurrencySymbol", "IsEnabled", "MaximumFare", "MinimumFare", "PerKmRate", "PlatformFeePercent", "UpdatedAt", "UpdatedByAdminId" },
                values: new object[] { 1, 20.00m, "PHP", "₱", true, 500.00m, 25.00m, 5.00m, 10.00m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null });

            migrationBuilder.CreateIndex(
                name: "IX_PricingSettings_UpdatedByAdminId",
                table: "PricingSettings",
                column: "UpdatedByAdminId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PricingSettings");

            migrationBuilder.DropColumn(
                name: "EstimatedDistanceKm",
                table: "Rides");

            migrationBuilder.DropColumn(
                name: "Fare",
                table: "Rides");
        }
    }
}
