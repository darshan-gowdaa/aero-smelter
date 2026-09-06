import { NextRequest, NextResponse } from "next/server";
import { buildGroundedContext } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const userPrompt = body?.prompt?.trim();

    if (!userPrompt) {
      return NextResponse.json(
        { error: "Prompt is required in request body.", code: "INVALID_PROMPT" },
        { status: 400 }
      );
    }

    const apiKey = (
      req.headers.get("x-gemini-key") ||
      body?.apiKey ||
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      ""
    ).trim();

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "GEMINI_API_KEY is not configured. Please supply an API key in the UI input or configure GEMINI_API_KEY in Vercel environment variables.",
          code: "MISSING_API_KEY",
        },
        { status: 503 }
      );
    }

    const context = buildGroundedContext();

    const systemInstruction = `You are the Lead Flight Operations & Business Intelligence Advisor for ASG Airlines.
You provide clear, human-friendly, executive-ready operational insights to leadership, airline managers, and stakeholders.

COMMUNICATION GUIDELINES:
1. Speak in human-friendly, plain English. Avoid overly dense data engineering jargon (explain what numbers mean in practical flight and business terms).
2. Ground your answers 100% in the verified flight, booking, and revenue figures provided. Never invent data.
3. Structure answers cleanly with Markdown:
   - NEVER start with conversational pleasantries like "Here is your executive assessment...". Begin IMMEDIATELY with the first section header: '### [COLOR] Section Title'.
   - Use '### [COLOR] Header Title' for section titles, where [COLOR] is [RED], [YELLOW], or [GREEN].
   - Use '- **Bold Topic**: explanation' for clear bullet points.
   - Use '*italic*' for subtle operational context and \`code\` for flight IDs or airport codes.
   - Tag high-risk issues, severe delays, or high cancellations with [RED].
   - Tag operational notices, pending funds, or schedule adjustments with [YELLOW].
   - Tag healthy financials, verified solutions, and successful operations with [GREEN].
4. Always conclude with a dedicated section: '### [GREEN] Executive Recommendation & Action Plan' with 2-3 clear action items.
5. Provide a complete, fully finished response. Do not stop midway.`;

    const payload = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${systemInstruction}\n\n=== VERIFIED GROUND TRUTH DATA ===\n${context}\n\n=== EXECUTIVE QUESTION ===\n${userPrompt}\n\nBegin your comprehensive executive assessment now:`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 8192,
      },
    };

    const modelAttempts = [
      { name: "gemini-2.5-flash", disableThinking: true },
      { name: "gemini-2.5-flash", disableThinking: false },
      { name: "gemini-1.5-flash", disableThinking: false },
    ];
    let lastError: any = null;

    for (const item of modelAttempts) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${item.name}:generateContent?key=${apiKey}`;

        const requestPayload: any = {
          ...payload,
          generationConfig: {
            ...payload.generationConfig,
            ...(item.disableThinking ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
          },
        };

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestPayload),
        });

        if (!response.ok) {
          const errJson = await response.json().catch(() => ({}));
          const rawMsg = errJson?.error?.message || `HTTP ${response.status}: ${response.statusText}`;

          if (rawMsg.includes("thinkingConfig") || rawMsg.includes("unknown field")) {
            continue;
          }

          if (response.status === 403 || rawMsg.includes("API_KEY_INVALID")) {
            return NextResponse.json(
              { error: "Invalid Gemini API Key in server environment.", code: "AUTH_ERROR" },
              { status: 403 }
            );
          }

          if (response.status === 429 || rawMsg.includes("RESOURCE_EXHAUSTED")) {
            return NextResponse.json(
              { error: "Gemini API rate limit or quota exceeded. Please try again in a few moments.", code: "RATE_LIMIT" },
              { status: 429 }
            );
          }

          throw new Error(rawMsg);
        }

        const resData = await response.json();
        const candidate = resData?.candidates?.[0];
        const parts = candidate?.content?.parts || [];

        const textParts = parts
          .filter((p: any) => typeof p.text === "string" && !p.thought)
          .map((p: any) => p.text)
          .join("")
          .trim();

        if (!textParts) {
          throw new Error("No text content returned by Gemini API.");
        }

        return NextResponse.json({
          text: textParts,
          model: item.name,
        });
      } catch (err: any) {
        lastError = err;
      }
    }

    return NextResponse.json(
      {
        error: lastError?.message || "Failed to contact Google Gemini API.",
        code: "UPSTREAM_ERROR",
      },
      { status: 502 }
    );
  } catch (globalErr: any) {
    return NextResponse.json(
      { error: globalErr?.message || "Internal server error.", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
