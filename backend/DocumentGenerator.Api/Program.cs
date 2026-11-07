using DocumentGenerator.Application;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();
builder.Services.AddScoped<GenerateDocument>();
builder.WebHost.ConfigureKestrel(options => options.Limits.MaxRequestBodySize = 1_000_000);
var app = builder.Build();
app.UseDefaultFiles();
app.UseStaticFiles();
app.MapControllers();
app.Run();
