using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RideShare.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddOnDemandRequests : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "OnDemandRequests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    PassengerId = table.Column<Guid>(type: "uuid", nullable: false),
                    PickupLocation = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    PickupLat = table.Column<double>(type: "double precision", nullable: false),
                    PickupLng = table.Column<double>(type: "double precision", nullable: false),
                    DropoffLocation = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    DropoffLat = table.Column<double>(type: "double precision", nullable: false),
                    DropoffLng = table.Column<double>(type: "double precision", nullable: false),
                    RequestedTime = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    AcceptedRiderId = table.Column<Guid>(type: "uuid", nullable: true),
                    AcceptedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    RideId = table.Column<Guid>(type: "uuid", nullable: true),
                    Message = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OnDemandRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OnDemandRequests_Rides_RideId",
                        column: x => x.RideId,
                        principalTable: "Rides",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_OnDemandRequests_Users_AcceptedRiderId",
                        column: x => x.AcceptedRiderId,
                        principalTable: "Users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_OnDemandRequests_Users_PassengerId",
                        column: x => x.PassengerId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_OnDemandRequests_AcceptedRiderId",
                table: "OnDemandRequests",
                column: "AcceptedRiderId");

            migrationBuilder.CreateIndex(
                name: "IX_OnDemandRequests_ExpiresAt",
                table: "OnDemandRequests",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_OnDemandRequests_PassengerId",
                table: "OnDemandRequests",
                column: "PassengerId");

            migrationBuilder.CreateIndex(
                name: "IX_OnDemandRequests_RideId",
                table: "OnDemandRequests",
                column: "RideId");

            migrationBuilder.CreateIndex(
                name: "IX_OnDemandRequests_Status",
                table: "OnDemandRequests",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "OnDemandRequests");
        }
    }
}
