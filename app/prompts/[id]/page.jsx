import { redirect } from 'next/navigation';

export default function LegacyPromptDetailPage({ params }) { redirect(`/ai-prompts-tricks/${params.id}`); }