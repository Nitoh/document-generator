using System.ComponentModel.DataAnnotations;

namespace DocumentGenerator.Api.DTOs;

public sealed class TextBlockFormat
{
    [RegularExpression("^(left|center|right)$")]
    public string Align { get; init; } = "left";
    [Range(0, 135)]
    public double Indent { get; init; }
    [Range(0, 10)]
    public double Tabs { get; init; }
    [Range(0, 50)]
    public double Before { get; init; }
    public bool Bold { get; init; }
    public bool Italic { get; init; }
}
