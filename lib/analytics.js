/**
 * CodeCraft Analytics Utilities & Aggregations
 * Lightweight, privacy-preserving telemetry and metrics processing
 */

export const ALLOWED_EVENT_TYPES = [
  'tool_view',
  'tool_click',
  'tool_save',
  'tool_review',
  'search',
  'category_view',
  'knowledge_view',
  'knowledge_copy',
  'knowledge_save',
  'contribution',
];

const DISALLOWED_METADATA_KEYS = ['password', 'token', 'secret', 'email', 'ip', 'phone', 'ssn', 'authorization'];

export function sanitizeMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return {};
  }
  const clean = {};
  for (const [key, value] of Object.entries(metadata)) {
    const lowerKey = key.toLowerCase();
    if (DISALLOWED_METADATA_KEYS.some((bad) => lowerKey.includes(bad))) {
      continue;
    }
    // Allow primitives and short strings
    if (typeof value === 'string') {
      clean[key] = value.slice(0, 300);
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      clean[key] = value;
    } else if (Array.isArray(value)) {
      clean[key] = value.slice(0, 10).map((v) => (typeof v === 'string' ? v.slice(0, 100) : v));
    }
  }
  return clean;
}

export function validateAnalyticsPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: 'Payload must be an object' };
  }

  const { event_type, entity_type, entity_id, metadata } = payload;

  if (!event_type || !ALLOWED_EVENT_TYPES.includes(event_type)) {
    return { valid: false, error: `Invalid or missing event_type. Allowed: ${ALLOWED_EVENT_TYPES.join(', ')}` };
  }

  return {
    valid: true,
    sanitized: {
      event_type,
      entity_type: typeof entity_type === 'string' ? entity_type.trim().slice(0, 50) : null,
      entity_id: typeof entity_id === 'string' ? entity_id.trim().slice(0, 120) : null,
      metadata: sanitizeMetadata(metadata),
    },
  };
}

export async function recordAnalyticsEvent(supabase, { event_type, entity_type, entity_id, metadata = {}, user_id = null }) {
  if (!supabase) return null;
  const validation = validateAnalyticsPayload({ event_type, entity_type, entity_id, metadata });
  if (!validation.valid) return null;

  try {
    const { data, error } = await supabase.from('analytics_events').insert({
      event_type: validation.sanitized.event_type,
      entity_type: validation.sanitized.entity_type,
      entity_id: validation.sanitized.entity_id,
      metadata: validation.sanitized.metadata,
      user_id: user_id || null,
    });
    if (error) {
      // Table might not be migrated yet in remote project; non-blocking
      return null;
    }
    return data;
  } catch (err) {
    // Non-blocking telemetry
    return null;
  }
}

/**
 * Computes popular categories ranked by tools count, direct views, and tool traffic views
 */
export function computePopularCategories(allTools = [], viewsBySlug = {}, categoryViewsCount = {}) {
  const categoryMap = {};

  allTools.forEach((tool) => {
    const cat = tool.category || 'General';
    if (!categoryMap[cat]) {
      categoryMap[cat] = {
        name: cat,
        toolCount: 0,
        toolViews: 0,
        directViews: categoryViewsCount[cat] || 0,
      };
    }
    categoryMap[cat].toolCount += 1;
    categoryMap[cat].toolViews += viewsBySlug[tool.slug] || 0;
  });

  const categories = Object.values(categoryMap).map((c) => {
    const totalEngagement = c.toolViews + c.directViews + c.toolCount;
    return {
      ...c,
      totalEngagement,
    };
  });

  const maxEngagement = Math.max(...categories.map((c) => c.totalEngagement), 1);

  return categories
    .map((c) => ({
      ...c,
      percentage: Math.round((c.totalEngagement / maxEngagement) * 100),
    }))
    .sort((a, b) => b.totalEngagement - a.totalEngagement);
}

/**
 * Computes most saved tools ranked by save count
 */
export function computeMostSavedTools(savedToolsRecords = [], allTools = []) {
  const toolMap = new Map();
  allTools.forEach((t) => toolMap.set(t.slug, t));

  const countsBySlug = {};
  savedToolsRecords.forEach((item) => {
    if (item.tool_slug) {
      countsBySlug[item.tool_slug] = (countsBySlug[item.tool_slug] || 0) + 1;
    }
  });

  return Object.entries(countsBySlug)
    .map(([slug, count]) => {
      const tool = toolMap.get(slug) || { name: slug, slug, category: 'AI Tool' };
      return {
        slug,
        name: tool.name || slug,
        category: tool.category || 'AI Tool',
        saveCount: count,
        logo: tool.logo || tool.logoImageUrl || '',
      };
    })
    .sort((a, b) => b.saveCount - a.saveCount)
    .slice(0, 10);
}

