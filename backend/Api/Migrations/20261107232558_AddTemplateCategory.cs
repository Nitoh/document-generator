using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DocumentGenerator.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddTemplateCategory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Category",
                table: "Templates",
                type: "character varying(80)",
                maxLength: 80,
                nullable: false,
                defaultValue: "Allgemeines");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Category",
                table: "Templates");
        }
    }
}
