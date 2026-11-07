using DocumentGenerator.Api.DTOs;
using DocumentGenerator.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace DocumentGenerator.Api.Controllers;

[ApiController]
[Route("api/documents")]
public sealed class DocumentsController(DocumentService documents) : ControllerBase
{
    [HttpPost("generate")]
    public ActionResult<GeneratedDocumentResponse> Generate(GenerateDocumentRequest request)
    {
        try
        {
            return Ok(documents.Generate(request));
        }
        catch (ArgumentException exception)
        {
            return Problem(statusCode: 400, title: "Dokument konnte nicht erstellt werden", detail: exception.Message);
        }
    }
}
