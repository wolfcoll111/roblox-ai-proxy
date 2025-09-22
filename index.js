const express = require("express");
const fetch = require("node-fetch");
const app = express();
const PORT = process.env.PORT || 3000;

const API_URL = "https://api-inference.huggingface.co/models/gpt2";

app.use(express.json());

app.post("/chat", async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  const systemPrompt = `You are a friendly guard in a medieval village. A traveler approaches you.
Traveler: ${message}
Guard:`;

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
          max_new_tokens: 50,
          temperature: 0.8,
          repetition_penalty: 1.2,
          return_full_text: false,
        },
      }),
    });

    // ========== THE NEW, MORE ROBUST ERROR HANDLING STARTS HERE ==========

    const contentType = response.headers.get("content-type");

    // Check if the response is successful AND is in the expected JSON format
    if (response.ok && contentType && contentType.includes("application/json")) {
        const prediction = await response.json();
        
        // Handle a successful but empty response
        if (!prediction || !prediction[0] || !prediction[0].generated_text) {
             console.error("Hugging Face API Error: Received valid JSON but it was empty.", prediction);
             return res.json({ reply: "I'm at a loss for words..." });
        }

        const aiResponse = prediction[0].generated_text.trim();
        return res.json({ reply: aiResponse });

    } else {
        // If it's not JSON or not OK, it's an error. Read it as plain text.
        const errorText = await response.text();
        console.error("Hugging Face API Error: Did not receive a valid JSON response.");
        console.error("Status Code:", response.status, response.statusText);
        console.error("Response Body:", errorText); // This will show us the "N..." message!

        // Send a user-friendly message back to Roblox
        if (errorText.includes("is currently loading")) {
             return res.json({ reply: "My mind is warming up... ask me again in 20 seconds." });
        } else {
             return res.json({ reply: "The local magi are busy... Try asking me again in a moment." });
        }
    }
    // ========== ERROR HANDLING ENDS HERE ==========

  } catch (error) {
    console.error("Server Error (Catch Block):", error);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server for Hugging Face is running on port ${PORT}`);
});
