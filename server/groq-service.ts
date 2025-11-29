import Groq from "groq";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function generateResponse(
  userMessage: string,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>
): Promise<string> {
  try {
    const messages = [
      ...conversationHistory,
      { role: "user" as const, content: userMessage },
    ];

    const completion = await groq.chat.completions.create({
      model: "llama3-70b-8192",
      messages: messages,
      temperature: 0.7,
      max_tokens: 1024,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from GROQ API");
    }

    return content;
  } catch (error) {
    console.error("GROQ API Error:", error);
    throw error;
  }
}
