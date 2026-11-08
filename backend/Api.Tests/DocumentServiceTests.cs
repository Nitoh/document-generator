using DocumentGenerator.Api.DTOs;
using DocumentGenerator.Api.Services;
using Xunit;

namespace DocumentGenerator.Api.Tests;

public class DocumentServiceTests
{
    private readonly DocumentService documents = new();

    [Fact]
    public void GeneratesRepeatedUnicodeFieldsWithoutEvaluatingValuesAgain()
    {
        var result = documents.Generate(new GenerateDocumentRequest
        {
            Template = "{{Änderung}}: {{Name}} / {{ Name }}",
            Values = new() { ["Änderung"] = "Grüße", ["Name"] = "${1} {{Datum}} <script>" }
        });
        Assert.Equal("Grüße: ${1} {{Datum}} <script> / ${1} {{Datum}} <script>", result.Content);
        Assert.Equal(new[] { "Änderung", "Name" }, result.Fields);
    }

    [Theory]
    [InlineData("{{Name", "Erika")]
    [InlineData("{{bad-name}}", "Erika")]
    [InlineData("{{Name}}", " ")]
    [InlineData("", "Erika")]
    public void RejectsInvalidInputs(string template, string value) =>
        Assert.Throws<ArgumentException>(() => documents.Generate(new GenerateDocumentRequest
        {
            Template = template, Values = new() { ["Name"] = value }
        }));

    [Fact]
    public void MissingAndCaseMismatchedFieldsAreRejected() =>
        Assert.Throws<ArgumentException>(() => documents.Generate(new GenerateDocumentRequest
        {
            Template = "{{Name}}", Values = new() { ["name"] = "Erika" }
        }));

    [Fact]
    public void EnforcesTemplateValueAndOutputLimits()
    {
        Assert.Throws<ArgumentException>(() => new TemplateRenderer(new string('x', 20001)));
        Assert.Throws<ArgumentException>(() => documents.Generate(new GenerateDocumentRequest
        {
            Template = "{{Name}}", Values = new() { ["Name"] = new string('x', 5001) }
        }));
        Assert.Throws<ArgumentException>(() => documents.Generate(new GenerateDocumentRequest
        {
            Template = string.Concat(Enumerable.Repeat("{{Name}}", 300)),
            Values = new() { ["Name"] = new string('x', 5000) }
        }));
    }

    [Fact]
    public void PlainTextNeedsNoValues() => Assert.Equal("Hallo", documents.Generate(new GenerateDocumentRequest
    {
        Template = "Hallo"
    }).Content);
    [Fact]
    public void RendersReusableLayoutFieldsAlongsideBody()
    {
        var result = documents.Generate(new GenerateDocumentRequest
        {
            Template = "Vertrag {{Nummer}}",
            Layout = new LetterLayout { Subject = "Kündigung {{Nummer}}", Salutation = "Guten Tag {{Name}},", Closing = "{{Abschluss}}", ClosingText = "Antwort über {{Antwortweg}}", Design = "line", HeaderStyle = "centered" },
            Values = new() { ["Nummer"] = "A-123", ["Name"] = "Alex", ["Abschluss"] = "Viele Grüße", ["Antwortweg"] = "E-Mail" }
        });
        Assert.Equal("Vertrag A-123", result.Content);
        Assert.Equal("Guten Tag Alex,", result.Layout!.Salutation);
        Assert.Equal("Kündigung A-123", result.Layout.Subject);
        Assert.Equal("line", result.Layout.Design);
        Assert.Equal("centered", result.Layout.HeaderStyle);
        Assert.Equal("Antwort über E-Mail", result.Layout.ClosingText);
        Assert.Contains("Abschluss", result.Fields);
    }

    [Fact]
    public void RejectsMissingLayoutPlaceholderAndExcessiveRenderedLayoutLength()
    {
        Assert.Throws<ArgumentException>(() => documents.Generate(new GenerateDocumentRequest
        {
            Template = "Text", Layout = new LetterLayout { Salutation = "Hallo {{Name}}" }
        }));
        Assert.Throws<ArgumentException>(() => documents.Generate(new GenerateDocumentRequest
        {
            Template = "Text", Layout = new LetterLayout { Salutation = "{{Name}}" }, Values = new() { ["Name"] = new string('x', 161) }
        }));
    }
}
