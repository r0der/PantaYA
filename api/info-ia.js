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
        model: "gemini-3.1-flash-lite"
    });



    const prompt = `

Actuá como asistente farmacológico profesional especializado en información para visitadores médicos y profesionales de la salud.

Generá una ficha técnica clara, estructurada y profesional sobre el medicamento indicado.

Producto:
${nombre}

Principio activo:
${droga || "No informado"}

Laboratorio:
${laboratorio || "No informado"}

Acción terapéutica:
${accion || "No informado"}


Organizá la información utilizando la técnica D.A.V.I.D.:

D - DESCRIPCIÓN
Explicá qué es el medicamento.
Incluir:
- Nombre comercial.
- Principio activo.
- Concentración (si está disponible).
- Forma farmacéutica (si está disponible).
- Grupo terapéutico.

A - ACCIÓN
Describí:
- Mecanismo de acción.
- Cómo actúa el principio activo.
- Efecto terapéutico principal.

V - VENTAJAS
Destacá:
- Beneficios diferenciales del producto.
- Características que pueden representar ventajas frente a alternativas terapéuticas.
- Aspectos relevantes para una presentación médica.

(No inventar ventajas comerciales no comprobadas. Basarse únicamente en características farmacológicas conocidas).

I - INDICACIONES
Describí:
- Principales indicaciones terapéuticas.
- Patologías o cuadros clínicos donde se utiliza.
- Perfil general de pacientes en los que puede indicarse.

D - DOSIFICACIÓN
Informá:
- Pautas habituales de administración.
- Frecuencia de uso.
- Duración aproximada cuando corresponda.

Si no existe información suficiente o puede variar según paciente, aclararlo.
No indicar una pauta personalizada ni realizar recomendaciones médicas individuales.


IMPORTANTE:
- Usar lenguaje profesional orientado a visitadores médicos.
- Ser claro y conciso.
- No reemplazar el prospecto oficial.
- No inventar datos que no estén disponibles.
- No realizar diagnósticos ni recomendaciones personales.
- Separar la información en títulos y viñetas para facilitar la lectura.

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