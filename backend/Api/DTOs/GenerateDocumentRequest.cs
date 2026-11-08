using System.ComponentModel.DataAnnotations;

namespace DocumentGenerator.Api.DTOs;

public sealed class GenerateDocumentRequest
{
    [Required, StringLength(20000)]
    public string Template { get; init; } = string.Empty;

    public LetterLayout? Layout { get; init; }

    [Required]
    public Dictionary<string, string?> Values { get; init; } = new();
}
