using System.Text.Json;
using DocumentGenerator.Api.DTOs;
using DocumentGenerator.Api.Models;
using DocumentGenerator.Api.Repositories;

namespace DocumentGenerator.Api.Services;

public class TemplateService(TemplateRepository repository)
{
    private static TemplateResponse Response(DocumentTemplate t) => new(t.Id, t.Name, t.Type, t.Content, t.CreatedAt,
        t.LayoutJson is null ? null : JsonSerializer.Deserialize<LetterLayout>(t.LayoutJson), t.Category);

    private static string? SerializeLayout(LetterLayout? layout)
    {
        if (layout is null) return null;
        var json = JsonSerializer.Serialize(layout);
        if (json.Length > 10000) throw new ArgumentException("Die Briefbausteine sind insgesamt zu lang.");
        return json;
    }

    private static void Validate(CreateTemplateRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || request.Name.Length > 200)
            throw new ArgumentException("Der Vorlagenname muss 1 bis 200 Zeichen enthalten.");
        if (string.IsNullOrWhiteSpace(request.Category) || request.Category.Trim().Length > 80)
            throw new ArgumentException("Die Kategorie muss 1 bis 80 Zeichen enthalten.");
        if (!Enum.IsDefined(request.Type)) throw new ArgumentException("Ungültiger Dokumenttyp.");
        _ = new TemplateRenderer(request.Content);
        if (request.Layout is { } layout)
        {
            string[] texts = [layout.SenderName, layout.SenderStreet, layout.SenderPostalCode, layout.SenderCity, layout.SenderEmail, layout.SenderPhone, layout.RecipientName, layout.RecipientStreet, layout.RecipientPostalCode, layout.RecipientCity, layout.Subject, layout.Salutation, layout.ClosingText, layout.Closing, layout.Signature, layout.City, layout.Date, layout.Reference, layout.Footer];
            foreach (var text in texts)
                if (!string.IsNullOrWhiteSpace(text)) _ = new TemplateRenderer(text);
        }
    }

    public async Task<IReadOnlyList<TemplateResponse>> GetAllAsync(CancellationToken ct) =>
        (await repository.GetAllAsync(ct)).Select(Response).ToArray();

    public async Task<TemplateResponse?> GetByIdAsync(Guid id, CancellationToken ct)
    {
        var template = await repository.GetByIdAsync(id, ct);
        return template is null ? null : Response(template);
    }

    public async Task<TemplateResponse> CreateAsync(CreateTemplateRequest request, CancellationToken ct)
    {
        Validate(request);
        var template = new DocumentTemplate { Name = request.Name.Trim(), Category = request.Category.Trim(), Type = request.Type, Content = request.Content, LayoutJson = SerializeLayout(request.Layout) };
        return Response(await repository.AddAsync(template, ct));
    }

    public async Task<TemplateResponse?> UpdateAsync(Guid id, CreateTemplateRequest request, CancellationToken ct)
    {
        Validate(request);
        var template = await repository.UpdateAsync(id, request.Name.Trim(), request.Type, request.Content, SerializeLayout(request.Layout), request.Category.Trim(), ct);
        return template is null ? null : Response(template);
    }

    public Task<bool> DeleteAsync(Guid id, CancellationToken ct) => repository.DeleteAsync(id, ct);
}
