import { getAllPrompts } from '../../../lib/data-fetchers';
import KnowledgeManager from '../../../components/admin/KnowledgeManager';

export const metadata = {
  title: 'AI Knowledge Management | Studio',
};

export default async function StudioKnowledgePage() {
  const items = await getAllPrompts();

  return <KnowledgeManager initialItems={Array.isArray(items) ? items : []} />;
}
