import { GoogleGenerativeAI } from "@google/generative-ai";


export default async function handler(req, res) {

  res.setHeader(
    'Access-Control-Allow-Origin',
    'https://vizta.lat'
  );

  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET'
  );


  const {
    nombre,
    droga,
    laboratorio,
    accion
  } = req.query;


  if (!nombre) {

    return res.status(400).json({
      error: "Falta nombre del producto"
    });

  }


  try {


    const genAI = new GoogleGenerativeAI(
      process.env.GEMINI_API_KEY
    );


    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash-lite"
    });



    const prompt = `

Actuá como asistente farmacológico profesional.

Generá una descripción breve y clara para un vademécum digital orientado a profesionales de la salud. Teniendo en cuenta el sistema D.A.V.I.D. muy famoso en el área de medicina para estudiar una molécula.

Medicamento:
${nombre}

Principio activo:
${droga || "No informado"}

Laboratorio:
${laboratorio || "No informado"}

Acción terapéutica:
${accion || "No informado"}


Responder con:

• Qué es el medicamento.
• Grupo farmacológico.
• Cómo actúa (resumen).
• Usos habituales.
• Información relevante para profesionales.


No indicar dosis.
No realizar recomendaciones individuales.
No reemplazar información oficial del prospecto.

Usar lenguaje profesional pero fácil de leer.

`;



    const result = await model.generateContent(prompt);


    const texto =
      result.response.text();



    return res.status(200).json({
      texto
    });



  } catch(error) {

  console.error("ERROR GEMINI:", error);

  return res.status(500).json({
    error: error.message
  });

}

}