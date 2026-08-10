export type GridExplorerTab =
  | 'overview'
  | 'gen'
  | 'gas'
  | 'imports'
  | 'renewables'
  | 'transmission'
  | 'regional'
  | 'macro'
  | 'plants';

export type GridMacroSubTab =
  | 'overview'
  | 'budget'
  | 'monthly'
  | 'pricing'
  | 'global'
  | 'reports'
  | 'reserves'
  | 'insights'
  | 'system_loss'
  | 'verification';

export type GridExplorerUrlBoot = {
  tab?: GridExplorerTab;
  date?: string;
  macro?: GridMacroSubTab;
};

const TAB_IDS: GridExplorerTab[] = [
  'overview',
  'gen',
  'gas',
  'imports',
  'renewables',
  'transmission',
  'regional',
  'macro',
  'plants',
];

const MACRO_IDS: GridMacroSubTab[] = [
  'overview',
  'budget',
  'monthly',
  'pricing',
  'global',
  'reports',
  'reserves',
  'insights',
  'system_loss',
  'verification',
];

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function parseGridExplorerTab(raw: string | null): GridExplorerTab | null {
  return raw && TAB_IDS.includes(raw as GridExplorerTab) ? (raw as GridExplorerTab) : null;
}

export function parseGridMacroSubTab(raw: string | null): GridMacroSubTab | null {
  return raw && MACRO_IDS.includes(raw as GridMacroSubTab) ? (raw as GridMacroSubTab) : null;
}

export function parseGridExplorerDate(raw: string | null): string | null {
  return raw && ISO_DATE.test(raw) ? raw : null;
}

export function readGridExplorerUrlBoot(search: string): GridExplorerUrlBoot | undefined {
  const params = new URLSearchParams(search);
  const tab = parseGridExplorerTab(params.get('tab'));
  const date = parseGridExplorerDate(params.get('date'));
  const macro = parseGridMacroSubTab(params.get('macro'));
  if (!tab && !date && !macro) return undefined;
  return {
    tab: tab ?? undefined,
    date: date ?? undefined,
    macro: macro ?? undefined,
  };
}

/** Canonical query string for tab + date + macro (empty string = no params). */
export function buildGridExplorerQuery(
  tab: GridExplorerTab,
  date: string,
  macro: GridMacroSubTab,
  latestDate: string,
): string {
  const params = new URLSearchParams();
  if (tab !== 'overview') params.set('tab', tab);
  if (date !== latestDate) params.set('date', date);
  if (tab === 'macro' && macro !== 'overview') params.set('macro', macro);
  return params.toString();
}