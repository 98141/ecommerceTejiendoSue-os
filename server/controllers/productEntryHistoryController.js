const mongoose = require("mongoose");
const PDFDocument = require("pdfkit");
const ProductEntryHistory = require("../models/ProductEntryHistory");

// ----------------- Helpers -----------------
function parsePaginationAndSort(query) {
  const page = Math.max(parseInt(query.page || "1", 10), 1);
  const limit = Math.min(Math.max(parseInt(query.limit || "10", 10), 1), 100);
  let sort = { createdAt: -1 };
  if (query.sort) {
    const [field, dir] = String(query.sort).split(":");
    if (field) sort = { [field]: dir === "asc" ? 1 : -1 };
  }
  return { page, limit, sort };
}

function buildFilter(q) {
  const filter = {};
  const { search, from, to, category } = q;

  if (search && String(search).trim()) {
    const rx = new RegExp(String(search).trim(), "i");
    filter.$or = [{ name: rx }, { description: rx }];
  }
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }
  if (category && mongoose.isValidObjectId(category)) filter.categories = category;

  return filter;
}

function csvEscape(v) {
  if (v === null || v === undefined) return '""';
  const s = String(v).replace(/"/g, '""');
  return `"${s}"`;
}

function formatDate(d) {
  try { return new Date(d).toLocaleString("es-CO"); } catch { return ""; }
}

function kindLabel(kind) {
  switch (kind) {
    case "CREATE": return "Creación";
    case "UPDATE_VARIANTS": return "Nuevas variantes";
    case "UPDATE_PRICE": return "Cambio de precio";
    case "UPDATE_INFO": return "Actualización";
    default: return kind || "—";
  }
}

// ----------------- Listado paginado -----------------
exports.listHistory = async (req, res) => {
  try {
    const { page, limit, sort } = parsePaginationAndSort(req.query);
    const filter = buildFilter(req.query);

    const selectList = "name price categories createdAt variants kind note";
    const [items, total] = await Promise.all([
      ProductEntryHistory.find(filter)
        .select(selectList)
        .populate("categories", "name")
        .populate("variants.size", "label")
        .populate("variants.color", "name")
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      ProductEntryHistory.countDocuments(filter),
    ]);

    res.json({ data: items, total, page, limit });
  } catch (err) {
    console.error("Error listHistory:", { message: err.message, stack: err.stack });
    res.status(500).json({ error: "Error al obtener historial" });
  }
};

// ----------------- Detalle -----------------
exports.getHistoryById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: "ID inválido" });

    const item = await ProductEntryHistory.findById(id)
      .select("name price categories createdAt variants kind note")
      .populate("categories", "name")
      .populate("variants.size", "label")
      .populate("variants.color", "name")
      .lean();

    if (!item) return res.status(404).json({ error: "No encontrado" });
    res.json(item);
  } catch (err) {
    console.error("Error getHistoryById:", { message: err.message, stack: err.stack });
    res.status(500).json({ error: "Error al obtener detalle" });
  }
};

