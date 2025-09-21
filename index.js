const express = require("express");
const fetch = require("node-fetch");
const app = express();
const PORT = process.env.PORT || 3000;

// The URL for the free GPT-2 model on Hugging Face
const API_URL = "https://api-inference.huggingface.co/models/gpt2";

app.use(express.json());

app.post("/chat", async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  // We create a simple prompt for the NPC.
  // The AI will try to complete this text.
  const systemPrompt = `You are a friendly guard in a medieval village. A traveler approaches you.
Traveler: ${message}
Guard:`; // The AI will generate the guard's response here.

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.HF_API_KEY}`, // Using the new key name
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: systemPrompt,
        parameters: {
          max_new_tokens: 50, // Keep responses short and snappy
          temperature: 0.8,   // Makes the AI a bit more creative
          repetition_penalty: 1.2,
          return_full_text: false, // IMPORTANT: We only want the AI's generated part
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Hugging Face API Error:", error);
      // Handle model loading error specifically
      if (error.error && error.error.includes("is currently loading")) {
         return res.json({ reply: "My mind is warming up... ask me again in a moment." });
      }
      return res.status(500).json({ error: "Failed to get a response from the AI." });
    }
    
    const prediction = await response.json();
    
    // The response is an array with one object, we get the generated_text
    const aiResponse = prediction[0].generated_text.trim();
    
    res.json({ reply: aiResponse });

  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server for Hugging Face is running on port ${PORT}`);
});
