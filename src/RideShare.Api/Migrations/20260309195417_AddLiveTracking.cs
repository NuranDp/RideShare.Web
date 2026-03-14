using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RideShare.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddLiveTracking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "CurrentLat",
                table: "Rides",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "CurrentLng",
                table: "Rides",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LocationUpdatedAt",
                table: "Rides",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "StartedAt",
                table: "Rides",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CurrentLat",
                table: "Rides");

            migrationBuilder.DropColumn(
                name: "CurrentLng",
                table: "Rides");

            migrationBuilder.DropColumn(
                name: "LocationUpdatedAt",
                table: "Rides");

            migrationBuilder.DropColumn(
                name: "StartedAt",
                table: "Rides");
        }
    }
}
