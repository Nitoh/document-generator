using System.ComponentModel.DataAnnotations;
using System.Net;
using System.Net.Mail;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Mvc;

namespace DocumentGenerator.Api.Controllers;

[ApiController]
[Route("api/letter-mail")]
public sealed class LetterMailController(IConfiguration configuration, ILogger<LetterMailController> logger) : ControllerBase
{
    [HttpPost]
    [RequestSizeLimit(7_100_000)]
    public async Task<IActionResult> Send(LetterMailRequest request, CancellationToken cancellationToken)
    {
        var settings = configuration.GetSection("LetterMail");
        var key = settings["Key"];
        var provided = Request.Headers["X-Nitoh-Mail-Key"].ToString();
        if (string.IsNullOrEmpty(key) || !CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(key), Encoding.UTF8.GetBytes(provided)))
            return NotFound();

        var host = settings["Host"];
        var from = settings["From"];
        if (string.IsNullOrWhiteSpace(host) || !MailAddress.TryCreate(from, out var sender))
            return Problem("Der SMTP-Versand ist nicht konfiguriert.", statusCode: 503);

        if (!MailAddress.TryCreate(request.Recipient, out var recipient) || recipient.Address != request.Recipient)
            return BadRequest(new { detail = "Bitte gib genau eine gültige Empfängeradresse ein." });

        byte[] pdf;
        try { pdf = Convert.FromBase64String(request.Pdf); }
        catch (FormatException) { return BadRequest(new { detail = "Der PDF-Anhang ist ungültig." }); }
        if (pdf.Length > 5_000_000 || !pdf.AsSpan().StartsWith("%PDF-"u8))
            return BadRequest(new { detail = "Der Anhang muss eine PDF-Datei bis 5 MB sein." });

        using var message = new MailMessage(sender, recipient)
        {
            Subject = request.Subject,
            Body = request.Body ?? string.Empty,
            SubjectEncoding = Encoding.UTF8,
            BodyEncoding = Encoding.UTF8
        };
        message.Attachments.Add(new Attachment(new MemoryStream(pdf), "Brief.pdf", "application/pdf"));
        using var smtp = new SmtpClient(host, settings.GetValue("Port", 587))
        {
            EnableSsl = settings.GetValue("StartTls", true)
        };
        if (settings["Username"] is { Length: > 0 } username)
            smtp.Credentials = new NetworkCredential(username, settings["Password"]);

        try { await smtp.SendMailAsync(message, cancellationToken); }
        catch (SmtpException exception)
        {
            logger.LogWarning("SMTP rejected the letter. Status: {StatusCode}", exception.StatusCode);
            return Problem("Der Mailserver konnte den Versand nicht bestätigen.", statusCode: 502);
        }

        return NoContent();
    }
}

public sealed record LetterMailRequest(
    [Required, StringLength(254), EmailAddress] string Recipient,
    [Required, StringLength(180), RegularExpression(@"^[^\r\n]+$")] string Subject,
    [StringLength(5000)] string? Body,
    [Required, StringLength(6_666_668)] string Pdf);
