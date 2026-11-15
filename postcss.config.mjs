const config = {
  plugins: {
    // A raiz da varredura de classes fica em src/app/globals.css
    // (`@import "tailwindcss" source("../..")`), relativa ao próprio CSS.
    // Não use `base` derivado de import.meta.url aqui: o Turbopack executa uma
    // cópia deste arquivo dentro de .next/, e o Tailwind passaria a varrer o
    // cache de build — gerando CSS inválido e vazando workers do PostCSS.
    "@tailwindcss/postcss": {},
  },
};

export default config;
