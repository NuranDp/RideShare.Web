using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RideShare.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddPickupDropoffToRideRequest : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "DropoffLat",
                table: "RideRequests",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "DropoffLng",
                table: "RideRequests",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DropoffLocation",
                table: "RideRequests",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "PickupLat",
                table: "RideRequests",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "PickupLng",
                table: "RideRequests",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PickupLocation",
                table: "RideRequests",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DropoffLat",
                table: "RideRequests");

            migrationBuilder.DropColumn(
                name: "DropoffLng",
                table: "RideRequests");

            migrationBuilder.DropColumn(
                name: "DropoffLocation",
                table: "RideRequests");

            migrationBuilder.DropColumn(
                name: "PickupLat",
                table: "RideRequests");

            migrationBuilder.DropColumn(
                name: "PickupLng",
                table: "RideRequests");

            migrationBuilder.DropColumn(
                name: "PickupLocation",
                table: "RideRequests");
        }
    }
}
