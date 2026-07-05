/**
 * @deprecated URL sync moved to GridExplorerUrlSyncer + lib/grid-explorer-url.ts
 * to avoid useSearchParams re-rendering the full explorer on every replace().
 */
export type {
  GridExplorerTab,
  GridMacroSubTab,
  GridExplorerUrlBoot,
} from '@/lib/grid-explorer-url';

export {
  buildGridExplorerQuery,
  parseGridExplorerDate,
  parseGridExplorerTab,
  parseGridMacroSubTab,
  readGridExplorerUrlBoot,
} from '@/lib/grid-explorer-url';