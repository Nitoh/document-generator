

namespace DocumentGenerator.Api.Services;

public sealed record GeneratedDocument(string Content, IReadOnlyList<string> Fields);

public sealed class GenerateDocument
{
    public GeneratedDocument Execute(string template, IReadOnlyDictionary<string, string?> values)
    {
        var document = new TemplateRenderer(template);
        return new GeneratedDocument(document.Render(values), document.Fields);
    }
}
