import { ScenePurpose } from '@/react-query/generated__types';

import { fitSceneSeconds, linePauses, spokenText } from './spoken-length';

type HookSceneLine = {
  speaker: string;
  text: string;
  shot: string;
  reaction: string;
  pauseSeconds: number;
  delivery: string;
};

type HookSceneValues = {
  id: string;
  order: number;
  purpose: ScenePurpose;
  durationSeconds: number;
  narration: string;
  lines: HookSceneLine[];
  visual: string;
};

/**
 * Mirrors the API (`hookScene` in `script-writing.ts`): the scene the chosen
 * hook opens is the first scene, when it is the hook scene.
 */
export function hookScene<T extends Pick<HookSceneValues, 'order' | 'purpose'>>(
  scenes: T[],
): T | null {
  const first = [...scenes].sort((a, b) => a.order - b.order)[0];
  return first?.purpose === ScenePurpose.Hook ? first : null;
}

/**
 * Mirrors the API (`openWithHook` in `scripts.service.ts`): scene 1 opens
 * with the chosen hook. With `words`, its narration is the hook's text, or
 * in a skit its first line says it (keeping that line's speaker and beat; a
 * line is added when it has none); with `visual`, the hook's opening shot
 * becomes its visual. The scene grows to fit. The editor applies it as the
 * creator picks or edits a hook, so its scene autosave carries it.
 */
export function withHook<T extends HookSceneValues>(
  scenes: T[],
  hook: { text: string; openingShot: string } | undefined,
  skit: boolean,
  parts: { words: boolean; visual: boolean },
): T[] {
  const target = hookScene(scenes);

  if (!hook || !target || (!parts.words && !parts.visual)) return scenes;

  return scenes.map((scene) => {
    if (scene.id !== target.id) return scene;

    const narration = parts.words && !skit ? hook.text : scene.narration;
    const lines =
      parts.words && skit
        ? scene.lines.length
          ? [{ ...scene.lines[0], text: hook.text }, ...scene.lines.slice(1)]
          : [
              {
                speaker: '',
                text: hook.text,
                shot: '',
                reaction: '',
                pauseSeconds: 0,
                delivery: '',
              },
            ]
        : scene.lines;

    return {
      ...scene,
      narration,
      lines,
      visual:
        parts.visual && hook.openingShot.trim()
          ? hook.openingShot
          : scene.visual,
      durationSeconds: fitSceneSeconds(
        scene.durationSeconds,
        spokenText({ narration, lines }),
        linePauses({ lines }),
      ),
    };
  });
}
