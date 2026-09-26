'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AdminCard, AdminTagCapsule } from '@/components/admin/AdminUI';
import { Play, ArrowUp, ArrowDown, Pin, Plus, Trash2, RefreshCw } from 'lucide-react';
import { extractYoutubeId } from '@/lib/interview-content';

export interface InterviewsEditorProps {
  interviews: any[];
  setInterviews: (v: any[]) => void;
  updateInterviewField: (index: number, field: string, val: any) => void;
  addInterview: () => void;
  removeInterview: (index: number) => void;
  resetInterviewsToDefaults: () => void;
  moveInterview: (index: number, direction: 'up' | 'down' | 'first') => void;
}

export function InterviewsEditor({
  interviews,
  updateInterviewField,
  addInterview,
  removeInterview,
  resetInterviewsToDefaults,
  moveInterview,
}: InterviewsEditorProps) {
  return (
    <div className="admin-settings-stack">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border rounded-xl p-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">Latest Interviews (In Conversation)</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
              {interviews.length} {interviews.length === 1 ? 'clip' : 'clips'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Plug in interviews, reorder or remove them. Updates appear on the homepage immediately when you hit Save Changes.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={resetInterviewsToDefaults}
            className="admin-row-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted"
            title="Reset to default curated list"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Reset Defaults</span>
          </button>
          <button
            type="button"
            onClick={addInterview}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Interview</span>
          </button>
        </div>
      </div>

      {interviews.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-xl p-6 bg-muted/20">
          <p className="text-sm font-medium text-muted-foreground">No interviews configured.</p>
          <button
            type="button"
            onClick={addInterview}
            className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add First Interview</span>
          </button>
        </div>
      ) : (
        interviews.map((iv, idx) => (
          <AdminCard
            key={iv.id || `interview-${idx}`}
            title={`Interview #${idx + 1}: ${iv.title || iv.guest || 'Untitled clip'}`}
            icon={Play}
            bodyClassName="admin-settings-body"
            action={
              <div className="flex items-center gap-1">
                {idx === 0 && <AdminTagCapsule className="mr-1">Pinned first</AdminTagCapsule>}
                <button
                  type="button"
                  className="admin-row-btn"
                  title="Pin to first"
                  aria-label="Pin to first"
                  onClick={() => moveInterview(idx, 'first')}
                  disabled={idx === 0}
                >
                  <Pin className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  className="admin-row-btn"
                  title="Move up"
                  aria-label="Move up"
                  onClick={() => moveInterview(idx, 'up')}
                  disabled={idx === 0}
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  className="admin-row-btn"
                  title="Move down"
                  aria-label="Move down"
                  onClick={() => moveInterview(idx, 'down')}
                  disabled={idx === interviews.length - 1}
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  className="admin-row-btn text-destructive hover:bg-destructive/10 hover:text-destructive ml-1"
                  title="Delete interview"
                  aria-label="Delete interview"
                  onClick={() => removeInterview(idx)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <span className="font-mono text-xs text-muted-foreground ml-1">{iv.id}</span>
              </div>
            }
          >
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Interview Title</Label>
                <Input
                  value={iv.title ?? ''}
                  onChange={(e) => updateInterviewField(idx, 'title', e.target.value)}
                  className="mt-1"
                  placeholder="e.g. বর্তমান জ্বালানী সংকট ও উত্তরনের উপায়"
                />
              </div>
              <div>
                <Label>Guest Name</Label>
                <Input
                  value={iv.guest ?? ''}
                  onChange={(e) => updateInterviewField(idx, 'guest', e.target.value)}
                  className="mt-1"
                  placeholder="e.g. অধ্যাপক আনু মুহাম্মদ"
                />
              </div>
              <div>
                <Label>Guest Role / Designation</Label>
                <Input
                  value={iv.role ?? ''}
                  onChange={(e) => updateInterviewField(idx, 'role', e.target.value)}
                  className="mt-1"
                  placeholder="e.g. অর্থনীতি ও জ্বালানী বিশেষজ্ঞ"
                />
                <p className="mt-1 text-xs text-muted-foreground">Shown in full in the player modal.</p>
              </div>
              <div>
                <Label>Programme / Series (card chip)</Label>
                <Input
                  value={iv.programme ?? ''}
                  onChange={(e) => updateInterviewField(idx, 'programme', e.target.value)}
                  className="mt-1"
                  placeholder="e.g. এক্সপ্রেস টক"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Narrow chip label on card. Falls back to role if blank.
                </p>
              </div>
              <div>
                <Label>Video Platform</Label>
                <select
                  value={iv.provider ?? 'youtube'}
                  onChange={(e) => updateInterviewField(idx, 'provider', e.target.value)}
                  className="admin-native-select mt-1"
                >
                  <option value="youtube">YouTube</option>
                  <option value="facebook">Facebook</option>
                </select>
              </div>
              {(iv.provider ?? 'youtube') === 'facebook' ? (
                <div>
                  <Label>Facebook Video URL</Label>
                  <Input
                    value={iv.videoUrl ?? ''}
                    onChange={(e) => updateInterviewField(idx, 'videoUrl', e.target.value)}
                    className="mt-1"
                    placeholder="https://www.facebook.com/.../videos/..."
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Required for Facebook — direct video or reel URL.
                  </p>
                </div>
              ) : (
                <div>
                  <Label>YouTube Video ID or Watch URL</Label>
                  <Input
                    value={iv.youtubeId ?? ''}
                    onChange={(e) => updateInterviewField(idx, 'youtubeId', e.target.value)}
                    className="mt-1"
                    placeholder="Paste 11-char ID or full YouTube URL"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">Paste video link or ID (auto-extracts and sets thumbnail).</p>
                </div>
              )}
              <div>
                <Label>Thumbnail Image URL</Label>
                <Input
                  value={iv.thumbnail ?? ''}
                  onChange={(e) => updateInterviewField(idx, 'thumbnail', e.target.value)}
                  className="mt-1"
                  placeholder="/images/... or https://..."
                />
                {iv.thumbnail && (
                  <div className="mt-2 relative w-28 aspect-video rounded-lg overflow-hidden border border-border bg-black/40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={iv.thumbnail} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Duration (e.g. 24:15)</Label>
                  <Input
                    value={iv.duration ?? ''}
                    onChange={(e) => updateInterviewField(idx, 'duration', e.target.value)}
                    className="mt-1"
                    placeholder="24:15 or —"
                  />
                </div>
                <div>
                  <Label>Date / Display Label</Label>
                  <Input
                    value={iv.date ?? ''}
                    onChange={(e) => updateInterviewField(idx, 'date', e.target.value)}
                    className="mt-1"
                    placeholder="e.g. Sep 14"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <Label>Excerpt Summary</Label>
                <Textarea
                  value={iv.excerpt ?? ''}
                  onChange={(e) => updateInterviewField(idx, 'excerpt', e.target.value)}
                  className="mt-1"
                  rows={2}
                  placeholder="Brief summary of the discussion..."
                />
              </div>
            </div>
          </AdminCard>
        ))
      )}

      {interviews.length > 0 && (
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={addInterview}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Another Interview</span>
          </button>
        </div>
      )}
    </div>
  );
}
