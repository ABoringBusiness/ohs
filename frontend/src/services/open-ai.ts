import { Message } from "#/components/features/chat/voice-assistant";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY!,
  dangerouslyAllowBrowser: true,
});

export async function getTranscript(input: string | File) {
  if (typeof input === "string") return input;

  try {
    const { text } = await groq.audio.transcriptions.create({
      file: input,
      model: "whisper-large-v3",
    });

    return text.trim() || null;
  } catch {
    return null;
  }
}

export async function summarizeConversation(messages: Message[]) {
  const completion = await groq.chat.completions.create({
    model: "llama3-8b-8192",
    messages: [
      {
        role: "user",
        content: `Extract the user's request and the voice assistant's recommendations from this conversation.  
        Format the output as follows:  
    
        "I want to create a [project type] in [language] that:  
        * [Feature 1 or Voice Assistant Suggestion]  
        * [Feature 2 or Voice Assistant Suggestion]  
        * [Feature 3 or Voice Assistant Suggestion]  
        * [Feature 4 or Voice Assistant Suggestion] ..."  
    
        Only return the formatted request. Do not include explanations or extra text.  
    
        Conversation: ${JSON.stringify(messages)}`,
      },
    ],
  });
  const response = completion.choices[0].message.content;
  return response;
}

export async function generateAIResponse(
  transcript: string | File,
  messages: any[],
) {
  const formattedTranscript = await getTranscript(transcript);
  const completion = await groq.chat.completions.create({
    model: "llama3-8b-8192",
    messages: [
      {
        role: "system",
        content: `- You are Swift, a friendly and helpful voice assistant.
			- Respond briefly to the user's request, and do not provide unnecessary information.
			- If you don't understand the user's request, ask for clarification.
			- You do not have access to up-to-date information, so you should not provide real-time data.
			- You are not capable of performing actions other than responding to the user.
			- Do not use markdown, emojis, or other formatting in your responses. Respond in a way easily spoken by text-to-speech software.
			- Your large language model is Llama 3, created by Meta, the 8 billion parameter version. It is hosted on Groq, an AI infrastructure company that builds fast inference technology.
			- Your text-to-speech model is Sonic, created and hosted by Cartesia, a company that builds fast and realistic speech synthesis technology.
			- You are built with Next.js and hosted on Vercel.`,
      },
      ...messages,
      {
        role: "user",
        content: formattedTranscript,
      },
    ],
  });
  const response = completion.choices[0].message.content;

  const voice = await fetch("https://api.cartesia.ai/tts/bytes", {
    method: "POST",
    headers: {
      "Cartesia-Version": "2024-06-30",
      "Content-Type": "application/json",
      "X-API-Key": import.meta.env.VITE_CARTESIA_API_KEY!,
    },
    body: JSON.stringify({
      model_id: "sonic-english",
      transcript: response,
      voice: {
        mode: "id",
        id: "79a125e8-cd45-4c13-8a67-188112f4dd22",
      },
      output_format: {
        container: "raw",
        encoding: "pcm_f32le",
        sample_rate: 24000,
      },
    }),
  });

  return { voice: voice.body, transcript: formattedTranscript, response };
}
