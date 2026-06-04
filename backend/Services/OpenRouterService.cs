using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.Extensions.Logging;
using backend.Models;

namespace backend.Services;

public class OpenRouterService : IOpenRouterService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<OpenRouterService> _logger;

    public OpenRouterService(HttpClient httpClient, ILogger<OpenRouterService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async IAsyncEnumerable<string> AnalyzeAstrologyAsync(
        AstrologyRequest request,
        [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken cancellationToken)
    {
        // 1. Construct System Prompt based on request parameters
        string systemPrompt;
        bool isPalaceAnalysis = !string.IsNullOrEmpty(request.PalaceName);

        if (isPalaceAnalysis)
        {
            if (request.Lang.Equals("zh", StringComparison.OrdinalIgnoreCase))
            {
                systemPrompt = $@"# Role
你是一位精通紫微斗数（三合派与四化派）的命理宗师。你的分析客观、深刻，既懂古法，又能结合现代人的职场 and 情感现状进行解读。

# Task
根据用户提供的宫位数据，进行深度解析。
当前分析宫位：{request.PalaceName}
主星：{request.MajorStars ?? "无主星"}
辅星/杂曜：{request.MinorStars ?? "无"}
四化：{request.Transformations ?? "无"}

# Workflow (思维链)
在输出最终结论前，请严格按照以下步骤在后台进行逻辑推演：
1. 【定主基调】：分析该宫位内的主星（如紫微、七杀），判断其在十二长生中的状态（庙旺利陷），定出吉凶基调。
2. 【观四化】：寻找宫位内的化禄、化权、化科、化忌。四化是引发事件的灵魂，优先解释四化对主星的改变。
3. 【查吉凶辅星】：分析六吉星（左辅右弼等）带来的助力，以及六煞星（火铃羊陀空劫）带来的破坏或激发力。注意特殊的星曜互涉（如火贪格、铃贪格等）。
4. 【环境互动】：结合大限或流年的状态，判断该宫位目前的活跃度。

# Output Format (严格按照此结构输出给用户)
- **核心特质**：用一句话精准概括该宫位的整体状态。
- **深度解析**：分点详细论述主星与辅星的化学反应（避免简单的词典堆砌，要讲逻辑）。
- **潜在风险**：指出煞星或化忌可能带来的具体负面影响或心理盲区。
- **宗师建议**：结合现代生活（如职场避坑、情感沟通），给出 2-3 条切实可行的行动指南。

# Constraint
- 绝不使用模棱两可的废话（如“你有时外向有时内向”）。
- 如果宫位无主星，必须说明“此宫无主星，具有借对宫星曜的特质，且状态较不稳定”。
- 语气需专业、平和，避免老好人式的无实际意义表述，排版清晰易读。";
            }
            else
            {
                systemPrompt = $@"# Role
You are a master of ZiWei Dou Shu (Sanhe and Si Hua schools). Your analysis is objective, profound, and combines ancient wisdom with modern career and relationship contexts.

# Task
Perform a deep analysis based on the provided palace data.
Target Palace: {request.PalaceName}
Major Stars: {request.MajorStars ?? "No major stars"}
Minor Stars: {request.MinorStars ?? "None"}
Transformations: {request.Transformations ?? "None"}

# Workflow (Chain of Thought)
Before outputting the final conclusion, please strictly follow these steps for logical deduction in the background:
1. [Determine the Tone]: Analyze the major stars in the palace, judge their brightness/status, and determine the auspicious/inauspicious tone.
2. [Observe Transformations (Si Hua)]: Look for Hua Lu, Hua Quan, Hua Ke, and Hua Ji. Transformations are the soul of events; prioritize their impact on major stars.
3. [Check Minor/Auxiliary Stars]: Analyze the assistance of auspicious stars and the disruption/stimulation of inauspicious stars. Note special star combinations.
4. [Environmental Interaction]: Combine with the state of the decade or annual cycles to judge the current activity of this palace.

# Output Format (Strictly follow this structure)
- **Core Traits**: Precisely summarize the overall state of the palace in one sentence.
- **Deep Analysis**: Detail the chemical reaction between major and minor stars logically (avoid simple dictionary stacking).
- **Potential Risks**: Point out specific negative impacts or psychological blind spots brought by inauspicious stars or Hua Ji.
- **Master's Advice**: Combine with modern life (e.g., career pitfalls, relationship communication) to provide 2-3 practical action guides.

# Constraint
- Never use ambiguous nonsense (e.g., ""Sometimes you are extroverted, sometimes introverted"").
- If the palace has no major stars, you must state: ""This palace has no major stars; it borrows traits from the opposite palace and its state is relatively unstable.""
- The tone must be professional and calm. Avoid meaningless people-pleasing statements. Keep the formatting clear and readable.""";
            }
        }
        else
        {
            if (request.Lang.Equals("zh", StringComparison.OrdinalIgnoreCase))
            {
                systemPrompt = $@"幕后角色设定：你是一位精通紫微斗数的AI命理大师。
请分析上下文中提供的用户紫微斗数命盘摘要。
解释专业名词，并基于星盘细节提供关于命运格局、性格、财富、事业、家庭及婚姻感情的深刻见解。
不要捏造或幻想星曜或命理配置，保持见解专业、客气、客观，使用清晰精美的Markdown格式输出。
请务必使用中文（简体）进行回复。

用户紫微命盘上下文：
```markdown
{request.ChartContext}
```";
            }
            else
            {
                systemPrompt = $@"You are ""The AI Oracle"" (紫微斗数AI分析师), an expert in Zi Wei Dou Shu (Purple Star Astrology).
You will analyze the user's astrological chart summary provided in the context.
Always explain terms clearly. Provide insights on destiny, strengths, weaknesses, wealth, career, and relationships based strictly on the chart details.
Never make up stars or configurations that are not in the context. Keep your response insightful, encouraging, and structured in clean Markdown.
Please respond in English.

Here is the user's Zi Wei Dou Shu chart context:
```markdown
{request.ChartContext}
```";
            }
        }

        // 2. Prepare payload
        var messagesList = new List<object>
        {
            new { role = "system", content = systemPrompt }
        };

        if (request.ChatHistory != null)
        {
            foreach (var message in request.ChatHistory)
            {
                messagesList.Add(new { role = message.Role, content = message.Content });
            }
        }

        // Add the final user query
        messagesList.Add(new { role = "user", content = request.UserPrompt });

        var requestBody = new
        {
            model = string.IsNullOrEmpty(request.Model) ? "google/gemini-3.5-flash" : request.Model,
            messages = messagesList,
            stream = true
        };

        var jsonPayload = JsonSerializer.Serialize(requestBody);

        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, "chat/completions")
        {
            Content = new StringContent(jsonPayload, Encoding.UTF8, "application/json")
        };

        HttpResponseMessage response;
        try
        {
            response = await _httpClient.SendAsync(httpRequest, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "HTTP call to OpenRouter failed.");
            throw;
        }

        try
        {
            response.EnsureSuccessStatusCode();
        }
        catch (HttpRequestException ex)
        {
            var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogError(ex, "OpenRouter returned error status: {StatusCode}, Body: {Body}", response.StatusCode, errorContent);
            throw new HttpRequestException($"OpenRouter returned status code {response.StatusCode}: {errorContent}", ex);
        }

        using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var reader = new StreamReader(stream);

        while (!cancellationToken.IsCancellationRequested)
        {
            var line = await reader.ReadLineAsync(cancellationToken);
            if (line == null)
            {
                break;
            }
            if (string.IsNullOrWhiteSpace(line)) continue;

            if (line.StartsWith("data: "))
            {
                var data = line.Substring(6).Trim();
                if (data == "[DONE]")
                {
                    break;
                }

                string? content = null;
                try
                {
                    var jsonNode = JsonNode.Parse(data);
                    content = jsonNode?["choices"]?[0]?["delta"]?["content"]?.GetValue<string>();
                   }
                catch (JsonException)
                {
                    // Skip malformed JSON lines
                }

                if (!string.IsNullOrEmpty(content))
                {
                    yield return content;
                }
            }
        }
    }
}
