import OpenAI from "openai";
import 'dotenv/config';

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

async function askAI(question) {
  try {
    const completion = await openai.chat.completions.create({
      model: "qwen/qwen-2.5-coder-32b:free", // Use the free Qwen model on OpenRouter
      messages: [
        { role: "system", content: "You are a coding assistant helping Nasir with the Membership Fee Contribution For Prosperity Party Dire Dawa Branch Office project." },
        { role: "user", content: question }
      ],
    });

    console.log("\n--- AI Response ---");
    console.log(completion.choices[0].message.content);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

// Get the question from the terminal command
const userQuestion = process.argv.slice(2).join(" ");
if (userQuestion) {
    askAI(userQuestion);
} else {
    console.log("Please provide a question. Example: node ask.js 'How to connect MongoDB?'");
}