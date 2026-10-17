import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";

export const runtime = "nodejs";

const RecommendationSchema = z.object({
  headline: z.string(),
  reasoning: z.array(z.string()).min(2).max(4),
  cautions: z.array(z.string()).max(3),
  nextStep: z.string()
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      crop, quantityQuintals, harvestAgeHours, storageAvailable,
      options, bestOption
    } = body ?? {};

    if (!crop || !Number.isFinite(quantityQuintals) || quantityQuintals <= 0 || !Array.isArray(options)) {
      return Response.json({ error: "Please provide a crop, a positive quantity, and market options." }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return Response.json({
        error: "AI explanation is not configured yet. Add OPENAI_API_KEY to .env.local. The on-screen profit calculations still work."
      }, { status: 503 });
    }

    const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const result = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: RecommendationSchema,
      system: `You are KrishiSahay, an agricultural decision-support assistant. Explain trade-offs plainly for a smallholder farmer. Use only the supplied figures. Never invent live mandi prices, transport availability, buyer commitments, or weather data. Financial calculations are computed by application code; do not change them. Make clear that estimates depend on data quality. Photo-based grading is preliminary and cannot determine internal damage, chemical residues, or food safety.`,
      prompt: JSON.stringify({
        crop, quantityQuintals, harvestAgeHours, storageAvailable,
        marketOptions: options, bestCalculatedOption: bestOption
      })
    });

    return Response.json({ recommendation: result.object });
  } catch (error) {
    console.error("KrishiSahay recommendation error", error);
    return Response.json({ error: "Could not generate an explanation right now. Please use the calculated comparison below." }, { status: 500 });
  }
}
