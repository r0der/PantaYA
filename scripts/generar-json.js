const fs = require("fs");

async function obtenerProducto(slug) {
    const url = `https://www.alfabeta.net/precio/${slug}.html`;

    const response = await fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0"
        }
    });

    if (!response.ok) return null;

    const buffer = await response.arrayBuffer();
    return new TextDecoder("iso-8859-1").decode(buffer);
}

function limpiarComentarios(html) {
    return html.replace(/<!--[\s\S]*?-->/g, "");
}

function extraerDatos(htmlOriginal) {
    const html = limpiarComentarios(htmlOriginal);

    let laboratorio = "";
    let droga = "";
    let accion = "";

    const ldMatch = htmlOriginal.match(
        /<script type="application\/ld\+json">([\s\S]*?)<\/script>/
    );

    if (ldMatch) {
        try {
            const json = JSON.parse(ldMatch[1]);

            laboratorio = json.brand?.name || "";

            if (json.additionalProperty) {
                const mono = json.additionalProperty.find(
                    p => p.name === "Monodroga"
                );

                const acc = json.additionalProperty.find(
                    p => p.name === "Accion terapeutica"
                );

                droga = mono?.value || "";
                accion = acc?.value || "";
            }
        } catch (e) {}
    }

    return {
        laboratorio,
        droga,
        accion
    };
}

const productos = JSON.parse(
    fs.readFileSync("./data/productos.json", "utf8")
);

console.log(`Hay ${productos.length} productos.`);

(async () => {

    const resultado = [];

    for (let i = 0; i < productos.length; i++) {

        const p = productos[i];

        console.log(`${i + 1}/${productos.length} - ${p.nombre}`);

        try {

            const html = await obtenerProducto(p.slug);

            if (!html) continue;

            const datos = extraerDatos(html);

            resultado.push({
                nombre: p.nombre,
                slug: p.slug,
                laboratorio: datos.laboratorio,
                droga: datos.droga,
                accion: datos.accion
            });

        } catch (e) {
            console.log("Error:", p.nombre);
        }

        if ((i + 1) % 50 === 0) {

            fs.writeFileSync(
                "./data/productos-completo.json",
                JSON.stringify(resultado, null, 2),
                "utf8"
            );

            console.log("Guardado parcial...");
        }
    }

    fs.writeFileSync(
        "./data/productos-completo.json",
        JSON.stringify(resultado, null, 2),
        "utf8"
    );

    console.log("FINALIZADO");

})();