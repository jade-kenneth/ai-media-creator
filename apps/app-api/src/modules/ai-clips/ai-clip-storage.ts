/**
 * Frames a clip job may send: one per input photo (R23: up to 4), or for a
 * one-click clip up to 8 item photos plus a still of the previous scene
 * (§3.21), the video service's cap of 9 references.
 */
export const MAX_AI_CLIP_FRAMES = 9;

/** A temporary 9:16 input frame; `index` is the photo's place in the request. */
export function buildAiClipFrameStorageKey(
  projectId: string,
  jobId: string,
  index: number,
): string {
  if (!Number.isInteger(index) || index < 0 || index >= MAX_AI_CLIP_FRAMES) {
    throw new Error(`Clip frame index ${index} is out of range.`);
  }
  return `projects/${projectId}/ai-clips/${jobId}-frame-${index}.jpg`;
}

export function buildAiClipStorageKey(
  projectId: string,
  assetId: string,
): string {
  return `projects/${projectId}/ai-clips/${assetId}.mp4`;
}
