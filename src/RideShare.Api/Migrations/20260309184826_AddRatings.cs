using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RideShare.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddRatings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Ratings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWID()"),
                    RideId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RiderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PassengerId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Score = table.Column<int>(type: "int", nullable: false),
                    Comment = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Ratings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Ratings_Rides_RideId",
                        column: x => x.RideId,
                        principalTable: "Rides",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Ratings_Users_PassengerId",
                        column: x => x.PassengerId,
                        principalTable: "Users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Ratings_Users_RiderId",
                        column: x => x.RiderId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Ratings_PassengerId",
                table: "Ratings",
                column: "PassengerId");

            migrationBuilder.CreateIndex(
                name: "IX_Ratings_RideId_PassengerId",
                table: "Ratings",
                columns: new[] { "RideId", "PassengerId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Ratings_RiderId",
                table: "Ratings",
                column: "RiderId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Ratings");
        }
    }
}
