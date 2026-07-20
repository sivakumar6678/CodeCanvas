'use server';

import { createClient } from '../../lib/supabase/server';
import { redirect } from 'next/navigation';

export async function login(formData) {
  const supabase = createClient();

  const data = {
    email: formData.get('email'),
    password: formData.get('password'),
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return { error: error.message };
  }

  redirect('/admin');
}

export async function logout() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
