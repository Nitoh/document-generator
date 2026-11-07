using System.Text.Json.Serialization;
using DocumentGenerator.Api.Data;
using DocumentGenerator.Api.Repositories;
using DocumentGenerator.Api.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers().AddJsonOptions(options =>
    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddOpenApi();
builder.Services.AddProblemDetails();
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Default")));
builder.Services.AddScoped<TemplateRepository>();
builder.Services.AddScoped<TemplateService>();
builder.Services.AddScoped<GenerateDocument>();
builder.WebHost.ConfigureKestrel(options => options.Limits.MaxRequestBodySize = 1_000_000);
var app = builder.Build();
app.UseExceptionHandler();
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
