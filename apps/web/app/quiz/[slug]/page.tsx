import QuizPlayer from "./quiz-player";

export default async function PublicQuizPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <QuizPlayer slug={slug} />;
}
