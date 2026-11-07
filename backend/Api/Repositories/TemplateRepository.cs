using DocumentGenerator.Api.Data;
using DocumentGenerator.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace DocumentGenerator.Api.Repositories;

public class TemplateRepository(AppDbContext db)
{
    public Task<List<DocumentTemplate>> GetAllAsync(CancellationToken ct) =>
        db.Templates.AsNoTracking().OrderByDescending(t => t.CreatedAt).ThenBy(t => t.Id).ToListAsync(ct);

    public Task<DocumentTemplate?> GetByIdAsync(Guid id, CancellationToken ct) =>
        db.Templates.AsNoTracking().FirstOrDefaultAsync(t => t.Id == id, ct);

    public async Task<DocumentTemplate> AddAsync(DocumentTemplate template, CancellationToken ct)
    {
        db.Templates.Add(template);
        await db.SaveChangesAsync(ct);
        return template;
    }

    public async Task<DocumentTemplate?> UpdateAsync(Guid id, string name, DocumentType type, string content, string? layoutJson, CancellationToken ct)
    {
        var template = await db.Templates.FirstOrDefaultAsync(t => t.Id == id, ct);
        if (template is null) return null;
        template.Name = name;
        template.Type = type;
        template.Content = content;
        template.LayoutJson = layoutJson;
        await db.SaveChangesAsync(ct);
        return template;
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken ct)
    {
        var template = await db.Templates.FirstOrDefaultAsync(t => t.Id == id, ct);
        if (template is null) return false;
        db.Templates.Remove(template);
        await db.SaveChangesAsync(ct);
        return true;
    }
}
