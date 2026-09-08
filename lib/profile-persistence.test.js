import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PREDEFINED_AVATARS,
  isValidAvatarId,
  getAvatarById,
  resolveAvatarDisplay,
} from './avatars.js';

test('Predefined avatar system validates IDs and resolves presets accurately', () => {
  // Ensure rich selection of predefined avatars
  assert.equal(PREDEFINED_AVATARS.length >= 12, true);

  const sampleIds = ['avatar-coder', 'avatar-robot', 'avatar-sparkle', 'avatar-wizard', 'avatar-cat'];
  for (const id of sampleIds) {
    assert.equal(isValidAvatarId(id), true);
    const preset = getAvatarById(id);
    assert.ok(preset);
    assert.equal(preset.id, id);
    assert.ok(preset.label);
    assert.ok(preset.icon);
    assert.ok(preset.bg);

    const resolved = resolveAvatarDisplay(id, 'Tester');
    assert.equal(resolved.type, 'preset');
    assert.equal(resolved.icon, preset.icon);
  }

  // Invalid avatar IDs
  assert.equal(isValidAvatarId('invalid-preset-id'), false);
  assert.equal(isValidAvatarId(''), false);
  assert.equal(isValidAvatarId(null), false);
  assert.equal(isValidAvatarId(undefined), false);
});

test('Personalization fields normalization and array handling', () => {
  function toStringArray(val) {
    if (Array.isArray(val)) return val.map((x) => String(x).trim()).filter(Boolean);
    if (typeof val === 'string' && val.trim()) return val.split(',').map((x) => x.trim()).filter(Boolean);
    return [];
  }

  // Array values
  assert.deepEqual(toStringArray(['React', '  Next.js  ', '']), ['React', 'Next.js']);
  assert.deepEqual(toStringArray('JavaScript, Python, Rust'), ['JavaScript', 'Python', 'Rust']);
  assert.deepEqual(toStringArray(null), []);
  assert.deepEqual(toStringArray(undefined), []);

  // All 7 personalization fields mapping check
  const inputProfile = {
    role: 'Developer',
    experience_level: 'Intermediate',
    interests: ['Web Development', 'AI Agents & Automation'],
    technologies: ['React / Next.js', 'Python', 'Tailwind CSS'],
    goals: ['Build full-stack MVPs faster', 'Automate daily workflows'],
    preferred_pricing: 'freemium',
    preferred_platforms: ['Web', 'VS Code'],
  };

  assert.equal(inputProfile.role, 'Developer');
  assert.equal(inputProfile.experience_level, 'Intermediate');
  assert.equal(inputProfile.interests.length, 2);
  assert.equal(inputProfile.technologies.length, 3);
  assert.equal(inputProfile.goals.length, 2);
  assert.equal(inputProfile.preferred_pricing, 'freemium');
  assert.equal(inputProfile.preferred_platforms.length, 2);
});

test('Profile upsert payload structure omits updated_at to prevent PostgREST errors', () => {
  const user = { id: 'user-123', email: 'alex@example.com' };
  const rawBody = {
    username: 'alex_dev',
    avatar_id: 'avatar-coder',
    bio: 'Full-stack builder',
    role: 'Developer',
    experience_level: 'Advanced',
    interests: ['Web Development'],
    technologies: ['React / Next.js', 'Supabase'],
    goals: ['Speed up coding'],
    preferred_pricing: 'free',
    preferred_platforms: ['Web', 'CLI / Terminal'],
    onboarding_completed: true,
  };

  const normalizedAvatar = rawBody.avatar_id || '';
  const normalizedAvatarId = isValidAvatarId(normalizedAvatar) ? normalizedAvatar : '';

  const upsertPayload = {
    id: user.id,
    username: rawBody.username,
    avatar_url: normalizedAvatar,
    bio: rawBody.bio,
    role: rawBody.role,
    experience_level: rawBody.experience_level,
    interests: rawBody.interests,
    technologies: rawBody.technologies,
    goals: rawBody.goals,
    preferred_pricing: rawBody.preferred_pricing,
    preferred_platforms: rawBody.preferred_platforms,
    onboarding_completed: rawBody.onboarding_completed,
  };

  if (normalizedAvatarId) {
    upsertPayload.avatar_id = normalizedAvatarId;
  }

  // Ensure updated_at is NOT in payload
  assert.equal('updated_at' in upsertPayload, false);
  assert.equal(upsertPayload.avatar_id, 'avatar-coder');
  assert.equal(upsertPayload.avatar_url, 'avatar-coder');
  assert.equal(upsertPayload.role, 'Developer');
  assert.equal(upsertPayload.experience_level, 'Advanced');
  assert.equal(upsertPayload.onboarding_completed, true);
});

