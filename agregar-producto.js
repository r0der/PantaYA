const fs = require("fs");

const ARCHIVO_PRODUCTOS = "./data/productos.json";
const ARCHIVO_COMPLETO = "./data/productos-completo.json";

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

    const ldMatch = htmlOriginal.match(
        /<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/i
    );

    if (!ldMatch) {
        console.log("No se encontró el JSON-LD");
        return null;
    }

    let json;

    try {
        json = JSON.parse(ldMatch[1]);
    } catch (e) {
        console.log("Error parseando JSON-LD");
        console.log(ldMatch[1]);
        return null;
    }

    let droga = "";
    let accion = "";

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

    return {
        nombre: json.name || "",
        slug: json.url
            ? json.url.split("/").pop().replace(".html", "")
            : "",
        laboratorio: json.brand?.name || "",
        droga,
        accion
    };
}

(async () => {

    const slugs = process.argv.slice(2);

    if (!slugs.length) {

        console.log("\nUso:");
        console.log("node agregar-producto.js platsul-a actron600\n");

        return;

    }

    const productos = JSON.parse(
        fs.readFileSync(ARCHIVO_PRODUCTOS, "utf8")
    );

    const completos = JSON.parse(
        fs.readFileSync(ARCHIVO_COMPLETO, "utf8")
    );
    console.log(ldMatch[1]);

    let agregados = 0;
    let existentes = 0;
    let errores = 0;

    console.log("\n===============================");
    console.log("AGREGAR PRODUCTOS");
    console.log("===============================\n");

    for (const slugIngresado of slugs) {

        const slug = slugIngresado
            .replace("https://www.alfabeta.net/precio/", "")
            .replace(".html", "");

        console.log(`🔎 ${slug}...`);

        if (completos.some(p => p.slug === slug)) {

            console.log("   ✔ Ya existe\n");
            existentes++;
            continue;

        }

        try {

            const html = await obtenerProducto(slug);

            if (!html) {

                console.log("   ❌ No encontrado\n");
                errores++;
                continue;

            }

            const datos = extraerDatos(html);

            if (!datos) {

                console.log("   ❌ Error leyendo JSON-LD\n");
                errores++;
                continue;

            }

            productos.push({

                nombre: datos.nombre,
                slug: slug

            });

            completos.push({

                nombre: datos.nombre,
                slug: slug,
                laboratorio: datos.laboratorio,
                droga: datos.droga,
                accion: datos.accion

            });

            console.log(`   ✔ Agregado: ${datos.nombre}\n`);

            agregados++;

        } catch (e) {

            console.log("   ❌ Error\n");
            console.log(e);

            errores++;

        }

    }

    productos.sort((a, b) =>
        a.nombre.localeCompare(b.nombre, "es")
    );

    completos.sort((a, b) =>
        a.nombre.localeCompare(b.nombre, "es")
    );

    fs.writeFileSync(
        ARCHIVO_PRODUCTOS,
        JSON.stringify(productos, null, 2),
        "utf8"
    );

    fs.writeFileSync(
        ARCHIVO_COMPLETO,
        JSON.stringify(completos, null, 2),
        "utf8"
    );

    console.log("===============================");
    console.log(`Agregados : ${agregados}`);
    console.log(`Existían  : ${existentes}`);
    console.log(`Errores   : ${errores}`);
    console.log("===============================\n");

})();