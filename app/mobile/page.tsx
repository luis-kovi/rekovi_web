import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import MobileWrapper from '@/components/MobileWrapper';
import { getUserDataServer } from '@/utils/user-data-server';
import { logger } from '@/utils/logger';
import ReactQueryProvider from '@/utils/ReactQueryProvider';

export const dynamic = 'force-dynamic';

export default async function MobilePage() {
  const supabase = await createClient();

  if (!supabase) {
    logger.error('Supabase client not available');
    return redirect('/');
  }

  const { data } = await supabase.auth.getUser();
  const user = data?.user;

  if (!user?.email) {
    return redirect('/');
  }

  const userData = await getUserDataServer(user.email);

  if (!userData) {
    return redirect('/auth/signin?error=user_not_registered');
  }

  if (userData.status !== 'active') {
    return redirect('/auth/signin?error=user_inactive');
  }

  return (
    <ReactQueryProvider>
      <MobileWrapper
        permissionType={userData.permission_type}
        user={user}
      />
    </ReactQueryProvider>
  );
}