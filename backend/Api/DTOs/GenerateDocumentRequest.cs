using System.ComponentModel.DataAnnotations;

namespace DocumentGenerator.Api.DTOs;

public sealed class GenerateDocumentRequest
{
    [Required, StringLength(20000)]
    public string Template { get; init; } = string.Empty;

    [Required]
    public Dictionary<string, string?> Values { get; init; } = new();
}
