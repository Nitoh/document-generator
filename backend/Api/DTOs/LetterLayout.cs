using System.ComponentModel.DataAnnotations;

namespace DocumentGenerator.Api.DTOs;

public sealed class LetterLayout
{
    [StringLength(120)]
    public string SenderName { get; init; } = string.Empty;

    [StringLength(120)]
    public string SenderStreet { get; init; } = string.Empty;

    [StringLength(20)]
    public string SenderPostalCode { get; init; } = string.Empty;

    [StringLength(80)]
    public string SenderCity { get; init; } = string.Empty;

    [StringLength(120)]
    public string SenderEmail { get; init; } = string.Empty;

    [StringLength(50)]
    public string SenderPhone { get; init; } = string.Empty;

    [StringLength(160)]
    public string RecipientName { get; init; } = string.Empty;

    [StringLength(120)]
    public string RecipientStreet { get; init; } = string.Empty;

    [StringLength(20)]
    public string RecipientPostalCode { get; init; } = string.Empty;

    [StringLength(80)]
    public string RecipientCity { get; init; } = string.Empty;

    [StringLength(180)]
    public string Subject { get; init; } = string.Empty;

    [StringLength(160)]
    public string Salutation { get; init; } = string.Empty;

    [StringLength(600)]
    public string ClosingText { get; init; } = string.Empty;

    [StringLength(100)]
    public string Closing { get; init; } = string.Empty;

    [StringLength(120)]
    public string Signature { get; init; } = string.Empty;

    [StringLength(80)]
    public string City { get; init; } = string.Empty;

    [StringLength(10)]
    public string Date { get; init; } = string.Empty;

    [StringLength(60)]
    public string Reference { get; init; } = string.Empty;

    [StringLength(200)]
    public string Footer { get; init; } = string.Empty;

    [RegularExpression("^(classic|minimal|line)$")]
    public string Design { get; init; } = "classic";

    [RegularExpression("^(standard|compact|centered)$")]
    public string HeaderStyle { get; init; } = "standard";

    [MaxLength(5)]
    public LetterAttachment[] Attachments { get; init; } = [];

    public LetterImage? LogoImage { get; init; }
    public LetterImage? SignatureImage { get; init; }

    public bool ShowLogo { get; init; } = true;
    public bool ShowFoldMarks { get; init; } = true;
}
