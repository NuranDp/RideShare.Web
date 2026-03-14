using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RideShare.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddRideCoordinates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "DestLat",
                table: "Rides",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "DestLng",
                table: "Rides",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "OriginLat",
                table: "Rides",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "OriginLng",
                table: "Rides",
                type: "float",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DestLat",
                table: "Rides");

            migrationBuilder.DropColumn(
                name: "DestLng",
                table: "Rides");

            migrationBuilder.DropColumn(
                name: "OriginLat",
                table: "Rides");

            migrationBuilder.DropColumn(
                name: "OriginLng",
                table: "Rides");
        }
    }
}
