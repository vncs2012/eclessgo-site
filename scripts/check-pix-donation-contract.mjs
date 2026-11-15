import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

// Modelo 8: o PIX vive na secao "Contribuir" (community-contribute) da pagina da Comunidade;
// o cartao e o mesmo QR local. Os textos vem das mensagens, nao de literais no componente.
const contribute = read("src/components/site/community-contribute.tsx");
const detailPage = read("src/app/comunidades/[slug]/page.tsx");
const qrCard = read("src/components/site/pix-key-donation-card.tsx");
const messages = JSON.parse(read("src/messages/pt-BR.json")).communityPage.pix;

const checks = [
  [contribute.includes("!donationsEnabled || !pixKey"), "contribute section gates PIX on both availability flags"],
  [detailPage.includes("church.donationsEnabled && Boolean(church.pixKey)"), "detail menu gates PIX on both availability flags"],
  [qrCard.includes("createPixQrMatrix") && messages.copy.startsWith("Copiar chave"), "QR and copy actions are local UI actions"],
  [messages.liability.includes("não processamos o pagamento") && messages.liability.includes("confirmamos"), "payment processing disclaimer is present"],
  [!/aceita contribuições/.test(JSON.stringify(messages)), "legacy acceptance claim is absent"],
  [!/asaas|checkout/i.test(contribute + qrCard), "paused ASAAS checkout is not referenced"],
];

const failures = checks.filter(([passed]) => !passed).map(([, message]) => message);
if (failures.length > 0) {
  console.error(`PIX donation contract failed:\n- ${failures.join("\n- ")}`);
  process.exitCode = 1;
} else {
  console.log(`PIX donation contract passed (${checks.length} checks).`);
}
