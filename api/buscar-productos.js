import productos from '../data/productos-completo.json' with { type: 'json' };

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://vizta.lat');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { q } = req.query;

  if (!q || q.trim().length < 2) {
    return res.status(200).json({ resultados: [] });
  }

  const query = normalizar(q);

  const resultados = productos
    .filter(p => {
      return (
        normalizar(p.nombre || '').includes(query) ||
        normalizar(p.droga || '').includes(query) ||
        normalizar(p.laboratorio || '').includes(query) ||
        normalizar(p.accion || '').includes(query)
      );
    })
    .map(p => ({
      nombre: p.nombre,
      droga: p.droga,
      laboratorio: p.laboratorio,
      slug: p.slug
    }));

  return res.status(200).json({
  total: resultados.length,
  resultados
});
}


function normalizar(texto) {
  return texto
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}