using backend.Models;

namespace backend.Services;

public interface IOpenRouterService
{
    IAsyncEnumerable<string> AnalyzeAstrologyAsync(AstrologyRequest request, CancellationToken cancellationToken);
}
