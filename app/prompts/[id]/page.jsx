import { redirect } from 'next/navigation';

export default async function LegacyPromptDetailPage({ params }) {
  const { id } = await params;
  redirect(`/ai-prompts-tricks/${id}`);
}