/**
 * Formats recent platform events into a clean, human-readable activity feed
 */
export function formatRecentActivity(events = [], allTools = [], defaultPrompts = []) {
  const toolMap = new Map();
  allTools.forEach((t) => toolMap.set(t.slug, t));

  const promptMap = new Map();
  defaultPrompts.forEach((p) => promptMap.set(String(p.id), p));

  return events.map((ev) => {
    const type = ev.event_type || 'activity';
    let title = 'Platform Activity';
    let subtitle = '';
    let iconType = 'activity';
    let link = null;

    switch (type) {
      case 'tool_view': {
        const tool = toolMap.get(ev.entity_id);
        title = tool ? `Viewed tool "${tool.name}"` : `Viewed tool "${ev.entity_id}"`;
        subtitle = tool?.category ? `in ${tool.category}` : 'Catalog item';
        iconType = 'view';
        link = `/ai-tools/tool/${ev.entity_id}`;
        break;
      }
      case 'tool_click': {
        const tool = toolMap.get(ev.entity_id);
        title = tool ? `External visit to "${tool.name}"` : `External link click for "${ev.entity_id}"`;
        subtitle = 'Outbound website visit';
        iconType = 'click';
        link = `/ai-tools/tool/${ev.entity_id}`;
        break;
      }
      case 'tool_save': {
        const tool = toolMap.get(ev.entity_id);
        title = tool ? `Tool bookmarked: "${tool.name}"` : `Bookmarked "${ev.entity_id}"`;
        subtitle = 'Added to user toolkit';
        iconType = 'save';
        link = `/ai-tools/tool/${ev.entity_id}`;
        break;
      }
      case 'tool_review': {
        const tool = toolMap.get(ev.entity_id);
        const rating = ev.metadata?.rating ? ` (${ev.metadata.rating}★)` : '';
        title = tool ? `Review written for "${tool.name}"${rating}` : `Review for "${ev.entity_id}"${rating}`;
        subtitle = 'Community review';
        iconType = 'review';
        link = `/ai-tools/tool/${ev.entity_id}`;
        break;
      }
      case 'search': {
        title = `Searched for "${ev.entity_id || 'tools'}"`;
        const count = ev.metadata?.count !== undefined ? `${ev.metadata.count} results found` : 'Catalog search';
        subtitle = count;
        iconType = 'search';
        link = `/ai-tools?q=${encodeURIComponent(ev.entity_id || '')}`;
        break;
      }
      case 'category_view': {
        title = `Browsed category "${ev.entity_id}"`;
        subtitle = 'Category discovery';
        iconType = 'category';
        link = `/ai-tools/${ev.entity_id}`;
        break;
      }
      case 'knowledge_copy': {
        const prompt = promptMap.get(ev.entity_id);
        title = prompt ? `Copied: "${prompt.title}"` : `Copied knowledge snippet "${ev.entity_id}"`;
        subtitle = prompt?.type ? `AI ${prompt.type}` : 'Knowledge snippet';
        iconType = 'copy';
        link = `/ai-knowledge/${ev.entity_id}`;
        break;
      }
      case 'knowledge_view': {
        const prompt = promptMap.get(ev.entity_id);
        title = prompt ? `Read guide: "${prompt.title}"` : `Viewed knowledge item "${ev.entity_id}"`;
        subtitle = prompt?.type ? `AI ${prompt.type}` : 'Knowledge item';
        iconType = 'knowledge';
        link = `/ai-knowledge/${ev.entity_id}`;
        break;
      }
      case 'knowledge_save': {
        const prompt = promptMap.get(ev.entity_id);
        title = prompt ? `Saved: "${prompt.title}"` : `Saved knowledge item "${ev.entity_id}"`;
        subtitle = 'Saved to user collection';
        iconType = 'save';
        link = `/ai-knowledge/${ev.entity_id}`;
        break;
      }
      case 'contribution': {
        const kind = ev.entity_type === 'knowledge' ? 'Knowledge Asset' : 'AI Tool';
        title = `New ${kind} submitted: "${ev.entity_id}"`;
        subtitle = 'Under review in Studio';
        iconType = 'contribution';
        link = '/studio/contributions';
        break;
      }
      default:
        title = `${type.replace(/_/g, ' ')}`;
        subtitle = ev.entity_id || '';
        break;
    }

    return {
      id: ev.id || `act-${Math.random().toString(36).slice(2, 9)}`,
      type,
      title,
      subtitle,
      iconType,
      link,
      occurred_at: ev.occurred_at || new Date().toISOString(),
    };
  });
}

