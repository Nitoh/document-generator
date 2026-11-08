using DocumentGenerator.Api.Models;

namespace DocumentGenerator.Api.DTOs;

public sealed record TemplateResponse(Guid Id, string Name, DocumentType Type, string Content, DateTimeOffset CreatedAt, LetterLayout? Layout = null, string Category = "Allgemeines");
