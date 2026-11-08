namespace DocumentGenerator.Api.Models;

public class DocumentTemplate
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public DocumentType Type { get; set; }
    public string Category { get; set; } = "Allgemeines";
    public string Content { get; set; } = string.Empty;
    public string? LayoutJson { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
