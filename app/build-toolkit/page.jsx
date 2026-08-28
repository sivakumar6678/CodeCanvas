import { getAllTools } from '../../lib/data-fetchers';
import ToolkitBuilder from '../../components/ai-tools/ToolkitBuilder';

export const metadata = {
  title: 'Build Your Toolkit - CodeCraft',
  description: 'Find a practical set of AI tools for the work you are doing.',
};

export default async function BuildToolkitPage() {
  const tools = await getAllTools();

  return <ToolkitBuilder tools={tools} />;
}