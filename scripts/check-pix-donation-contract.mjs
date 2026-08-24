import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const contactCard = read("src/components/site/church-contact-card.tsx");
const detailPage = read("src/app/igrejas/[slug]/page.tsx");
const qrCard = read("src/components/site/pix-key-donation-card.tsx");

const checks = [
  [contactCard.includes("donationsEnabled && pixKey"), "contact card gates PIX on both availability flags"],
  [detailPage.includes("church.donationsEnabled && church.pixKey"), "detail status gates PIX on both availability flags"],
  [qrCard.includes("createPixQrMatrix") && qrCard.includes("Copiar chave PIX"), "QR and copy actions are local UI actions"],
  [qrCard.includes("Não processamos o pagamento") && qrCard.includes("confirmamos"), "payment processing disclaimer is present"],
  [!contactCard.includes("aceita contribuições"), "legacy acceptance claim is absent"],
];

const failures = checks.filter(([passed]) => !passed).map(([, message]) => message);
if (failures.length > 0) {
  console.error(`PIX donation contract failed:\n- ${failures.join("\n- ")}`);
  process.exitCode = 1;
} else {
  console.log(`PIX donation contract passed (${checks.length} checks).`);
}
