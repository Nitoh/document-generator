using System.Text.RegularExpressions;

namespace DocumentGenerator.Api.Services;

public sealed class TemplateRenderer
{
    public const int MaxLength = 20000;
    private static readonly Regex Placeholder = new(@"\{\{\s*([\p{L}_][\p{L}\p{N}_]*)\s*\}\}", RegexOptions.Compiled, TimeSpan.FromSeconds(1));
    public string Text { get; }
    public IReadOnlyList<string> Fields { get; }

    public TemplateRenderer(string text)
    {
        if (string.IsNullOrWhiteSpace(text) || text.Length > MaxLength)
            throw new ArgumentException($"Die Vorlage muss 1 bis {MaxLength} Zeichen enthalten.");
        if (Placeholder.Replace(text, "").Contains("{{") || Placeholder.Replace(text, "").Contains("}}"))
            throw new ArgumentException("Ungültiger Platzhalter. Verwende beispielsweise {{Name}}.");
        Text = text;
        Fields = Placeholder.Matches(text).Select(m => m.Groups[1].Value).Distinct(StringComparer.Ordinal).ToArray();
    }

    public string Render(IReadOnlyDictionary<string, string?> values)
    {
        var missing = Fields.Where(key => !values.TryGetValue(key, out var value) || string.IsNullOrWhiteSpace(value)).ToArray();
        if (missing.Length > 0)
            throw new ArgumentException("Bitte ausfüllen: " + string.Join(", ", missing));
        if (values.Any(v => v.Value?.Length > 5000))
            throw new ArgumentException("Ein Wert darf höchstens 5000 Zeichen enthalten.");
        long size = Text.Length;
        foreach (Match match in Placeholder.Matches(Text))
            size += values[match.Groups[1].Value]!.Length - match.Length;
        if (size > 1000000) throw new ArgumentException("Das erzeugte Dokument ist zu groß (maximal 1 Million Zeichen).");
        return Placeholder.Replace(Text, match => values[match.Groups[1].Value]!);
    }
}
