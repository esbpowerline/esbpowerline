/**
 * ESB PowerLine — Shared Constants (ported from legacy datastore.js)
 * ROLES + PERMISSIONS + exact 10 Categories + Statuses
 * Used by auth, middleware, CMS, Admin, and seeding.
 */

export const ROLES = {
  SUPER_ADMIN: { name: 'Super Admin', level: 100, color: '#ff3b6f' },
  ADMIN:       { name: 'Admin',       level: 80,  color: '#8b5cf6' },
  EDITOR:      { name: 'Editor',      level: 60,  color: '#3b82f6' },
  AUTHOR:      { name: 'Author',      level: 40,  color: '#10b981' },
  CONTRIBUTOR: { name: 'Contributor', level: 20,  color: '#f59e0b' },
  SUBSCRIBER:  { name: 'Subscriber',  level: 5,   color: '#6b7280' },
} as const;

export type Role = keyof typeof ROLES;

/** Roles an admin may assign when creating or editing users */
export const ADMIN_ASSIGNABLE_ROLES = ['ADMIN', 'EDITOR', 'SUBSCRIBER'] as const satisfies readonly Role[];

export type AdminAssignableRole = (typeof ADMIN_ASSIGNABLE_ROLES)[number];

/** Display labels for user-management UI (Member = public-site subscriber) */
export const USER_ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  EDITOR: 'Editor',
  AUTHOR: 'Author',
  CONTRIBUTOR: 'Contributor',
  SUBSCRIBER: 'Member',
};

/**
 * Explicit grant sets, replacing the numeric thresholds that used to gate
 * every action (`roleLevel >= required`). One axis cannot express "may approve
 * a dataset but not publish an article" — the moment a DATA_VERIFIER or
 * NEWS_EDITOR role exists, a level either grants too much or too little. The
 * grant sets below are generated from the old thresholds and are
 * BEHAVIOR-IDENTICAL to them (pinned by lib/test/permission-matrix.test.ts,
 * which recomputes the thresholds and diffs); any deliberate policy change
 * from here on is a visible diff on one line of this table.
 *
 * One tightening rides along, deliberately: an action name missing from this
 * table now denies everyone. The old `?? 100` fallback let SUPER_ADMIN pass a
 * check against a typo'd action; every action string in use was verified
 * present before the switch.
 */
export const PERMISSION_MATRIX: Record<string, readonly Role[]> = {
  // Article permissions
  'article.create':       ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR', 'CONTRIBUTOR'],
  'article.edit_own':     ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR', 'CONTRIBUTOR'],
  'article.review':       ['SUPER_ADMIN', 'ADMIN', 'EDITOR'],
  'article.edit_any':     ['SUPER_ADMIN', 'ADMIN'],
  'article.delete_own':   ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR'],
  'article.delete_any':   ['SUPER_ADMIN', 'ADMIN'],
  'article.publish':      ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR'],
  'article.feature':      ['SUPER_ADMIN', 'ADMIN', 'EDITOR'],
  'article.breaking':     ['SUPER_ADMIN', 'ADMIN', 'EDITOR'],

  // Media
  'media.upload':         ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR', 'CONTRIBUTOR'],
  'media.delete_own':     ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR'],
  'media.delete_any':     ['SUPER_ADMIN', 'ADMIN'],

  // Comments
  'comment.create':       ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR', 'CONTRIBUTOR', 'SUBSCRIBER'],
  'comment.moderate_own': ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR'],
  'comment.moderate_any': ['SUPER_ADMIN', 'ADMIN', 'EDITOR'],
  'comment.delete_any':   ['SUPER_ADMIN', 'ADMIN'],

  // Admin panel (SUPER_ADMIN + ADMIN only)
  'admin.access':         ['SUPER_ADMIN', 'ADMIN'],

  // Users
  'user.view':            ['SUPER_ADMIN', 'ADMIN'],
  'user.create':          ['SUPER_ADMIN', 'ADMIN'],
  'user.edit':            ['SUPER_ADMIN', 'ADMIN'],
  'user.delete':          ['SUPER_ADMIN'],
  'user.change_role':     ['SUPER_ADMIN', 'ADMIN'],

  // Settings / Admin
  'settings.view':        ['SUPER_ADMIN', 'ADMIN'],
  'settings.edit':        ['SUPER_ADMIN', 'ADMIN'],
  'logs.view':            ['SUPER_ADMIN', 'ADMIN'],

  // Categories
  'category.manage':      ['SUPER_ADMIN', 'ADMIN', 'EDITOR'],

  // Analytics
  'analytics.view_own':   ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR', 'CONTRIBUTOR'],
  'analytics.view_all':   ['SUPER_ADMIN', 'ADMIN', 'EDITOR'],

  // Ads
  'ads.manage':           ['SUPER_ADMIN', 'ADMIN'],

  // Grid/gas data releases. Publishing writes straight to the live homepage
  // numbers, so it sits at the admin level rather than with editorial roles.
  'data.publish':         ['SUPER_ADMIN', 'ADMIN'],
  'notifications.manage': ['SUPER_ADMIN', 'ADMIN'],
  'data.revoke':          ['SUPER_ADMIN', 'ADMIN'],
};

