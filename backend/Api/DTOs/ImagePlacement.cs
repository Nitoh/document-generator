using System.ComponentModel.DataAnnotations;

namespace DocumentGenerator.Api.DTOs;

public sealed class ImagePlacement
{
    [RegularExpression("^(left|center|right)$")]
    public string Align { get; init; } = "left";
    [Range(-165, 165)]
    public double X { get; init; }
    [Range(0, 85)]
    public double Y { get; init; }
    [Range(0, 165)]
    public double Width { get; init; }
    [Range(0, 12)]
    public double Tabs { get; init; }
}
