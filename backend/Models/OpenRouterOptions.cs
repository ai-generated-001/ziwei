namespace backend.Models;

public class OpenRouterOptions
{
    public string BaseUrl { get; set; } = "https://openrouter.ai/api/v1";
    public string ApiKey { get; set; } = string.Empty;
    public string DefaultModel { get; set; } = "deepseek/deepseek-v4-flash";
}
