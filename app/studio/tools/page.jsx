import { getAllTools, getCategories } from '../../../lib/data-fetchers';
import ToolsManager from '../../../components/admin/ToolsManager';

export const metadata = {
  title: 'Manage AI Tools | Studio',
};

export default async function StudioToolsPage() {
  const [allTools, categories] = await Promise.all([getAllTools(), getCategories()]);

  return <ToolsManager initialTools={allTools} categories={categories} />;
}