// ----------------- Exportar CSV / PDF (con variantes + Evento) -----------------
exports.exportHistory = async (req, res) => {
  try {
    const filter = buildFilter(req.query);
    const sort = { createdAt: -1 };

    const items = await ProductEntryHistory.find(filter)
      .select("name price categories createdAt variants kind note")
      .populate("categories", "name")
      .populate("variants.size", "label")
      .populate("variants.color", "name")
      .sort(sort)
      .lean();

    const rowCount = items.reduce((acc, it) => acc + Math.max(1, (it.variants || []).length), 0);
    const MAX_ROWS = 20000;
    if (rowCount > MAX_ROWS) {
      return res.status(413).json({
        error: `Demasiadas filas a exportar (${rowCount}). Aplica filtros o reduce el rango. Límite: ${MAX_ROWS}.`,
      });
    }

    const format = String(req.query.format || "csv").toLowerCase();

    // -------- PDF --------
    if (format === "pdf") {
      const now = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="historial_${now}.pdf"`);

      const doc = new PDFDocument({ size: "A4", margin: 36 });
      const MARGIN = 36;
      doc.pipe(res);

      // Título
      doc.font("Helvetica-Bold").fontSize(16).text("Historial de productos ingresados", { align: "left" });
      doc.moveDown(0.3);
      doc.font("Helvetica").fontSize(10).fillColor("#666").text(`Generado: ${formatDate(new Date())}`);
      doc.fillColor("#000");
      doc.moveDown(0.8);

      // Columnas variantes
      const COL1_X = MARGIN;        // Talla
      const COL2_X = MARGIN + 220;  // Color
      const COL3_X = MARGIN + 400;  // Stock
      const LINE_GAP = 2;

      const ensurePageSpace = (rowsNeeded = 1) => {
        const needed = rowsNeeded * (doc.currentLineHeight() + LINE_GAP) + 12;
        const available = doc.page.height - MARGIN - doc.y;
        if (available < needed) doc.addPage();
      };

      items.forEach((it, idx) => {
        const catName = it.categories?.name || (typeof it.categories === "string" ? it.categories : "—");
        const vars = Array.isArray(it.variants) ? it.variants : [];
        const evt = kindLabel(it.kind);
        const note = it.note ? ` | Nota: ${it.note}` : "";

        // Encabezado del producto
        ensurePageSpace(4);
        doc.font("Helvetica-Bold").fontSize(11).text(`${formatDate(it.createdAt)} — ${it.name}`);
        doc.font("Helvetica").fontSize(10)
          .text(`Evento: ${evt}${note}`)
          .text(`Precio: ${it.price}   |   Categoría: ${catName}   |   # Variantes: ${vars.length}`);
        doc.moveDown(0.4);

        // Tabla de variantes
        const rows = vars.length > 0 ? vars : [{ size: null, color: null, initialStock: 0 }];

        // Header tabla
        ensurePageSpace(2);
        const startY = doc.y;
        doc.font("Helvetica-Bold");
        doc.text("Talla", COL1_X, startY);
        doc.text("Color", COL2_X, startY);
        doc.text("Stock inicial", COL3_X, startY);

        const headerBottomY = startY + doc.currentLineHeight() + 2;
        doc.moveTo(COL1_X, headerBottomY).lineTo(doc.page.width - MARGIN, headerBottomY).strokeColor("#ddd").stroke();
        doc.strokeColor("#000");

        // Filas
        doc.font("Helvetica");
        let y = headerBottomY + 4;
        for (const v of rows) {
          const sizeLabel = v?.size?.label || "—";
          const colorName = v?.color?.name || "—";
          const stockVal = (v?.initialStock ?? 0).toString();

          if (y + doc.currentLineHeight() + LINE_GAP > doc.page.height - MARGIN) {
            doc.addPage();
            const newStartY = MARGIN;
            doc.font("Helvetica-Bold");
            doc.text("Talla", COL1_X, newStartY);
            doc.text("Color", COL2_X, newStartY);
            doc.text("Stock inicial", COL3_X, newStartY);
            const newHeaderBottom = newStartY + doc.currentLineHeight() + 2;
            doc.moveTo(COL1_X, newHeaderBottom).lineTo(doc.page.width - MARGIN, newHeaderBottom).strokeColor("#ddd").stroke();
            doc.strokeColor("#000");
            doc.font("Helvetica");
            y = newHeaderBottom + 4;
          }

          doc.text(sizeLabel, COL1_X, y);
          doc.text(colorName, COL2_X, y);
          doc.text(stockVal,  COL3_X, y);

          y += doc.currentLineHeight() + LINE_GAP;
        }

        doc.y = y;
        doc.moveDown(0.4);

        // Separador
        if (idx < items.length - 1) {
          ensurePageSpace(1);
          const ySep = doc.y;
          doc.moveTo(COL1_X, ySep).lineTo(doc.page.width - MARGIN, ySep).strokeColor("#eee").stroke();
          doc.strokeColor("#000");
          doc.moveDown(0.6);
        }
      });

      doc.end();
      return;
    }

    // -------- CSV (una fila por variante + Evento) --------
    const now = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="historial_${now}.csv"`);

    const headers = [
      "Fecha",
      "Nombre",
      "Precio",
      "Categoría",
      "Evento",
      "Talla",
      "Color",
      "Stock inicial",
      "Nota",
    ];
    let csv = headers.map(csvEscape).join(",") + "\n";

    for (const it of items) {
      const catName = it.categories?.name || (typeof it.categories === "string" ? it.categories : "—");
      const vars = Array.isArray(it.variants) ? it.variants : [];
      const evt = kindLabel(it.kind);
      const note = it.note || "";

      if (vars.length === 0) {
        const row = [
          formatDate(it.createdAt),
          it.name,
          it.price,
          catName,
          evt,
          "—",
          "—",
          0,
          note,
        ];
        csv += row.map(csvEscape).join(",") + "\n";
        continue;
      }

      for (const v of vars) {
        const row = [
          formatDate(it.createdAt),
          it.name,
          it.price,
          catName,
          evt,
          v.size?.label || "—",
          v.color?.name || "—",
          v.initialStock ?? 0,
          note,
        ];
        csv += row.map(csvEscape).join(",") + "\n";
      }
    }

    res.send(csv);
  } catch (err) {
    console.error("Error exportHistory:", { message: err.message, stack: err.stack });
    res.status(500).json({ error: "Error al exportar historial" });
  }
};
