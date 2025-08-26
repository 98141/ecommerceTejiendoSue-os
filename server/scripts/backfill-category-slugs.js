require("dotenv").config();
const mongoose = require("mongoose");
const Category = require("../models/Category");
const { slugify } = require("../models/Category");

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true, useUnifiedTopology: true,
    });

    const cats = await Category.find();
    const seen = new Map();

    for (const c of cats) {
      let s = c.slug || slugify(c.name || "");
      if (!s) continue;

      // Evita duplicados de slug
      let base = s, n = 2;
      while (seen.has(s) || await Category.findOne({ slug: s, _id: { $ne: c._id } })) {
        s = `${base}-${n++}`;
      }
      seen.set(s, true);

      c.slug = s.toLowerCase();
      if (typeof c.isActive === "undefined") c.isActive = true;
      await c.save();
      console.log(`✔ ${c.name} → ${c.slug}`);
    }

    console.log("Backfill OK");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
