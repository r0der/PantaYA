const fs = require("fs");

const ARCHIVO_PRODUCTOS = "./data/productos.json";
const ARCHIVO_COMPLETO = "./data/productos-completo.json";

const puppeteer = require("puppeteer");

async function obtenerProducto(slug) {

    const browser = await puppeteer.launch({
        headless: false // abrir el navegador para ver qué pasa
    });

    const page = await browser.newPage();

    await page.goto(
        `https://www.alfabeta.net/precio/${slug}.html`,
        {
            waitUntil: "domcontentloaded"
        }
    );

    // Esperar 8 segundos
    await new Promise(r => setTimeout(r, 8000));

    console.log("URL:", page.url());

    const html = await page.content();

    require("fs").writeFileSync("debug.html", html);

    await browser.close();

    return html;
}

function limpiarComentarios(html) {

    return html.replace(/<!--[\s\S]*?-->/g, "");

}

function extraerDatos(html, slug) {

    const inicio = html.indexOf('<script type="application/ld+json">');

    if (inicio === -1) {
        console.log("No se encontró el JSON-LD");
        return null;
    }

    const desdeScript = html.substring(inicio);

    const fin = desdeScript.indexOf("</script>");

    const jsonTexto = desdeScript
        .substring(0, fin)
        .replace('<script type="application/ld+json">', '')
        .trim();

    let json;

    try {

        json = JSON.parse(jsonTexto);

    } catch (e) {

        console.log("Error parseando JSON");
        console.log(jsonTexto);

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
        slug: slug,

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

            fs.writeFileSync("debug.html", html, "utf8");
            console.log("HTML guardado en debug.html");

            if (!html) {

                console.log("   ❌ No encontrado\n");
                errores++;
                continue;

            }

            const datos = extraerDatos(html, slug);

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