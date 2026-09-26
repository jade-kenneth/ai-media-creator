/** Route-level loading shows only the canvas; screens draw their own skeletons. */
export default function Loading() {
  return <div className="min-h-dvh bg-canvas" aria-busy="true" />;
}
