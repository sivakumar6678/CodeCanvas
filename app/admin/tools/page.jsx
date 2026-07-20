import { getAllTools, getCategories } from '../../../lib/data-fetchers';
import ToolsManager from '../../../components/admin/ToolsManager';

export const metadata = {
  title: 'Manage AI Tools - Admin',
};

export default async function AdminToolsPage() {
  const allTools = await getAllTools();
  const categories = await getCategories();

  return (
    <div>
      <ToolsManager initialTools={allTools} categories={categories} />
    </div>
  );
}
