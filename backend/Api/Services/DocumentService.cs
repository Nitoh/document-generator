using System.ComponentModel.DataAnnotations;
using DocumentGenerator.Api.DTOs;

namespace DocumentGenerator.Api.Services;

public sealed class DocumentService
{
    public GeneratedDocumentResponse Generate(GenerateDocumentRequest request)
    {
        var fields = new List<string>();
        string Render(string text)
        {
            if (string.IsNullOrWhiteSpace(text)) return text;
            var template = new TemplateRenderer(text);
            fields.AddRange(template.Fields);
            return template.Render(request.Values);
        }
        // Body remains required, including direct service calls.
        _ = new TemplateRenderer(request.Template);
        var body = Render(request.Template);
        var source = request.Layout;
        LetterLayout? layout = source is null ? null : new LetterLayout
        {
            SenderName = Render(source.SenderName),
            SenderStreet = Render(source.SenderStreet),
            SenderPostalCode = Render(source.SenderPostalCode),
            SenderCity = Render(source.SenderCity),
            SenderEmail = Render(source.SenderEmail),
            SenderPhone = Render(source.SenderPhone),
            RecipientName = Render(source.RecipientName),
            RecipientStreet = Render(source.RecipientStreet),
            RecipientPostalCode = Render(source.RecipientPostalCode),
            RecipientCity = Render(source.RecipientCity),
            Subject = Render(source.Subject),
            Salutation = Render(source.Salutation),
            ClosingText = Render(source.ClosingText),
            Closing = Render(source.Closing),
            Signature = Render(source.Signature),
            City = Render(source.City),
            Date = Render(source.Date),
            Reference = Render(source.Reference),
            Footer = Render(source.Footer),
            Design = source.Design,
            HeaderStyle = source.HeaderStyle,
            Attachments = source.Attachments.Select(attachment => attachment with
            {
                Title = Render(attachment.Title),
                Content = Render(attachment.Content)
            }).ToArray(),
            ShowLogo = source.ShowLogo,
            ShowFoldMarks = source.ShowFoldMarks
        };
        if (layout is not null && !Validator.TryValidateObject(layout, new ValidationContext(layout), null, true))
            throw new ArgumentException("Die eingesetzten Angaben sind zu lang oder das Brieflayout ist ungültig.");
        if (layout is not null && layout.Attachments.Any(attachment =>
            !Validator.TryValidateObject(attachment, new ValidationContext(attachment), null, true)))
            throw new ArgumentException("Die ausgefüllte Anlage überschreitet die zulässige Länge.");
        return new GeneratedDocumentResponse(body, fields.Distinct(StringComparer.Ordinal).ToArray(), layout);
    }
}
