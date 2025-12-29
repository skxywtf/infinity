
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
        ];

        const completion = await openai.chat.completions.create({
            model: "gpt-4-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are InfinityXZ, an advanced trading AI. You are helpful and concise. If the user provides a ticker symbol (e.g. 'NVDA') or asks for price/chart, call ONLY 'show_chart'. Do NOT call 'show_news' unless the user EXPLICITLY asks for news, headlines, or 'what is happening' with the stock. If user asks for BOTH, call both. Default behavior for a ticker is CHART ONLY."
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
            newsTicker: undefined as string | undefined
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
            }
        }

        return NextResponse.json(responseData);

    } catch (error) {
        console.error("OpenAI API Error:", error);
        return NextResponse.json({ error: "Failed to process chat request." }, { status: 500 });
    }
}
