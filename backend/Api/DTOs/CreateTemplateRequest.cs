using System.ComponentModel.DataAnnotations;
using DocumentGenerator.Api.Models;

namespace DocumentGenerator.Api.DTOs;

public sealed record CreateTemplateRequest(
    [Required, StringLength(200)] string Name,
    [EnumDataType(typeof(DocumentType))] DocumentType Type,
    [Required, StringLength(20000)] string Content,
    LetterLayout? Layout = null,
    [Required, StringLength(80)] string Category = "Allgemeines");
