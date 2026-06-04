using backend.Models;
using backend.Services;
using Microsoft.Extensions.Options;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddOpenApi();

// Configure OpenRouter settings and Typed HttpClient Client Factory
builder.Services.Configure<OpenRouterOptions>(builder.Configuration.GetSection("OpenRouter"));

builder.Services.AddHttpClient<IOpenRouterService, OpenRouterService>((serviceProvider, client) =>
{
    var options = serviceProvider.GetRequiredService<IOptions<OpenRouterOptions>>().Value;
    
    var baseUrl = options.BaseUrl;
    // Base address for HttpClient requires a trailing slash
    if (!baseUrl.EndsWith("/"))
    {
        baseUrl += "/";
    }
    
    client.BaseAddress = new Uri(baseUrl);
    
    if (!string.IsNullOrEmpty(options.ApiKey))
    {
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", options.ApiKey);
    }
    
    // OpenRouter integration requires a valid App URL and Title for ranking
    client.DefaultRequestHeaders.Add("HTTP-Referer", "http://localhost:1420");
    client.DefaultRequestHeaders.Add("X-Title", "ZiWei Dou Shu Analyzer");
});

// Configure CORS for Vite development servers
builder.Services.AddCors(options =>
{
    options.AddPolicy("ViteDevCors", policy =>
    {
        policy.WithOrigins("http://localhost:1420", "http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// Enable CORS before mapping endpoints
app.UseCors("ViteDevCors");

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
