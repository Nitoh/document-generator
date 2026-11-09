using System.ComponentModel.DataAnnotations;

namespace DocumentGenerator.Api.DTOs;

public sealed class LetterImage
{
    [Required, StringLength(110000)]
    [RegularExpression(@"^data:image/(png|jpeg);base64,[a-zA-Z0-9+/]+={0,2}$")]
    public string Data { get; init; } = string.Empty;

    [Range(1, 640)]
    public int Width { get; init; }

    [Range(1, 640)]
    public int Height { get; init; }
}