/** The thresholds the matrix was generated from — kept only so the pin test
 *  can prove the translation was faithful. Nothing else may read this. */
export const LEGACY_PERMISSION_LEVELS: Record<string, number> = {
  'article.create': 10, 'article.edit_own': 20, 'article.review': 60,
  'article.edit_any': 80, 'article.delete_own': 40, 'article.delete_any': 80,
  'article.publish': 40, 'article.feature': 60, 'article.breaking': 60,
  'media.upload': 20, 'media.delete_own': 40, 'media.delete_any': 80,
  'comment.create': 5, 'comment.moderate_own': 40, 'comment.moderate_any': 60,
  'comment.delete_any': 80, 'admin.access': 80, 'user.view': 80,
  'user.create': 80, 'user.edit': 80, 'user.delete': 100, 'user.change_role': 80,
  'settings.view': 80, 'settings.edit': 80, 'logs.view': 80,
  'category.manage': 60, 'analytics.view_own': 20, 'analytics.view_all': 60,
  'ads.manage': 80, 'data.publish': 80, 'data.revoke': 80,
  'notifications.manage': 80,
};

/** Optimized 10-category editorial structure */
export const CATEGORIES = [
  'Energy Policy & Regulators',
  'Power Generation',
  'Fossil Fuels & Commodities',
  'Renewables & Nuclear',
  'Grid & Transmission',
  'Distribution & Utilities',
  'Consumers & Tariffs',
  'Market, Finance & Subsidies',
  'International & Cross-Border',
  'Environment & Efficiency',
] as const;

export type CategoryName = (typeof CATEGORIES)[number];

export const CATEGORY_DETAILS: Record<
  CategoryName,
  { description: string; icon: string; color: string }
> = {
  'Energy Policy & Regulators': {
    description: 'Ministry master plans and BERC tariff hearings',
    icon: 'Scale',
    color: '#4f46e5',
  },
  'Power Generation': {
    description: 'State plants, IPPs, and capacity charge disputes',
    icon: 'Zap',
    color: '#1e40af',
  },
  'Fossil Fuels & Commodities': {
    description: 'LNG, gas, oil, and coal',
    icon: 'Flame',
    color: '#f59e0b',
  },
  'Renewables & Nuclear': {
    description: 'Solar, wind, and the Rooppur project',
    icon: 'Sun',
    color: '#10b981',
  },
  'Grid & Transmission': {
    description: 'PGCB, high-voltage lines, and wheeling charges',
    icon: 'Cable',
    color: '#0ea5e9',
  },
  'Distribution & Utilities': {
    description: 'BREB, DESCO, DPDC, and urban distribution',
    icon: 'Building2',
    color: '#14b8a6',
  },
  'Consumers & Tariffs': {
    description: 'Retail pricing and public impact',
    icon: 'Lightbulb',
    color: '#ef4444',
  },
  'Market, Finance & Subsidies': {
    description: 'BPDB deficits, BPC profits, and government subsidy burdens',
    icon: 'TrendingUp',
    color: '#ec4899',
  },
  'International & Cross-Border': {
    description: 'Imported power and global energy market shifts',
    icon: 'Globe',
    color: '#6366f1',
  },
  'Environment & Efficiency': {
    description: 'Carbon emissions, energy efficiency, and ecological impact',
    icon: 'Leaf',
    color: '#0d9488',
  },
};

/** Maps legacy category names to the optimized structure (for migrations) */
export const LEGACY_CATEGORY_MAP: Record<string, CategoryName> = {
  'Power Generation': 'Power Generation',
  'Renewable Energy': 'Renewables & Nuclear',
  'LNG & Gas': 'Fossil Fuels & Commodities',
  'Nuclear Energy': 'Renewables & Nuclear',
  'Grid & Transmission': 'Grid & Transmission',
  'Energy Policy': 'Energy Policy & Regulators',
  'Rural Electrification': 'Distribution & Utilities',
  'Energy Efficiency': 'Environment & Efficiency',
  International: 'International & Cross-Border',
  'Market & Finance': 'Market, Finance & Subsidies',
};

export const ARTICLE_STATUSES = ['published', 'draft', 'scheduled', 'archived', 'trash'] as const;

export function can(userRole: Role | undefined, action: string): boolean {
  if (!userRole) return false;
  return PERMISSION_MATRIX[action]?.includes(userRole) ?? false;
}

/** Platform admin panel — not editorial CMS */
export function isAdminRole(userRole: Role | undefined): userRole is 'SUPER_ADMIN' | 'ADMIN' {
  return userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';
}

export function canAccessAdminPanel(userRole: Role | undefined): boolean {
  return can(userRole, 'admin.access');
}
