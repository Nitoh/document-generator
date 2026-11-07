using DocumentGenerator.Api.Models;

namespace DocumentGenerator.Api.DTOs;

public sealed record TemplateResponse(Guid Id, string Name, DocumentType Type, string Content, DateTimeOffset CreatedAt);
