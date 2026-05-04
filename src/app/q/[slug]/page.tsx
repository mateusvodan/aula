import { notFound } from "next/navigation";
import type { Metadata } from "next";

import PublicRuntime from "@/components/funnel-runtime/public-funnel";
import { fetchPublishedBySlug } from "@/lib/data/published";
import type { FunnelSettings } from "@/types/funnel";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  const data = await fetchPublishedBySlug(slug);
  const titleBase = data?.funnel?.name ?? "Quiz público";

  return {
    title: titleBase,
    description: "Experiência interativa guiada.",
  };
}

export default async function PublicQuizPage({ params }: PageProps) {
  const { slug } = await params;

  const payload = await fetchPublishedBySlug(slug);


  if (!payload) {


    notFound();


  }



  const { funnel, blocks, connections } = payload;


  return (
    <PublicRuntime
      slug={slug}
      funnel={{
        id: funnel.id,

        name: funnel.name,

        settings: funnel.settings


          ? (funnel.settings as unknown as FunnelSettings)


          : null,

      }}
      blocks={blocks}
      connections={connections}


    />


  );



}


