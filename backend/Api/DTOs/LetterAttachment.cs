using System.ComponentModel.DataAnnotations;

namespace DocumentGenerator.Api.DTOs;

public sealed record LetterAttachment(
    [Required, StringLength(80)] string Id,
    [Required, StringLength(200)] string Title,
    [Required, StringLength(20000)] string Content);
