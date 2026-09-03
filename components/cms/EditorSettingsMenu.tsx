'use client';

import { useEditorPreferences } from '@/components/cms/EditorPreferencesProvider';
import {
  AdminDropdownBackdrop,
  AdminDropdownPanel,
  AdminDropdownTrigger,
  useAdminDropdown,
} from '@/components/admin/AdminDropdown';
import { Settings, ChevronDown, Check, HelpCircle, Clock, Pin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditorSettingsMenuProps {
  variant?: 'header' | 'default';
}

export function EditorSettingsMenu({ variant = 'default' }: EditorSettingsMenuProps) {
  const { open, toggle, close } = useAdminDropdown();
  const {
    preferences,
    setGuidanceMode,
    setStickyTipTapToolbar,
    setClockFormat,
  } = useEditorPreferences();

  return (
    <div className="relative shrink-0">
      <AdminDropdownTrigger open={open} onClick={toggle} aria-label="Editor preferences">
        <Settings className="h-3.5 w-3.5 text-sky-400 shrink-0" />
        {variant === 'header' && <span className="admin-dropdown-trigger-label">Settings</span>}
        <ChevronDown className={cn('h-3 w-3 shrink-0 opacity-60 transition-transform duration-150', open && 'rotate-180')} />
      </AdminDropdownTrigger>

      {open && (
        <>
          <AdminDropdownBackdrop onClose={close} />
          <AdminDropdownPanel className="admin-platform-menu editorial-settings-menu min-w-[240px]">
            <div className="editorial-desk-menu__header border-b border-border/40 pb-3 mb-2 px-4 pt-3">
              <div>
                <div className="editorial-desk-menu__title font-semibold text-[13px] tracking-tight">Editor settings</div>
                <p className="editorial-desk-menu__subtitle text-[11px] text-muted-foreground">Customize your writing workspace</p>
              </div>
            </div>

            {/* Guidance Mode Section */}
            <div className="px-4 py-2">
              <span className="editor-settings__label">
                <HelpCircle className="h-3 w-3" />
                Guidance Level
              </span>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setGuidanceMode('noob')}
                  className={cn(
                    'editor-settings__option',
                    preferences.guidanceMode === 'noob' && 'editor-settings__option--active'
                  )}
                >
                  <div className="flex flex-col">
                    <span>Beginner (Noob)</span>
                    <span className="editor-settings__hint">Show hints, tooltips & help</span>
                  </div>
                  {preferences.guidanceMode === 'noob' && <Check className="h-3.5 w-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => setGuidanceMode('pro')}
                  className={cn(
                    'editor-settings__option',
                    preferences.guidanceMode === 'pro' && 'editor-settings__option--active'
                  )}
                >
                  <div className="flex flex-col">
                    <span>Professional (Pro)</span>
                    <span className="editor-settings__hint">Headings only, clean view</span>
                  </div>
                  {preferences.guidanceMode === 'pro' && <Check className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <div className="h-px bg-border/40 my-2 mx-3" />

            {/* Sticky Editor Toolbar Toggle */}
            <div className="px-4 py-2">
              <span className="editor-settings__label">
                <Pin className="h-3 w-3" />
                Toolbar Behavior
              </span>
              <button
                type="button"
                onClick={() => setStickyTipTapToolbar(!preferences.stickyTipTapToolbar)}
                className="editor-settings__option"
              >
                <div className="flex flex-col">
                  <span>Sticky editor toolbar</span>
                  <span className="editor-settings__hint">Pin toolbar while writing</span>
                </div>
                <div className={cn(
                  'editor-settings__switch',
                  preferences.stickyTipTapToolbar && 'editor-settings__switch--on',
                )}>
                  <div className="editor-settings__switch-thumb" />
                </div>
              </button>
            </div>

            <div className="h-px bg-border/40 my-2 mx-3" />

            {/* Clock Format Section */}
            <div className="px-4 py-2 pb-3">
              <span className="editor-settings__label">
                <Clock className="h-3 w-3" />
                Clock Format
              </span>
              {/* One segmented control, the same one the header's theme picker
                  and the Desk panel use. This was a third pattern: two
                  separate bordered pills with a gap, the selected one filled
                  blue with blue text on it. */}
              <div className="editor-settings__segment">
                {(['12', '24'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setClockFormat(f)}
                    aria-pressed={preferences.clockFormat === f}
                    className={cn(
                      'editor-settings__segment-btn',
                      preferences.clockFormat === f && 'editor-settings__segment-btn--active',
                    )}
                  >
                    {f}-Hour
                  </button>
                ))}
              </div>
            </div>
          </AdminDropdownPanel>
        </>
      )}
    </div>
  );
}
