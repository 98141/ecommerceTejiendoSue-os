export const pdfTheme = {
  // Cambia a "portrait" si quieres vertical
  orientation: "landscape",

  font: {
    family: "helvetica",
    titleSize: 14,
    metaSize: 10,
    tableSize: 9,
  },

  colors: {
    headBg: [10, 102, 194],      // azul header
    headTx: [255, 255, 255],     // blanco texto header
    grid:   [220, 226, 235],     // líneas tabla
    zebra:  [244, 248, 254],     // fila alterna
    title:  [0, 0, 0],

    // Mini-tabla variante:
    variantHeaderBg: [235, 240, 248],
    variantHeaderTx: [31, 45, 61],
    variantTx:        [55, 65, 81],
  },

  table: {
    padding: 2.5,
    marginTop: 18,
    columnWidths: {
      // Detalle de pedido
      order: {
        product: 80,
        variant: 50,
        qty: 22,
        price: 30,
        subtotal: 32,
      },
      // Historial
      history: {
        date: 36,
        user: 40,
        product: 52,
        variant: 48,
        unitPrice: 28,
        qty: 18,
        total: 30,
        stock: 24,
        status: 28,
      },
    },
  },
};

// Helpers para aplicar el tema a autoTable
export const buildTableBaseStyles = (t) => ({
  styles: {
    fontSize: t.font.tableSize,
    cellPadding: t.table.padding,
    lineColor: t.colors.grid,
    lineWidth: 0.2,
    valign: "middle",
  },
  headStyles: {
    fillColor: t.colors.headBg,
    textColor: t.colors.headTx,
    lineWidth: 0,
  },
  alternateRowStyles: {
    fillColor: t.colors.zebra,
  },
});
