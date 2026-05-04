import BuilderClient from "./builder-client";

export default async function BuilderPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const { quizId } = await params;
  return <BuilderClient quizId={quizId} />;
}
