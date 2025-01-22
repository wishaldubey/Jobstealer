require("dotenv").config();
import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { BASE_PROMPT, getSystemPrompt } from "./prompts";
import { basePrompt as nodeBasePrompt } from "./defaults/node";
import { basePrompt as reactBasePrompt } from "./defaults/react";
import cors from "cors";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

const app = express();
app.use(cors());
app.use(express.json());

app.post("/template", async (req, res) => {
  const prompt = req.body.prompt;

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
    systemInstruction: {
      role: "system",
      parts: [
        {
          text: "Return either node or react based on what do you think this project should be. Only return a single word either 'node' or 'react'. Do not return anything extra",
        },
      ],
    },
  });

  const answer = result.response.text().trim().toLowerCase(); // react or node

  if (answer === "react") {
    res.json({
      prompts: [
        BASE_PROMPT,
        `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`,
      ],
      uiPrompts: [reactBasePrompt],
    });
    return;
  }

  if (answer === "node") {
    res.json({
      prompts: [
        `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`,
      ],
      uiPrompts: [nodeBasePrompt],
    });
    return;
  }

  res.status(403).json({ message: "You can't access this" });
});

app.post("/chat", async (req, res) => {
  const messages = req.body.messages;

  const result = await model.generateContent({
    contents: messages.map((msg: any) => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    })),
    systemInstruction: {
      role: "system",
      parts: [{ text: getSystemPrompt() }],
    },
  });

  console.log(result);

  res.json({
    response: result.response.text(),
  });
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
