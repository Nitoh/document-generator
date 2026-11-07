using DocumentGenerator.Api.DTOs;
using DocumentGenerator.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace DocumentGenerator.Api.Controllers;

[ApiController]
[Route("api/templates")]
public class TemplatesController(TemplateService service) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct) => Ok(await service.GetAllAsync(ct));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var template = await service.GetByIdAsync(id, ct);
        return template is null ? NotFound() : Ok(template);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateTemplateRequest request, CancellationToken ct)
    {
        try
        {
            var template = await service.CreateAsync(request, ct);
            return CreatedAtAction(nameof(GetById), new { id = template.Id }, template);
        }
        catch (ArgumentException ex) { return Problem(statusCode: 400, title: "Ungültige Vorlage", detail: ex.Message); }
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, CreateTemplateRequest request, CancellationToken ct)
    {
        try
        {
            var template = await service.UpdateAsync(id, request, ct);
            return template is null ? NotFound() : Ok(template);
        }
        catch (ArgumentException ex) { return Problem(statusCode: 400, title: "Ungültige Vorlage", detail: ex.Message); }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct) =>
        await service.DeleteAsync(id, ct) ? NoContent() : NotFound();
}
