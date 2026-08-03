export default async function handler(req, res) {

  res.setHeader('Access-Control-Allow-Origin', 'https://vizta.lat');
  res.setHeader('Access-Control-Allow-Methods', 'GET');


  const { nombre, droga, laboratorio, accion } = req.query;


  if (!nombre) {
    return res.status(400).json({
      error: "Falta nombre del producto"
    });
  }


  const prompt = `
Actuá como asistente farmacológico profesional.

Generá una descripción breve y clara para un vademécum digital orientado a profesionales de la salud. Teniendo en cuenta el sistema D.A.V.I.D. muy famoso en el área de medicina para estudiar una molécula.

Producto:
${nombre}

Droga:
${droga || "No informado"}

Laboratorio:
${laboratorio || "No informado"}

Acción terapéutica:
${accion || "No informado"}

Incluir:

- Qué es el medicamento.
- Principio activo y grupo farmacológico.
- Mecanismo de acción resumido.
- Usos habituales.
- Información relevante para profesionales.

No inventes dosis.
No reemplaces prospectos oficiales.
No hagas recomendaciones individuales a pacientes.

Responder en español en lenguaje natural y básico para público que no es médico.
`;


  try {

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" 
      + process.env.GEMINI_API_KEY,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ]
        })

      }
    );


    const data = await response.json();


    const texto =
      data.candidates?.[0]?.content?.parts?.[0]?.text;


    return res.status(200).json({
      texto: texto || "No se pudo generar información."
    });


  } catch(error) {

    console.error(error);

    return res.status(500).json({
      error:"Error generando información con IA"
    });

  }

}