using System.Text.Json;
using System.Text.Json.Serialization;
using System.Net;
using System.Net.Http.Json;
using DocumentGenerator.Api.Data;
using DocumentGenerator.Api.DTOs;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Xunit;

namespace DocumentGenerator.Api.Tests;

public sealed class PostgresFactAttribute : FactAttribute
{
    public PostgresFactAttribute()
    {
        if (string.IsNullOrEmpty(Environment.GetEnvironmentVariable("TEST_DATABASE_CONNECTION")))
            Skip = "Set TEST_DATABASE_CONNECTION to a dedicated PostgreSQL test database.";
    }
}

public sealed class PostgresApplication(string connection) : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder) => builder.ConfigureServices(services =>
    {
        services.RemoveAll<DbContextOptions<AppDbContext>>();
        services.RemoveAll<AppDbContext>();
        services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connection));
    });
}

public class TemplatePersistenceTests
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() }
    };
    [PostgresFact]
    public async Task TemplateCrudAndPersistenceAcrossApplicationRestart()
    {
        var connection = Environment.GetEnvironmentVariable("TEST_DATABASE_CONNECTION")!;
        Guid id;
        using (var app = new PostgresApplication(connection))
        {
            using var scope = app.Services.CreateScope();
            await scope.ServiceProvider.GetRequiredService<AppDbContext>().Database.MigrateAsync();
            using var client = app.CreateClient();
            var response = await client.PostAsJsonAsync("/api/templates", new { name = "Test " + Guid.NewGuid(), type = "Letter", content = "Hallo {{Name}}", layout = new { subject = "Testbetreff", senderName = "Nitoh" } });
            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
            var created = (await response.Content.ReadFromJsonAsync<TemplateResponse>(Json))!;
            id = created.Id;
            Assert.EndsWith(id.ToString(), response.Headers.Location!.ToString());
        }
        // A fresh app/DI container must still find the database row.
        using var restarted = new PostgresApplication(connection);
        using var next = restarted.CreateClient();
        try
        {
            var loaded = (await next.GetFromJsonAsync<TemplateResponse>($"/api/templates/{id}", Json))!;
            Assert.Equal("Hallo {{Name}}", loaded.Content);
            Assert.Equal("Testbetreff", loaded.Layout?.Subject);
            Assert.Equal("Nitoh", loaded.Layout?.SenderName);
            Assert.Contains((await next.GetFromJsonAsync<TemplateResponse[]>("/api/templates", Json))!, t => t.Id == id);
            var update = await next.PutAsJsonAsync($"/api/templates/{id}", new { name = "Geändert", type = "Reminder", content = "Guten Tag {{Name}}" });
            update.EnsureSuccessStatusCode();
            var changed = (await update.Content.ReadFromJsonAsync<TemplateResponse>(Json))!;
            Assert.Equal("Geändert", changed.Name);
            Assert.Equal(loaded.CreatedAt, changed.CreatedAt);
            Assert.Equal(HttpStatusCode.BadRequest, (await next.PostAsJsonAsync("/api/templates", new { name = " ", type = "Letter", content = "Hallo" })).StatusCode);
            Assert.Equal(HttpStatusCode.NotFound, (await next.GetAsync($"/api/templates/{Guid.NewGuid()}" )).StatusCode);
        }
        finally
        {
            Assert.Equal(HttpStatusCode.NoContent, (await next.DeleteAsync($"/api/templates/{id}")).StatusCode);
        }
        Assert.Equal(HttpStatusCode.NotFound, (await next.GetAsync($"/api/templates/{id}")).StatusCode);
    }
}
