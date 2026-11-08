namespace DocumentGenerator.Api.DTOs;

public sealed record GeneratedDocumentResponse(string Content, IReadOnlyList<string> Fields, LetterLayout? Layout = null);
