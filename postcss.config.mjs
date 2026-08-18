import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url));

const config = {
  plugins: {
    // Evita que a varredura de classes dependa do diretório em que o Next foi
    // iniciado — este repositório contém mais de uma aplicação Node.
    "@tailwindcss/postcss": { base: projectRoot },
  },
};

export default config;
