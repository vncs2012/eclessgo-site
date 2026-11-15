import { RegisterChurchForm } from "@/components/site/register-church-form";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";

export default function RegisterChurchPage() {
  return (
    <div className="min-h-screen bg-eg-app text-eg-text">
      <SiteHeader variant="minimal" />
      <main className="mx-auto w-full max-w-[var(--eg-content-max)] px-4 pb-16 pt-8 sm:px-6 lg:px-10 lg:pb-20">
        <RegisterChurchForm />
      </main>
      <SiteFooter />
    </div>
  );
}
