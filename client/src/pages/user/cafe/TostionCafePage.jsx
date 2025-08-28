import React from "react";
import { motion } from "framer-motion";
import { Flame, Thermometer, Timer, Gauge, Coffee } from "lucide-react";

/** Página informativa de Tostión (sin backend) */
const ROAST_LEVELS = [
  {
    title: "Claro (City)",
    icon: Coffee,
    notes:
      "Acidez alta, dulzor medio, cuerpo ligero. Ideal para filtrados (V60, Chemex, Kalita).",
    range: "Color claro / primer crack reciente",
  },
  {
    title: "Medio (City+ / Full City)",
    icon: Coffee,
    notes:
      "Balance acidez–dulzor, cuerpo medio. Versátil: filtrados y espresso moderno.",
    range: "Después del primer crack, sin aceites visibles",
  },
  {
    title: "Medio-oscuro (Full City+)",
    icon: Coffee,
    notes:
      "Menos acidez, más chocolate/caramelo; cuerpo alto. Espresso clásico, prensa.",
    range: "Cerca del segundo crack, aceites muy tenues",
  },
  {
    title: "Oscuro (Vienna/Français)",
    icon: Coffee,
    notes:
      "Tostado dominante, amargor notable; cuerpo pesado. Espresso intenso y bebidas con leche.",
    range: "Aceites visibles, notas ahumadas",
  },
];

const STAGES = [
  {
    step: "Carga y secado",
    icon: Thermometer,
    temp: "Tambor ~190–205 °C",
    signals: "Chirrido leve, grano verde amarillento. Evaporación de humedad.",
    goal: "Secar sin ‘tostar’ aún; base para Maillard estable.",
  },
  {
    step: "Maillard",
    icon: Gauge,
    temp: "Grano ~140–160 °C",
    signals: "Aromas a pan/tostado; color avanza a canela.",
    goal: "Desarrollar precursores de sabor y dulzor.",
  },
  {
    step: "Primer crack",
    icon: Flame,
    temp: "Grano ~196–203 °C",
    signals: "‘Pops’ audibles; liberación de vapor y CO₂.",
    goal: "Anclar punto de desarrollo según perfil deseado.",
  },
  {
    step: "Desarrollo",
    icon: Timer,
    temp: "Grano 205–215 °C (según objetivo)",
    signals: "Dulzor–acidez–cuerpo en equilibrio dinámico.",
    goal: "Definir nivel de tostión (City / City+ / Full City…).",
  },
  {
    step: "Enfriado",
    icon: Thermometer,
    temp: "Rápido a ambiente",
    signals: "Detener reacciones; preservar fragancias.",
    goal: "Estabilizar y evitar ‘horneado’.",
  },
];

function Kicker({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
      {children}
    </span>
  );
}

function StatChip({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-zinc-300 bg-white p-3 shadow-sm">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-zinc-700" />
        <p className="text-xs text-zinc-500">{label}</p>
      </div>
      <p className="mt-1 font-semibold text-zinc-900">{value}</p>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, notes, range }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl border border-zinc-300 bg-white p-5 hover:shadow-lg"
    >
      <div className="mb-2 flex items-center gap-3">
        <span className="rounded-xl bg-zinc-100 p-2" aria-hidden>
          <Icon className="h-5 w-5 text-zinc-700" />
        </span>
        <h3 className="font-semibold text-zinc-900">{title}</h3>
      </div>
      <p className="text-sm text-zinc-600">{notes}</p>
      <p className="mt-2 text-xs text-zinc-500">Rango: {range}</p>
    </motion.article>
  );
}

function StageRow({ s, index }) {
  const Icon = s.icon;
  return (
    <div className="grid grid-cols-1 gap-3 rounded-2xl border border-zinc-300 bg-white p-4 shadow-sm sm:grid-cols-12">
      <div className="flex items-center gap-2 sm:col-span-3">
        <span className="rounded-lg bg-zinc-100 p-2" aria-hidden>
          <Icon className="h-5 w-5 text-zinc-700" />
        </span>
        <p className="font-semibold text-zinc-900">
          {index + 1}. {s.step}
        </p>
      </div>
      <div className="sm:col-span-3">
        <p className="text-xs text-zinc-500">Temperatura</p>
        <p className="font-medium text-zinc-800">{s.temp}</p>
      </div>
      <div className="sm:col-span-3">
        <p className="text-xs text-zinc-500">Señales</p>
        <p className="text-zinc-700">{s.signals}</p>
      </div>
      <div className="sm:col-span-3">
        <p className="text-xs text-zinc-500">Objetivo</p>
        <p className="text-zinc-700">{s.goal}</p>
      </div>
    </div>
  );
}

export default function CafeTostionPage() {
  return (
    <main className="min-h-screen bg-zinc-100 text-zinc-800">
      <div className="mx-auto max-w-6xl space-y-10 p-6 md:p-10">
        {/* Hero */}
        <header className="space-y-2 text-center">
          <Kicker>Tostión de café</Kicker>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 md:text-4xl">
            Perfiles y etapas de tostión
          </h1>
          <p className="mx-auto max-w-3xl text-zinc-600">
            Guía breve para entender niveles (claro → oscuro) y el flujo de
            tostión. Valores orientativos: ajusta según equipo y origen.
          </p>
        </header>

        {/* Stats rápidos */}
        <section className="grid gap-4 sm:grid-cols-3" aria-label="Indicadores">
          <StatChip icon={Thermometer} label="Temperatura de tambor (carga)" value="190–205 °C" />
          <StatChip icon={Timer} label="Proporción de desarrollo" value="15–25% del total" />
          <StatChip icon={Gauge} label="Duración total común" value="8–12 min" />
        </section>

        {/* Niveles de tostión */}
        <section aria-label="Niveles de tostión" className="space-y-3">
          <h2 className="text-xl font-bold text-zinc-900">Niveles de tostión</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {ROAST_LEVELS.map((r) => (
              <FeatureCard key={r.title} icon={r.icon} title={r.title} notes={r.notes} range={r.range} />
            ))}
          </div>
        </section>

        {/* Etapas / Curva (resumen) */}
        <section aria-label="Curva de tostión" className="space-y-3">
          <h2 className="text-xl font-bold text-zinc-900">Curva de tostión (resumen)</h2>
          <div className="space-y-3">
            {STAGES.map((s, i) => (
              <StageRow key={s.step} s={s} index={i} />
            ))}
          </div>
          <p className="text-xs text-zinc-500">
            * Mantén un enfriado rápido para evitar horneado; deja reposar el café 24–72 h antes de espresso.
          </p>
        </section>
      </div>
    </main>
  );
}
