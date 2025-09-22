const express = require("express");
const fetch = require("node-fetch");
const app = express();
const PORT = process.env.PORT || 3000;

// UPGRADED MODEL: Using the powerful and popular Mistral-7B model
const API_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2";

app.use(express.json());

app.post("/chat", async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  // UPDATED PROMPT: Mistral uses a specific format with [INST] tags for best results.
  const systemPrompt = `<s>[INST] You are a friendly guard in a medieval village. Keep your answers concise and in character. A traveler approaches and says: '${message}' What do you say back? [/INST]`;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: systemPrompt,
        parameters: {
          max_new_tokens: 60,   // Giving it a bit more room to talk
          temperature: 0.7,
          repetition_penalty: 1.1,
          return_full_text: false, // We only want the AI's reply
        },
      }),
    });
    
    const contentType = response.headers.get("content-type");

    if (response.ok && contentType && contentType.includes("application/json")) {
        const prediction = await response.json();
        
        if (!prediction || !prediction[0] || !prediction[0].generated_text) {
             console.error("Hugging Face API Error: Received valid JSON but it was empty.", prediction);
             return res.json({ reply: "I'm at a loss for words..." });
        }

        const aiResponse = prediction[0].generated_text.trim();
        return res.json({ reply: aiResponse });

    } else {
        const errorText = await response.text();
        console.error("Hugging Face API Error: Did not receive a valid JSON response.");
        console.error("Status Code:", response.status, response.statusText);
        console.error("Response Body:", errorText);

        if (errorText.includes("is currently loading")) {
             return res.json({ reply: "My mind is warming up... ask me again in a minute. This is a big thought." });
        } else {
             return res.json({ reply: "The local magi are busy... Try asking me again in a moment." });
        }
    }

  } catch (error) {
    console.error("Server Error (Catch Block):", error);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server for Hugging Face is running on port ${PORT}`);
});
