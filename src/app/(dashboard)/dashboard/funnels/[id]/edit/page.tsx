import { notFound } from "next/navigation";

import { loadFunnelStructure } from "@/actions/blocks";

import { FunnelEditorShell } from "@/components/builder/funnel-editor-shell";


type PageProps = { params: Promise<{ id: string }> };



export default async function EditFunnelPage({ params }: PageProps) {


  const { id } = await params;


  let snapshot;

  try {
    snapshot = await loadFunnelStructure(id);



  } catch {

    notFound();

  }



  const { funnel, blocks, connections } = snapshot;



  return (


    <FunnelEditorShell
      funnelId={funnel.id}
      funnel={{
        id: funnel.id,
        name: funnel.name,

        slug: funnel.slug,

        published: funnel.published,
        settings: funnel.settings ?? null,

      }}

      initialBlocks={blocks}




      initialConnections={connections}




    />



  );


}


