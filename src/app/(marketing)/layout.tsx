import { SiteHeader } from "@/components/site-header";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader variant="marketing" />
      <main className="flex flex-1 flex-col">{children}</main>
    </>
  );
}
