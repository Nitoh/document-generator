using System.ComponentModel.DataAnnotations;
using DocumentGenerator.Application;
using Microsoft.AspNetCore.Mvc;

namespace DocumentGenerator.Api.Controllers;

public sealed class GenerateDocumentRequest
{
    [Required, StringLength(20000)]
    public string Template { get; init; } = "";
    [Required]
    public Dictionary<string, string?> Values { get; init; } = new();
}

[ApiController]
[Route("api/documents")]
public sealed class DocumentsController(GenerateDocument generateDocument) : ControllerBase
{
    [HttpPost("generate")]
    public ActionResult<GeneratedDocument> Generate(GenerateDocumentRequest request)
    {
        try { return Ok(generateDocument.Execute(request.Template, request.Values)); }
        catch (ArgumentException exception)
        {
            return Problem(statusCode: 400, title: "Dokument konnte nicht erstellt werden", detail: exception.Message);
        }
    }
}
