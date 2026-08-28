import { requireAdminAccess } from '../../lib/auth/server';
import StudioShell from '../../components/admin/StudioShell';

export const metadata = {
  title: 'Studio | CodeCraft',
  description: 'Private administration studio for the CodeCraft platform.',
};

export default async function StudioLayout({ children }) {
  const { user } = await requireAdminAccess();

  return <StudioShell email={user.email}>{children}</StudioShell>;
}
