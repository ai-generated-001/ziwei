using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AstrologyController : ControllerBase
{
    private readonly IOpenRouterService _astrologyService;
    private readonly ILogger<AstrologyController> _logger;

    public AstrologyController(IOpenRouterService astrologyService, ILogger<AstrologyController> logger)
    {
        _astrologyService = astrologyService;
        _logger = logger;
    }

    [HttpPost("analyze")]
    public async Task Analyze([FromBody] AstrologyRequest request)
    {
        Response.ContentType = "text/event-stream";
        Response.Headers.Append("Cache-Control", "no-cache");
        Response.Headers.Append("Connection", "keep-alive");

        var responseStream = Response.Body;
        var cancellationToken = HttpContext.RequestAborted;

        try
        {
            await foreach (var chunk in _astrologyService.AnalyzeAstrologyAsync(request, cancellationToken))
            {
                // JSON-encode the chunk so newlines and special chars don't break SSE line framing
                var jsonChunk = System.Text.Json.JsonSerializer.Serialize(chunk);
                var sseMessage = $"data: {jsonChunk}\n\n";
                var bytes = System.Text.Encoding.UTF8.GetBytes(sseMessage);
                await responseStream.WriteAsync(bytes, cancellationToken);
                await responseStream.FlushAsync(cancellationToken);
            }
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("Astrology streaming was cancelled by the client connection abort.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred during astrology streaming analysis.");
            try
            {
                var errorPayload = $"data: Error: {ex.Message}\n\n";
                var bytes = System.Text.Encoding.UTF8.GetBytes(errorPayload);
                await responseStream.WriteAsync(bytes, CancellationToken.None);
                await responseStream.FlushAsync(CancellationToken.None);
            }
            catch
            {
                // Connection might be closed, suppress writing exception
            }
        }
    }
}
