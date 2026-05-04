"use client";

import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {

  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type SerializedInsight = {
  funnel: { id: string; name: string; slug: string };
  totals: {


    views: number;
    completes: number;
    leadSubmits: number;
    leadsAllTimeApprox: number;
    uniqueSessions: number | null;
    completionRate: number | null;
    conversionRate: number | null;
    byType: Record<string, number>;




  };


  recentCount: number;



  topAnswers: Array<[string, number]>;


};



export type LeadRowSnapshot = {


  id: string;
  name: string | null;



  email: string | null;
  phone: string | null;



  created_at: string;


};



export function FunnelInsightsView(props: {


  funnelId: string;


  insights: SerializedInsight;


  leads: LeadRowSnapshot[];


}) {


  const eventChart = Object.entries(props.insights.totals.byType).map(([name, events]) => ({




    name,


    events,


  }));



  const topChoices = props.insights.topAnswers.map(([key, qty]) => ({




    key,



    qty,


  }));



  const { totals } = props.insights;


  return (
    <div className="space-y-8">

      <header className="flex flex-wrap items-center justify-between gap-4">

        <div>



          <p className="text-[11px] uppercase tracking-[0.45em] text-muted-foreground">Analytics



          </p>






          <h1 className="text-3xl font-semibold tracking-tight">

            {props.insights.funnel.name}


          </h1>



          <p className="text-sm font-mono text-muted-foreground">/q/{props.insights.funnel.slug}</p>


        </div>


        <div className="flex flex-wrap gap-2">





          <Link href={`/dashboard/funnels/${props.funnelId}/edit`}>






            <span className="inline-flex rounded-full border border-border px-4 py-2 text-xs font-semibold hover:bg-muted">
              Editar fluxo




            </span>


          </Link>


          <Link href="/dashboard">

            <span className="inline-flex rounded-full px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/10">

              Painel




            </span>


          </Link>


        </div>


      </header>



      <div className="grid gap-4 md:grid-cols-4">
        <MetricTile label="Visualizações" value={totals.views} />

        <MetricTile label="Conclusões" value={totals.completes} />
        <MetricTile label="Leads (30 dias)" value={totals.leadSubmits} />
        <MetricTile label="Leads totais ±" value={totals.leadsAllTimeApprox} />


      </div>



      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2 border-border shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Distribuição de eventos



            </CardTitle>



            <CardDescription>Últimos 30 dias</CardDescription>


          </CardHeader>



          <CardContent className="h-72">

            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={eventChart}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-45" />

                <XAxis dataKey="name" tick={{ fontSize: 12 }} />



                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />



                <Tooltip />
                <Bar dataKey="events" radius={[12, 12, 0, 0]} fill="rgb(34 197 94)" />
              </BarChart>
            </ResponsiveContainer>



          </CardContent>


        </Card>



        <Card className="border-border shadow-md">
          <CardHeader>
            <CardTitle>Métricas derivadas




            </CardTitle>






            <CardDescription>Estimativa simples</CardDescription>



          </CardHeader>



          <CardContent className="space-y-4 text-sm">


            <p>
              <span className="text-muted-foreground">Taxa conclusão (completa / vistas):





              </span>{" "}
              <strong>{totals.completionRate ?? "–"}%</strong>


            </p>


            <p>
              <span className="text-muted-foreground">Conversões / conclusões:

              </span>{" "}
              <strong>{totals.conversionRate ?? "–"}%</strong>

            </p>


            <p>
              <span className="text-muted-foreground">Sessões distintas (eventos)



              </span>{" "}
              <strong>{totals.uniqueSessions ?? "–"}</strong>


            </p>


            <p>



              <span className="text-muted-foreground">Eventos recentes registados:


              </span>{" "}
              <strong>{props.insights.recentCount}</strong>

            </p>


          </CardContent>



        </Card>


      </div>



      <Card className="border-border shadow-md">

        <CardHeader>
          <CardTitle>Combinações de resposta frequentes




          </CardTitle>


          <CardDescription>Campo combinado por bloco:opção quando metadata existe.



          </CardDescription>


        </CardHeader>



        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topChoices} layout="vertical" margin={{ left: 12 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-40" />
                <XAxis type="number" allowDecimals={false} />

                <YAxis type="category" dataKey="key" width={150} />
                <Tooltip />
                <Bar dataKey="qty" fill="#16a34a" radius={[0, 16, 16, 0]} />
              </BarChart>



            </ResponsiveContainer>


          </div>


        </CardContent>



      </Card>



      <Card className="border-border shadow-md">
        <CardHeader>
          <CardTitle>Últimos leads


          </CardTitle>



          <CardDescription>Últimos 50 registados </CardDescription>



        </CardHeader>



        <CardContent>
          <div className="overflow-x-auto">

            <Table>



              <TableHeader>


                <TableRow>


                  <TableHead>Nome</TableHead>



                  <TableHead>Email




                  </TableHead>


                  <TableHead>Telefone


                  </TableHead>


                  <TableHead>Data




                  </TableHead>


                </TableRow>



              </TableHeader>



              <TableBody>
                {props.leads.length === 0 ? (
                  <TableRow>


                    <TableCell colSpan={4}>


                      Sem leads ainda.




                    </TableCell>



                  </TableRow>



                ) : (




                  props.leads.map((leadRow) => (



                    <TableRow key={leadRow.id}>



                      <TableCell>{leadRow.name ?? "—"}



                      </TableCell>


                      <TableCell>{leadRow.email ?? "—"}



                      </TableCell>



                      <TableCell>


                        {leadRow.phone ?? "—"}




                      </TableCell>



                      <TableCell className="whitespace-nowrap text-xs">

                        {new Date(leadRow.created_at).toLocaleString("pt-PT")}
                      </TableCell>


                    </TableRow>



                  ))

                )}
              </TableBody>



            </Table>


          </div>


        </CardContent>



      </Card>


    </div>
  );


}



function MetricTile({ label, value }: { label: string; value: number }) {


  return (
    <Card className="shadow-sm">

      <CardHeader className="pb-2">


        <CardDescription>{label}




        </CardDescription>


        <CardTitle className="text-4xl">{value}</CardTitle>



      </CardHeader>



    </Card>


  );


}


