using System.ComponentModel.DataAnnotations;

namespace DocumentGenerator.Api.DTOs;

public sealed record LetterAttachment(
    [Required, StringLength(80)] string Id,
    [Required, StringLength(200)] string Title,
    [Required, StringLength(20000)] string Content)
{
    [StringLength(80)]
    public string? Category { get; init; }

    public TextBlockFormat? TextFormat { get; init; }
    public LetterImage? Image { get; init; }
}
