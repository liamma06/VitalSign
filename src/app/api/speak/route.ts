import { getServerEnv } from "@/src/lib/env";

export const runtime = "nodejs";

type SpeakBody = {
	text?: unknown;
	voiceId?: unknown;
	emotion?: unknown;
};

function clamp01(n: number): number {
	return Math.max(0, Math.min(1, n));
}

function buildStability(emotion: string | null): number {
	// Max compatibility: only vary stability by emotion.
	const e = (emotion ?? "").toLowerCase();
	if (e === "happy") return 0.2;
	if (e === "sad") return 0.6;
	if (e === "angry") return 0.3;
	return 0.45;
}

async function callElevenLabsTts(input: {
	apiKey: string;
	voiceId: string;
	text: string;
	modelId: string;
	voiceSettings: { stability: number; similarity_boost: number };
}): Promise<Response> {
	const apiUrl = `https://api.elevenlabs.io/v1/text-to-speech/${input.voiceId}`;
	return fetch(apiUrl, {
		method: "POST",
		headers: {
			Accept: "audio/mpeg",
			"Content-Type": "application/json",
			"xi-api-key": input.apiKey
		},
		body: JSON.stringify({
			text: input.text,
			model_id: input.modelId,
			voice_settings: input.voiceSettings
		})
	});
}

export async function POST(req: Request) {
	try {
		const env = getServerEnv();
		const apiKey =
			env.ELEVENLABS_API_KEY || process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;
		if (!apiKey) {
			return new Response(
				"Server configuration error: missing ELEVENLABS_API_KEY (preferred) or NEXT_PUBLIC_ELEVENLABS_API_KEY (fallback)",
				{ status: 500 }
			);
		}

		const body = (await req.json().catch(() => null)) as SpeakBody | null;
		const textRaw = body?.text;
		const voiceIdRaw = body?.voiceId;
		const emotionRaw = body?.emotion;

		const text = typeof textRaw === "string" ? textRaw.trim() : "";
		if (!text) {
			return new Response("text is required", { status: 400 });
		}

		const voiceId =
			(typeof voiceIdRaw === "string" && voiceIdRaw.trim()) ||
			env.ELEVENLABS_VOICE_ID ||
			"kdmDKE6EkgrWrrykO9Qt";

		const emotion = typeof emotionRaw === "string" ? emotionRaw.trim() : null;
		const voice_settings = {
			stability: clamp01(buildStability(emotion))
		};

		const voiceSettings = {
			stability: voice_settings.stability,
			similarity_boost: 0.7
		};

		const primaryModelId = "eleven_v3";
		let upstream = await callElevenLabsTts({
			apiKey,
			voiceId,
			text,
			modelId: primaryModelId,
			voiceSettings
		});

		if (!upstream.ok) {
			const detail = await upstream.text().catch(() => "");
			console.error("ElevenLabs upstream error:", {
				status: upstream.status,
				modelId: primaryModelId,
				detail: detail?.slice?.(0, 2000) ?? detail
			});

			// Retry with a more widely available model if this looks like a validation/model issue.
			if (upstream.status === 400 || upstream.status === 422) {
				const fallbackModelId = "eleven_turbo_v2_5";
				const retry = await callElevenLabsTts({
					apiKey,
					voiceId,
					text,
					modelId: fallbackModelId,
					voiceSettings
				});
				if (retry.ok) {
					upstream = retry;
				} else {
					const retryDetail = await retry.text().catch(() => "");
					console.error("ElevenLabs retry upstream error:", {
						status: retry.status,
						modelId: fallbackModelId,
						detail: retryDetail?.slice?.(0, 2000) ?? retryDetail
					});
					return new Response(
						JSON.stringify({
							error: "ElevenLabs API error",
							status: retry.status,
							detail: retryDetail
						}),
						{
							status: 502,
							headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
						}
					);
				}
			} else {
				return new Response(
					JSON.stringify({
						error: "ElevenLabs API error",
						status: upstream.status,
						detail
					}),
					{
						status: 502,
						headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
					}
				);
			}
		}

		const audioBuffer = await upstream.arrayBuffer();
		return new Response(audioBuffer, {
			status: 200,
			headers: {
				"Content-Type": "audio/mpeg",
				"Cache-Control": "no-store"
			}
		});
	} catch (error: any) {
		console.error("Speak API Error:", error?.message ?? error);
		return new Response("Failed to synthesize speech", { status: 500 });
	}
}
