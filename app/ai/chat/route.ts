
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { messages } = body;

        const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
            {
                type: "function",
                function: {
                    name: "show_chart",
                    description: "Display the technical stock price chart for a given stock ticker.",
                    parameters: {
                        type: "object",
                        properties: {
                            ticker: { type: "string", description: "The stock symbol, e.g. NVDA" },
                        },
                        required: ["ticker"],
                    },
                },
            },
            {
                type: "function",
                function: {
                    name: "show_news",
                    description: "Display the latest news timeline for a given stock ticker.",
                    parameters: {
                        type: "object",
                        properties: {
                            ticker: { type: "string", description: "The stock symbol, e.g. NVDA" },
                        },
                        required: ["ticker"],
                    },
                },
            },
            {
                type: "function",
                function: {
                    name: "show_heatmap",
                    description: "Display the stock market heatmap (sectors/performance).",
                    parameters: { type: "object", properties: {}, required: [] },
                },
            },
            {
                type: "function",
                function: {
                    name: "show_financials",
                    description: "Display financial data/table for a specific stock.",
                    parameters: {
                        type: "object",
                        properties: {
                            ticker: { type: "string", description: "The stock symbol, e.g. MSFT" },
                        },
                        required: ["ticker"],
                    },
                },
            },
            {
                type: "function",
                function: {
                    name: "show_screener",
                    description: "Display the stock screener widget to filter and find stocks.",
                    parameters: { type: "object", properties: {}, required: [] },
                },
            },
            {
                type: "function",
                function: {
                    name: "show_market_overview",
                    description: "Display today's market overview (indices, futures, bonds, forex).",
                    parameters: { type: "object", properties: {}, required: [] },
                },
            },
            {
                type: "function",
                function: {
                    name: "show_market_data",
                    description: "Display trending stocks (top gainers/losers/active).",
                    parameters: { type: "object", properties: {}, required: [] },
                },
            },
        ];

        const completion = await openai.chat.completions.create({
            model: "gpt-4-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are InfinityXZ, an advanced trading AI. You are helpful and concise. If the user provides a ticker symbol (e.g. 'NVDA') or asks for price/chart, call ONLY 'show_chart'. Do NOT call 'show_news' unless the user EXPLICITLY asks for news, headlines, or 'what is happening' with the stock. If user asks for 'heatmap', 'hotmap', 'sector performance', or 'ETF heatmap', call 'show_heatmap'. If user asks for 'financials', call 'show_financials'. If user asks for 'screener', call 'show_screener'. If 'market overview' or 'futures/bonds', call 'show_market_overview'. If 'trending stocks' or 'top gainers', call 'show_market_data'. Default ticker -> chart."
                },
                ...messages
            ],
            tools: tools,
            tool_choice: "auto",
        });

        const choice = completion.choices[0];
        const toolCalls = choice.message.tool_calls;

        let responseData = {
            role: 'assistant',
            content: choice.message.content || "",
            chartTicker: undefined as string | undefined,
            newsTicker: undefined as string | undefined,
            showHeatmap: false,
            heatmapMode: 'stock' as 'stock' | 'etf',
            financialsTicker: undefined as string | undefined,
            showScreener: false,
            showMarketOverview: false,
            showMarketData: false
        };

        if (toolCalls) {
            for (const tc of toolCalls) {
                const func = (tc as any).function;
                const args = JSON.parse(func.arguments);

                if (func.name === 'show_chart') {
                    responseData.chartTicker = args.ticker;
                    if (!responseData.content) responseData.content = `Here is the chart for ${args.ticker}.`;
                }
                if (func.name === 'show_news') {
                    responseData.newsTicker = args.ticker;
                    if (!responseData.content) responseData.content = `Here are the latest news updates for ${args.ticker}.`;
                }
                if (func.name === 'show_heatmap') {
                    responseData.showHeatmap = true;
                    // Detect if ETF was requested in the message history? Or just default.
                    // For now, simple heatmap.
                    if (!responseData.content) responseData.content = "Here is the Market Heatmap.";
                }
                if (func.name === 'show_financials') {
                    responseData.financialsTicker = args.ticker;
                    if (!responseData.content) responseData.content = `Here are the financials for ${args.ticker}.`;
                }
                if (func.name === 'show_screener') {
                    responseData.showScreener = true;
                    if (!responseData.content) responseData.content = "Here is the Stock Screener.";
                }
                if (func.name === 'show_market_overview') {
                    responseData.showMarketOverview = true;
                    if (!responseData.content) responseData.content = "Here is the Market Overview.";
                }
                if (func.name === 'show_market_data') {
                    responseData.showMarketData = true;
                    if (!responseData.content) responseData.content = "Here are today's Trending Stocks.";
                }
            }
        }

        return NextResponse.json(responseData);

    } catch (error) {
        console.error("OpenAI API Error:", error);
        return NextResponse.json({ error: "Failed to process chat request." }, { status: 500 });
    }
}
