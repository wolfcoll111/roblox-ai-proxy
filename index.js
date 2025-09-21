const express = require("express");
const fetch = require("node-fetch");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post("/chat", async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  const systemPrompt = "You are a helpful and friendly NPC in a roleplay game. Keep your answers concise and in character.";
  
  try {
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${process.env.REPLICATE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "02e509c789964a7ea8736978a43525956ef40397be9033abf9fd2badfe68c9e3",
        input: { prompt: message, system_prompt: systemPrompt, max_new_tokens: 200 },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Replicate API Error:", error);
      return res.status(500).json({ error: "Failed to get a response from the AI." });
    }
    
    let prediction = await response.json();
    
    while (prediction.status !== "succeeded" && prediction.status !== "failed") {
      await new Promise(resolve => setTimeout(resolve, 250));
      const pollResponse = await fetch(prediction.urls.get, { headers: { "Authorization": `Token ${process.env.REPLICATE_API_KEY}` } });
      prediction = await pollResponse.json();
    }
    
    if (prediction.status === "failed") {
      console.error("Prediction Failed:", prediction.error);
      return res.status(500).json({ error: "AI prediction failed." });
    }

    const aiResponse = prediction.output.join("");
    res.json({ reply: aiResponse });

  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server is running on port ${PORT}`);
});
