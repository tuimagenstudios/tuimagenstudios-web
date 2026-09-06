export const CATALOG = {
  "prueba-interna": {
    title: "Prueba interna de compra — Tuimagenstudios",
    unit_price: 900,
    currency_id: "ARS",
    filePath: "nutrir-sin-hambre.pdf"
  },
  "migas-de-libertad": {
    title: "Migas de Libertad — Recetas sin gluten y guía para vivir la celiaquía",
    unit_price: 4900,
    currency_id: "ARS",
    filePath: "migas-de-libertad.pdf"
  },
  "tu-keto-hoy": {
    title: "Tu Keto Hoy — Recetario digital",
    unit_price: 4900,
    currency_id: "ARS",
    filePath: "tu-keto-hoy.pdf"
  },
  "nutrir-sin-hambre": {
    title: "Nutrir sin Hambre — Guía digital",
    unit_price: 4900,
    currency_id: "ARS",
    filePath: "nutrir-sin-hambre.pdf"
  },
  "coleccion-libros": {
    title: "Colección completa — Tres libros digitales",
    unit_price: 12000,
    currency_id: "ARS",
    filePaths: ["migas-de-libertad.pdf", "tu-keto-hoy.pdf", "nutrir-sin-hambre.pdf"]
  }
};

export function getProduct(productId) {
  return CATALOG[productId] || null;
}
