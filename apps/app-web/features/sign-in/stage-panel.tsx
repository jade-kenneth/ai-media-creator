import { BrandMark } from '@/components/brand/brand-mark';

const STEPS = [
  'Choose what you’re making',
  'Shape the script',
  'Edit, preview and export',
];

/**
 * The decorative dark stage beside the sign-in panel (≥ 1024px). The product
 * name is repeated accessibly in the panel, so the whole stage is hidden from
 * assistive technology.
 */
export function StagePanel() {
  return (
    <div
      aria-hidden="true"
      className="flex flex-col justify-between bg-stage p-12 text-stage-ink max-lg:hidden"
    >
      <div className="flex items-center gap-2">
        <BrandMark variant="stage" />
        <span className="text-body leading-5 font-bold tracking-tight">
          AI Creation Platform
        </span>
      </div>

      <div className="max-w-110">
        <p className="t-display">Make short videos you can stand behind.</p>
        <p className="t-body mt-3 text-stage-ink-2">
          A studio for each kind of short video, from product videos to short
          stories. It drafts; you decide.
        </p>
        <ol className="mt-8 flex flex-col gap-3">
          {STEPS.map((step, index) => (
            <li key={step} className="t-body flex items-center gap-3">
              <span className="t-caption flex size-6 items-center justify-center rounded-full border border-stage-border font-mono text-stage-flare">
                {index + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      <div className="relative h-53 w-30 overflow-hidden rounded-lg border border-stage-border bg-stage-surface">
        <div className="absolute inset-x-3 bottom-6 flex flex-col gap-1.5">
          <span className="h-2 w-7/10 rounded-full bg-stage-border" />
          <span className="h-2 w-1/2 rounded-full bg-stage-border" />
          <span className="h-2 w-3/5 rounded-full bg-stage-border" />
        </div>
        <span className="absolute bottom-0 left-0 h-0.5 w-2/5 bg-stage-flare" />
      </div>
    </div>
  );
}
