import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader variant="marketing" />
      <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-6 bg-muted/30 px-4 py-12">
        <div className="flex w-full flex-col items-center gap-6">{children}</div>
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/" className="underline-offset-4 hover:underline">
            Voltar ao site
          </Link>
        </p>
      </div>
    </>
  );
}
