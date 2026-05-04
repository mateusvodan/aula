import AnalyticsClient from "./analytics-client";

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const { quizId } = await params;
  return <AnalyticsClient quizId={quizId} />;
}