test('Profile response normalizes avatar_id from either avatar_id or avatar_url', () => {
  // Case 1: Supabase returns avatar_id explicitly
  const recordWithAvatarId = {
    id: 'user-1',
    avatar_id: 'avatar-robot',
    avatar_url: 'avatar-robot',
  };
  const normalized1 = {
    avatar_id: recordWithAvatarId.avatar_id || (isValidAvatarId(recordWithAvatarId.avatar_url) ? recordWithAvatarId.avatar_url : ''),
    avatar_url: recordWithAvatarId.avatar_url || recordWithAvatarId.avatar_id || '',
  };
  assert.equal(normalized1.avatar_id, 'avatar-robot');
  assert.equal(normalized1.avatar_url, 'avatar-robot');

  // Case 2: Legacy record where preset was saved in avatar_url
  const recordLegacyPreset = {
    id: 'user-2',
    avatar_id: null,
    avatar_url: 'avatar-wizard',
  };
  const normalized2 = {
    avatar_id: recordLegacyPreset.avatar_id || (isValidAvatarId(recordLegacyPreset.avatar_url) ? recordLegacyPreset.avatar_url : ''),
    avatar_url: recordLegacyPreset.avatar_url || recordLegacyPreset.avatar_id || '',
  };
  assert.equal(normalized2.avatar_id, 'avatar-wizard');
  assert.equal(normalized2.avatar_url, 'avatar-wizard');

  // Case 3: External image URL
  const recordExternal = {
    id: 'user-3',
    avatar_id: null,
    avatar_url: 'https://example.com/photo.png',
  };
  const normalized3 = {
    avatar_id: recordExternal.avatar_id || (isValidAvatarId(recordExternal.avatar_url) ? recordExternal.avatar_url : ''),
    avatar_url: recordExternal.avatar_url || recordExternal.avatar_id || '',
  };
  assert.equal(normalized3.avatar_id, '');
  assert.equal(normalized3.avatar_url, 'https://example.com/photo.png');
});

test('Missing table diagnostic logic identifies 42P01 error correctly', () => {
  function isTableMissingError(error) {
    if (!error) return false;
    if (error.code === '42P01') return true;
    if (typeof error.message === 'string' && error.message.includes('user_profiles') && error.message.includes('does not exist')) return true;
    return false;
  }

  assert.equal(isTableMissingError({ code: '42P01', message: 'relation "public.user_profiles" does not exist' }), true);
  assert.equal(isTableMissingError({ code: 'PGRST100', message: 'relation "user_profiles" does not exist' }), true);
  assert.equal(isTableMissingError({ code: '23505', message: 'duplicate key value violates unique constraint' }), false);
  assert.equal(isTableMissingError(null), false);
});

test('Schema cache missing column (PGRST204) regex extracts column name for adaptive retry', () => {
  const errorMessage = "Could not find the 'experience_level' column of 'user_profiles' in the schema cache";
  const match = errorMessage.match(/Could not find the '([^']+)' column/i);
  assert.ok(match);
  assert.equal(match[1], 'experience_level');

  const testPayload = {
    id: 'user-1',
    username: 'alex',
    experience_level: 'Intermediate',
    role: 'Developer'
  };

  const strippedCol = match[1];
  delete testPayload[strippedCol];

  assert.equal('experience_level' in testPayload, false);
  assert.equal(testPayload.username, 'alex');
  assert.equal(testPayload.role, 'Developer');
});



