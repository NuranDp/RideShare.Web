using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RideShare.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddPerformanceIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Rides_DepartureTime",
                table: "Rides",
                column: "DepartureTime");

            migrationBuilder.CreateIndex(
                name: "IX_Rides_Status",
                table: "Rides",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Rides_Status_DepartureTime",
                table: "Rides",
                columns: new[] { "Status", "DepartureTime" });

            migrationBuilder.CreateIndex(
                name: "IX_RideRequests_RideId_Status",
                table: "RideRequests",
                columns: new[] { "RideId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_RideRequests_Status",
                table: "RideRequests",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Rides_DepartureTime",
                table: "Rides");

            migrationBuilder.DropIndex(
                name: "IX_Rides_Status",
                table: "Rides");

            migrationBuilder.DropIndex(
                name: "IX_Rides_Status_DepartureTime",
                table: "Rides");

            migrationBuilder.DropIndex(
                name: "IX_RideRequests_RideId_Status",
                table: "RideRequests");

            migrationBuilder.DropIndex(
                name: "IX_RideRequests_Status",
                table: "RideRequests");
        }
    }
}
