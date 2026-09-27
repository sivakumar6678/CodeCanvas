import { getAllTools } from '../../lib/data-fetchers';
import ToolkitBuilder from '../../components/ai-tools/ToolkitBuilder';
import { createClient } from '../../lib/supabase/server';

export const metadata = {
  title: 'Build Your Toolkit - CodeCanvas',
  description: 'Find a practical, deterministic set of AI tools tailored to your role, stack, and goals.',
};

export const dynamic = 'force-dynamic';

export default async function BuildToolkitPage() {
  const tools = await getAllTools();

  let userProfile = null;
  let savedToolSlugs = [];

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const [profileRes, savedRes] = await Promise.allSettled([
        supabase.from('user_profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('saved_tools').select('tool_slug').eq('user_id', user.id),
      ]);

      if (profileRes.status === 'fulfilled' && profileRes.value.data) {
        userProfile = profileRes.value.data;
      }
      if (savedRes.status === 'fulfilled' && savedRes.value.data) {
        savedToolSlugs = savedRes.value.data.map((r) => r.tool_slug).filter(Boolean);
      }
    }
  } catch (err) {
    // Gracefully handle Supabase connectivity absence
    console.warn('[build-toolkit] Unable to retrieve user profile:', err.message);
  }

  return (
    <ToolkitBuilder
      tools={tools || []}
      userProfile={userProfile}
      savedToolSlugs={savedToolSlugs}
    />
  );
}