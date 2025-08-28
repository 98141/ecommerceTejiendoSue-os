import React from "react";

const RECIPES = [
  {
    id: "aguapanela-caliente",
    category: "Bebidas",
    title: "Aguapanela caliente clásica",
    time: "10 min",
    servings: "2–3",
    difficulty: "Fácil",
    tags: ["Tradicional", "Energética"],
    ingredients: [
      "1 litro de agua",
      "120 g de panela (ajusta al gusto)",
      "1 astilla pequeña de canela",
      "Opcional: unas gotas de limón",
    ],
    steps: [
      "Calienta el agua con la canela hasta hervir.",
      "Agrega la panela y mezcla hasta disolver.",
      "Sirve. Si usas limón, añádelo fuera del fuego.",
    ],
    note: "Añadir el limón al final ayuda a preservar su vitamina C.",
  },
  {
    id: "aguapanela-fria-limon",
    category: "Bebidas",
    title: "Aguapanela fría con limón",
    time: "15 min + frío",
    servings: "4",
    difficulty: "Fácil",
    tags: ["Refrescante"],
    ingredients: [
      "1 litro de agua",
      "100–120 g de panela",
      "Jugo de 2 limones",
      "Hielo al gusto",
    ],
    steps: [
      "Disuelve la panela en 250 ml de agua caliente.",
      "Mezcla con el agua restante y deja entibiar.",
      "Añade jugo de limón y hielos. Refrigera y sirve frío.",
    ],
    note: "Evita hervir el limón para mantener su frescura y aporte de vitamina C.",
  },
  {
    id: "panelitas-leche",
    category: "Postres",
    title: "Panelitas de leche",
    time: "45 min",
    servings: "≈15 unidades",
    difficulty: "Media",
    tags: ["Dulce tradicional"],
    ingredients: [
      "500 ml de leche",
      "250 g de panela rallada",
      "1 cda de mantequilla",
      "1 cdita de vainilla",
    ],
    steps: [
      "Calienta la leche con la panela a fuego medio hasta disolver.",
      "Agrega mantequilla y vainilla; cocina mezclando hasta espesar (miel espesa).",
      "Vierte en molde engrasado, deja templar y corta en cuadritos.",
    ],
    note: "Remueve de forma constante para evitar que se pegue.",
  },
  {
    id: "natilla-panela",
    category: "Postres",
    title: "Natilla con panela",
    time: "35 min",
    servings: "6",
    difficulty: "Media",
    tags: ["Navideña"],
    ingredients: [
      "1 litro de leche",
      "200 g de panela rallada",
      "100 g de maicena",
      "1 astilla de canela",
      "1 cdita de esencia de vainilla",
      "Pizca de sal",
    ],
    steps: [
      "Disuelve la maicena en 250 ml de leche fría.",
      "Hierve la leche restante con canela y panela hasta disolver.",
      "Retira canela, añade la mezcla de maicena sin dejar de mover.",
      "Cocina a fuego bajo hasta espesar; incorpora vainilla y sal. Vierte en molde.",
    ],
    note: "Engrasa ligeramente el molde para un desmolde más limpio.",
  },
];

// ============================ UI Components ============================
function Badge({ children }) {
  return <span className="badge">{children}</span>;
}

function StatChip({ label }) {
  return <span className="stat-chip" aria-label={label}>{label}</span>;
}

function Tag({ children }) {
  return <span className="tag">{children}</span>;
}

function RecipeCard({ r }) {
  return (
    <article className="card" id={r.id}>
      <header className="card__header">
        <div className="card__labels">
          <Badge>{r.category}</Badge>
          <div className="card__stats">
            <StatChip label={r.time} />
            <StatChip label={`Rinde: ${r.servings}`} />
            <StatChip label={r.difficulty} />
          </div>
        </div>
        <h3 className="card__title">{r.title}</h3>
        {r.tags?.length > 0 && (
          <div className="card__tags" role="list" aria-label="Etiquetas">
            {r.tags.map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
        )}
      </header>

      <div className="card__content">
        <section className="card__section" aria-labelledby={`${r.id}-ing`}>
          <h4 id={`${r.id}-ing`} className="section__title">Ingredientes</h4>
          <ul className="list list--bullets">
            {r.ingredients.map((it, i) => (
              <li key={i}>{it}</li>
            ))}
          </ul>
        </section>

        <section className="card__section" aria-labelledby={`${r.id}-prep`}>
          <h4 id={`${r.id}-prep`} className="section__title">Preparación</h4>
          <ol className="list list--steps">
            {r.steps.map((st, i) => (
              <li key={i}>{st}</li>
            ))}
          </ol>
          {r.note && <p className="note">{r.note}</p>}
        </section>
      </div>
    </article>
  );
}

export default function PanelaRecipesPage() {
  const bebidas = RECIPES.filter((r) => r.category === "Bebidas");
  const postres = RECIPES.filter((r) => r.category === "Postres");

  return (
    <main className="recipes-page recipes--gris" aria-labelledby="recipes-title">
      <div className="container">
        {/* Hero / encabezado */}
        <header className="hero">
          <p className="kicker">Panela</p>
          <h1 id="recipes-title" className="hero__title">Recetas con Panela</h1>
          <p className="hero__subtitle">
            Preparaciones sencillas y auténticas. 
          </p>
          <nav className="hero__nav" aria-label="Secciones">
            <a href="#bebidas" className="hero__link">Bebidas</a>
            <a href="#postres" className="hero__link">Postres</a>
          </nav>
        </header>

        {/* Bebidas */}
        <section id="bebidas" className="block">
          <h2 className="block__title">Bebidas</h2>
          <div className="grid">
            {bebidas.map((r) => (
              <RecipeCard key={r.id} r={r} />
            ))}
          </div>
        </section>

        {/* Postres */}
        <section id="postres" className="block">
          <h2 className="block__title">Postres</h2>
          <div className="grid">
            {postres.map((r) => (
              <RecipeCard key={r.id} r={r} />
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}
