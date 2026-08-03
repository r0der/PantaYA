import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {

  try {

    const genAI = new GoogleGenerativeAI(
      process.env.GEMINI_API_KEY
    );

    const modelos = await genAI.listModels();

    return res.status(200).json(modelos);

  } catch(error) {

    return res.status(500).json({
      error: error.message
    });

  }

}