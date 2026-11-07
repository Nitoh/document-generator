using System.Net;
using System.Net.Http.Json;
using DocumentGenerator.Api.DTOs;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace DocumentGenerator.Api.Tests;

public class ApiTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient client;
    public ApiTests(WebApplicationFactory<Program> app) => client = app.CreateClient();

    [Fact]
    public async Task HealthRespondsAndWrongVerbIsRejected()
    {
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/health")).StatusCode);
        Assert.Equal(HttpStatusCode.MethodNotAllowed, (await client.PostAsync("/api/health", null)).StatusCode);
    }

    [Fact]
    public async Task DocumentsUseServiceAndReturnJson()
    {
        var response = await client.PostAsJsonAsync("/api/documents/generate", new { template = "Hallo {{Name}}", values = new Dictionary<string, string> { ["Name"] = "Erika" } });
        response.EnsureSuccessStatusCode();
        Assert.Equal("application/json", response.Content.Headers.ContentType?.MediaType);
        Assert.Equal("Hallo Erika", (await response.Content.ReadFromJsonAsync<GeneratedDocumentResponse>())!.Content);
    }

    [Theory]
    [InlineData("{{Name}}")]
    [InlineData("{{bad-name}}")]
    [InlineData("")]
    public async Task InvalidDocumentsReturn400(string template)
    {
        var response = await client.PostAsJsonAsync("/api/documents/generate", new { template, values = new { } });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task NullValuesReturn400()
    {
        var response = await client.PostAsJsonAsync("/api/documents/generate", new { template = "Hallo", values = (object?)null });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
