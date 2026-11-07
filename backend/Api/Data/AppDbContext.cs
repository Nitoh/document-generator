using DocumentGenerator.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace DocumentGenerator.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<DocumentTemplate> Templates => Set<DocumentTemplate>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var template = modelBuilder.Entity<DocumentTemplate>();
        template.Property(t => t.Name).HasMaxLength(200).IsRequired();
        template.Property(t => t.Content).HasMaxLength(20000).IsRequired();
        template.Property(t => t.LayoutJson).HasMaxLength(10000);
        template.HasIndex(t => t.CreatedAt);
    }
}
