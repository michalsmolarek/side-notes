export const FONT_MIN = 10;
export const FONT_MAX = 24;

export type ScopeName = 'global' | 'workspace';

export interface NoteSummary {
  id: string;
  title: string;
}

export type StateReason = 'load' | 'create' | 'select' | 'rename' | 'delete' | 'scope';

export interface StateMessage {
  type: 'state';
  reason: StateReason;
  scope: ScopeName;
  workspaceAvailable: boolean;
  notes: NoteSummary[];
  activeId: string | null;
  body: string;
  fontSize: number | null;
}

export type HostMessage =
  | StateMessage
  | { type: 'flush' }
  | { type: 'newNote' };

export type WebviewMessage =
  | { type: 'ready' }
  | { type: 'save'; id: string; body: string }
  | { type: 'setScope'; scope: ScopeName }
  | { type: 'select'; id: string }
  | { type: 'create' }
  | { type: 'rename'; id: string }
  | { type: 'delete'; id: string }
  | { type: 'setFontSize'; size: number | null }
  | { type: 'openLink'; href: string };
