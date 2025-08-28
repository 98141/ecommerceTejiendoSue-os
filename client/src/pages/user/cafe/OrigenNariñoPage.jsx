import React from "react";
import { motion } from "framer-motion";
import { Coffee, Leaf, Droplet, Sun, Mountain } from "lucide-react";

const cafeData = {
  title: "Café de Nariño",
  kicker: "Altura, microclima y taza brillante",
  hero: "Café de altura con acidez vivaz y notas dulces. En Nariño, los valles estrechos y las montañas crean microclimas únicos que favorecen una maduración lenta del grano.",
  stats: [
    {
      label: "Altitud típica",
      value: "1.800–2.200 m s. n. m.",
      icon: Mountain,
    },
    { label: "Proceso", value: "Lavado / Honey", icon: Droplet },
    { label: "Notas comunes", value: "Cítricos, panela, floral", icon: Coffee },
  ],
  features: [
    {
      title: "Microclimas andinos",
      desc: "Días templados y noches frías: la maduración lenta concentra azúcares y complejidad en taza.",
      icon: Sun,
    },
    {
      title: "Pequeños caficultores",
      desc: "Fincas familiares con prácticas cuidadas. Trazabilidad y selección manual del grano.",
      icon: Leaf,
    },
    {
      title: "Extracciones recomendadas",
      desc: "V60 y Chemex para resaltar claridad; espresso para una acidez cítrica elegante.",
      icon: Coffee,
    },
  ],
  steps: [
    {
      label: "Cosecha escalonada",
      text: "Recolecta selectiva de cerezas maduras para consistencia y dulzor.",
    },
    {
      label: "Beneficio cuidadoso",
      text: "Despulpe y fermentación controlada; lavado con agua limpia de montaña.",
    },
    {
      label: "Secado lento",
      text: "Tendidos o marquesinas para preservar aromas y evitar defectos.",
    },
    {
      label: "Tostión de perfil",
      text: "Tostado medio para balance: dulzor de panela y acidez cítrica.",
    },
  ],
  mapHint: "Origen: Cordillera de los Andes, depto. de Nariño (Colombia)",
};

/* ---------- UI ---------- */
function Badge({ children }) {
  return <span className="badge badge--emerald">{children}</span>;
}
function Stat({ icon: Icon, label, value }) {
  return (
    <div className="card stat">
      <div className="flex items-start gap-3">
        <span className="icon-wrap" aria-hidden>
          <Icon className="icon" size={20} />
        </span>
        <div>
          <p className="muted" style={{ fontSize: 12 }}>
            {label}
          </p>
          <p style={{ fontWeight: 600 }}>{value}</p>
        </div>
      </div>
    </div>
  );
}
function FeatureCard({ icon: Icon, title, desc }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.35 }}
      className="card feature"
    >
      <div className="flex items-center gap-3" style={{ marginBottom: 8 }}>
        <span className="icon-wrap" aria-hidden>
          <Icon className="icon" size={20} />
        </span>
        <h3 style={{ fontWeight: 600 }}>{title}</h3>
      </div>
      <p className="muted" style={{ fontSize: 14 }}>
        {desc}
      </p>
    </motion.article>
  );
}
function Timeline({ steps }) {
  return (
    <ol className="timeline">
      {steps.map((s, i) => (
        <li key={i}>
          <span className="dot dot--emerald">{i + 1}</span>
          <h4 style={{ fontWeight: 600 }}>{s.label}</h4>
          <p className="muted" style={{ fontSize: 14 }}>
            {s.text}
          </p>
        </li>
      ))}
    </ol>
  );
}
function SoftMap({ label }) {
  return (
    <div
      className="card softmap softmap--emerald"
      role="img"
      aria-label={label}
    >
      <div>
        <p className="muted" style={{ fontSize: 14 }}>
          {label}
        </p>
        <svg
          viewBox="0 0 600 260"
          className="mt-4"
          style={{ marginTop: 16, width: "100%", height: 160 }}
          aria-hidden
        >
          <defs>
            <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <rect width="600" height="260" fill="url(#g1)" />
          <g fill="none" stroke="currentColor" opacity="0.25">
            {[...Array(9)].map((_, r) => (
              <path
                key={r}
                d={`M0 ${20 + r * 24} C 180 0, 420 260, 600 ${20 + r * 24}`}
              />
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
}

/* ---------- Page ---------- */
export default function CafeNarinoPage() {
  const d = cafeData;
  return (
    <main className="origen-page theme--gris" aria-labelledby="cafe-title">
      <div className="container">
        {/* Hero */}
        <header className="hero">
          <p className="kicker">Café de montaña</p>
          <h1 id="cafe-title" className="hero__title">
            {d.title}
          </h1>
          <p className="hero__subtitle">{d.hero}</p>
        </header>

        {/* Stats */}
        <section className="grid" aria-label="Indicadores">
          {d.stats.map((s, i) => (
            <Stat key={i} icon={s.icon} label={s.label} value={s.value} />
          ))}
        </section>

        {/* Features */}
        <section
          className="grid"
          aria-label="Características"
          style={{ marginTop: 14 }}
        >
          {d.features.map((f, i) => (
            <FeatureCard key={i} icon={f.icon} title={f.title} desc={f.desc} />
          ))}
        </section>

        {/* Proceso + Mapa */}
        <section
          className="grid"
          aria-label="Proceso"
          style={{
            marginTop: 14,
            gridTemplateColumns:
              "repeat(auto-fill, minmax(min(100%, 520px), 1fr))",
          }}
        >
          <div>
            <h2 className="block__title" style={{ color: "#065f46" }}>
              Del grano a la taza
            </h2>
            <Timeline steps={d.steps} />
          </div>
          <SoftMap label={d.mapHint} />
        </section>

        <footer
          className="footnote"
          style={{ marginTop: 12, fontSize: 12, color: "#6b7280" }}
        >
          * Informativa. Sin llamadas a servicios externos. Lista para conectar
          a APIs seguras.
        </footer>
      </div>
    </main>
  );
}
