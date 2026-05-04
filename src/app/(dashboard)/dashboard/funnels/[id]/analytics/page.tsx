import { notFound } from "next/navigation";

import {
  fetchFunnelInsights,

  listLeadsForFunnel,
} from "@/actions/analytics";
import {


  type LeadRowSnapshot,
  type SerializedInsight,
  FunnelInsightsView,
} from "@/components/dashboard/funnel-insights";

type Props = {


  params: Promise<{ id: string }>;

};



export default async function AnalyticsPage(props: Props) {


  const { id } = await props.params;



  try {


    const [insights, leadsRows] = await Promise.all([
      fetchFunnelInsights(id),

      listLeadsForFunnel(id),


    ]);

    const packaged: SerializedInsight = {


      funnel: {


        id: insights.funnel.id,
        name: insights.funnel.name,
        slug: insights.funnel.slug,
      },

      totals: insights.totals,
      recentCount: insights.recentCount,
      topAnswers: insights.topAnswers,


    };



    const leads: LeadRowSnapshot[] =
      leadsRows?.map((r) => ({




        id: r.id,
        name: r.name,
        email: r.email,


        phone: r.phone,


        created_at: r.created_at,


      })) ?? [];

    return (
      <FunnelInsightsView funnelId={id} insights={packaged} leads={leads} />


    );





  } catch {

    notFound();

  }



}


