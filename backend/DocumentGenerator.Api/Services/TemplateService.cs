using DocumentGenerator.Api.DTOs;
using DocumentGenerator.Api.Models;
using DocumentGenerator.Api.Repositories;

namespace DocumentGenerator.Api.Services;

public class TemplateService(TemplateRepository repository)
{
    private static TemplateResponse Response(DocumentTemplate t) => new(t.Id, t.Name, t.Type, t.Content, t.CreatedAt);

    private static void Validate(CreateTemplateRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || request.Name.Length > 200)
            throw new ArgumentException("Der Vorlagenname muss 1 bis 200 Zeichen enthalten.");
        if (!Enum.IsDefined(request.Type)) throw new ArgumentException("Ungültiger Dokumenttyp.");
        _ = new TemplateRenderer(request.Content);
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
        var template = new DocumentTemplate { Name = request.Name.Trim(), Type = request.Type, Content = request.Content };
        return Response(await repository.AddAsync(template, ct));
    }

    public async Task<TemplateResponse?> UpdateAsync(Guid id, CreateTemplateRequest request, CancellationToken ct)
    {
        Validate(request);
        var template = await repository.UpdateAsync(id, request.Name.Trim(), request.Type, request.Content, ct);
        return template is null ? null : Response(template);
    }

    public Task<bool> DeleteAsync(Guid id, CancellationToken ct) => repository.DeleteAsync(id, ct);
}
