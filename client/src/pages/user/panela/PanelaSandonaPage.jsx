import React2 from "react";
import { motion as motion2 } from "framer-motion";
import {
  Leaf as Leaf2,
  MapPin as MapPin2,
  Factory as Factory2,
  CheckCircle2 as Check2,
  Sprout as Sprout2,
} from "lucide-react";

const panelaData = {
  title: "Panela de Sandoná",
  kicker: "Caña, tradición y energía natural",
  hero: "Sandoná y su entorno combinan tradición panelera con oficio artesanal. La panela conserva minerales y el sabor profundo de la caña.",
  stats: [
    { label: "Materia prima", value: "Caña de azúcar", icon: Sprout2 },
    { label: "Proceso", value: "Trapiche artesanal", icon: Factory2 },
    { label: "Uso típico", value: "Bebidas, postres y cocina", icon: Leaf2 },
  ],
  features: [
    {
      title: "Trapiche tradicional",
      desc: "Molienda, clarificación y evaporación en pailas. Resultado: bloques de sabor auténtico.",
      icon: Factory2,
    },
    {
      title: "Cultura local",
      desc: "Economía familiar y ferias regionales que mantienen vivo el oficio.",
      icon: MapPin2,
    },
    {
      title: "Alternativa natural",
      desc: "Endulzante sin refinar, ideal para aguapanela, masato y recetas caseras.",
      icon: Check2,
    },
  ],
  steps: [
    {
      label: "Corte de caña",
      text: "Selección en el punto óptimo de madurez para un jugo dulce y limpio.",
    },
    {
      label: "Molienda y jugo",
      text: "El trapiche extrae el jugo que luego se clarifica y filtra.",
    },
    {
      label: "Evaporación y punto",
      text: "Concentración en pailas hasta la miel; bateo para lograr textura.",
    },
    {
      label: "Moldeo y secado",
      text: "Vertido en moldes, enfriado y reposo hasta el empaque.",
    },
  ],
  mapHint: "Origen: Sandoná, Nariño (Colombia) y alrededores",
};

function Badge2({ children }) {
  return (
    <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 px-3 py-1 text-xs font-semibold tracking-wide border border-amber-200">
      {children}
    </span>
  );
}

function Stat2({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-zinc-300 p-4 bg-white shadow-sm">
      <div className="mt-1 rounded-xl bg-zinc-100 p-2" aria-hidden>
        <Icon className="h-5 w-5 text-zinc-700" />
      </div>
      <div>
        <p className="text-xs text-zinc-500">{label}</p>
        <p className="font-semibold text-zinc-900">{value}</p>
      </div>
    </div>
  );
}

function FeatureCard2({ icon: Icon, title, desc }) {
  return (
    <motion2.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl border border-zinc-300 p-5 bg-white hover:shadow-lg"
    >
      <div className="flex items-center gap-3 mb-2">
        <span className="rounded-xl bg-zinc-100 p-2" aria-hidden>
          <Icon className="h-5 w-5 text-zinc-700" />
        </span>
        <h3 className="font-semibold text-zinc-900">{title}</h3>
      </div>
      <p className="text-sm text-zinc-600">{desc}</p>
    </motion2.div>
  );
}

function Timeline2({ steps }) {
  return (
    <ol className="relative border-s border-zinc-300 ml-3">
      {steps.map((s, i) => (
        <li key={i} className="mb-6 ms-6">
          <span className="absolute -start-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-600 text-white ring-4 ring-white">
            {i + 1}
          </span>
          <h4 className="font-semibold text-zinc-900">{s.label}</h4>
          <p className="text-sm text-zinc-600">{s.text}</p>
        </li>
      ))}
    </ol>
  );
}

function SoftMap2({ label }) {
  return (
    <div
      role="img"
      aria-label={label}
      className="relative isolate overflow-hidden rounded-3xl border border-zinc-300 p-6 bg-white"
    >
      {/* Gris suave + toque ámbar muy sutil */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_450px_at_10%_-10%,rgba(107,114,128,.18),transparent),radial-gradient(800px_400px_at_90%_110%,rgba(245,158,11,.12),transparent)]" />
      <div className="relative">
        <p className="text-sm text-zinc-600">{label}</p>
        <svg
          viewBox="0 0 600 260"
          className="mt-4 h-40 w-full text-zinc-400"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <defs>
            <linearGradient id="g2" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <rect width="600" height="260" fill="url(#g2)" />
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

export function PanelaSandonaPage() {
  const d = panelaData;
  return (
    <main className="min-h-screen bg-zinc-100 text-zinc-800">
      <div className="mx-auto max-w-6xl p-6 md:p-10 space-y-10">
        {/* Encabezado */}
        <header className="text-center space-y-2">
          <Badge2>Tradición panelera</Badge2>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-900">
            {d.title}
          </h1>
          <p className="text-zinc-600 max-w-3xl mx-auto">{d.hero}</p>
        </header>

        {/* Stats */}
        <section className="grid md:grid-cols-3 gap-4" aria-label="Indicadores">
          {d.stats.map((s, i) => (
            <Stat2 key={i} icon={s.icon} label={s.label} value={s.value} />
          ))}
        </section>

        {/* Features */}
        <section
          aria-label="Características"
          className="grid md:grid-cols-3 gap-4"
        >
          {d.features.map((f, i) => (
            <FeatureCard2 key={i} icon={f.icon} title={f.title} desc={f.desc} />
          ))}
        </section>

        {/* Proceso + Mapa suave */}
        <section
          aria-label="Proceso"
          className="grid md:grid-cols-2 gap-6 items-start"
        >
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-900">
              De la caña a la panela
            </h2>
            <Timeline2 steps={d.steps} />
          </div>
          <SoftMap2 label={d.mapHint} />
        </section>
      </div>
    </main>
  );
}
