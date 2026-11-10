using System.Text.Json.Serialization;
using System.Security.Cryptography;
using System.Text;
using DocumentGenerator.Api.Data;
using DocumentGenerator.Api.Repositories;
using DocumentGenerator.Api.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers().AddJsonOptions(options =>
    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddOpenApi();
builder.Services.AddProblemDetails();
var frontendOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options => options.AddPolicy("Frontend", policy =>
{
    if (frontendOrigins.Length > 0)
        policy.WithOrigins(frontendOrigins).AllowAnyHeader().AllowAnyMethod();
}));
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(PostgresConnection.Normalize(builder.Configuration.GetConnectionString("Default"))));
builder.Services.AddScoped<TemplateRepository>();
builder.Services.AddScoped<TemplateService>();
builder.Services.AddScoped<DocumentService>();
builder.WebHost.ConfigureKestrel(options => options.Limits.MaxRequestBodySize = 1_000_000);
var app = builder.Build();
app.UseExceptionHandler();
app.UseCors("Frontend");
var requireAccessKey = builder.Configuration.GetValue<bool>("StudioAccess:Required") || builder.Configuration["RENDER"] == "true";
if (requireAccessKey)
{
    var accessKey = builder.Configuration["StudioAccess:Key"];
    if (string.IsNullOrWhiteSpace(accessKey) || accessKey.Length < 32)
        throw new InvalidOperationException("Set StudioAccess__Key to a random key of at least 32 characters.");
    var expected = SHA256.HashData(Encoding.UTF8.GetBytes("Bearer " + accessKey));
    app.Use(async (context, next) =>
    {
        if (context.Request.Path.StartsWithSegments("/api/templates") ||
            context.Request.Path.StartsWithSegments("/api/documents"))
        {
            context.Response.Headers.CacheControl = "no-store";
            var supplied = SHA256.HashData(Encoding.UTF8.GetBytes(context.Request.Headers.Authorization.ToString()));
            if (!CryptographicOperations.FixedTimeEquals(expected, supplied))
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                context.Response.Headers.WWWAuthenticate = "Bearer";
                return;
            }
        }
        await next(context);
    });
}
app.MapOpenApi();
app.MapControllers();
// Explicit local setup command; ordinary server startup never changes the schema.
if (args.Contains("--migrate"))
{
    using var scope = app.Services.CreateScope();
    await scope.ServiceProvider.GetRequiredService<AppDbContext>().Database.MigrateAsync();
    return;
}
app.Run();

// Enables in-process HTTP integration tests with WebApplicationFactory.
public partial class Program { }
