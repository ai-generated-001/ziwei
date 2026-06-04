namespace backend.Models;

public class AstrologyRequest
{
    public string? PalaceName { get; set; }
    public string? MajorStars { get; set; }
    public string? MinorStars { get; set; }
    public string? Transformations { get; set; }
    public string ChartContext { get; set; } = string.Empty;
    public string UserPrompt { get; set; } = string.Empty;
    public List<ChatMessageDto>? ChatHistory { get; set; } = [];
    public string Lang { get; set; } = "zh";
    public string Model { get; set; } = "google/gemini-3.5-flash";
}
