using DocumentGenerator.Api.DTOs;

namespace DocumentGenerator.Api.Services;

public sealed class DocumentService
{
    public GeneratedDocumentResponse Generate(GenerateDocumentRequest request)
    {
        var template = new TemplateRenderer(request.Template);
        return new GeneratedDocumentResponse(template.Render(request.Values), template.Fields);
    }
}
