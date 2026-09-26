import { slugify } from 'src/common/utils/slugify';
import { Injectable } from '@nestjs/common';
import { ConflictError } from 'src/common/errors/app.error';
import type { OwnerContext } from 'src/common/types/owner-context';
import {
  FactSource,
  Platform,
  ScenePurpose,
  SceneTransition,
  ScriptLanguage,
  ScriptVersionStatus,
  ShotFraming,
  ShotSubject,
  Storytelling,
  StudioType,
  Tone,
  type CreatorBrief,
} from 'src/graphql/generated/graphql';
import { FactsService } from '../facts/facts.service';
import { ProjectsService, readStory } from '../projects/projects.service';
import type {
  ProjectRecord,
  StoryCharacterRecord,
} from '../projects/repositories/projects.repository';
import { GENRE_LABELS, STORYTELLING_LABELS } from '../studios/story';
import { studioFor } from '../studios/studios';
import type { ScriptVersionRecord } from './repositories/scripts.repository';
import type { ScriptSceneRecord } from './repositories/scripts.repository';
import {
  isSkit,
  lineTimeline,
  readLine,
  snapPause,
  splitProps,
} from './script-writing';
import { ScriptsService } from './scripts.service';

const PLATFORM: Record<Platform, string> = {
  [Platform.TIKTOK_SHOP]: 'TikTok Shop',
  [Platform.SHOPEE_VIDEO]: 'Shopee Video',
  [Platform.OTHER]: 'Other platform',
};
const LANGUAGE: Record<ScriptLanguage, string> = {
  [ScriptLanguage.ENGLISH]: 'English',
  [ScriptLanguage.FILIPINO]: 'Filipino',
  [ScriptLanguage.TAGLISH]: 'Taglish',
};
const TONE: Record<Tone, string> = {
  [Tone.FRIENDLY]: 'Friendly',
  [Tone.ENERGETIC]: 'Energetic',
  [Tone.CALM]: 'Calm',
  [Tone.STRAIGHT_TALKING]: 'Straight-talking',
};
const PURPOSE: Record<ScenePurpose, string> = {
  [ScenePurpose.HOOK]: 'Hook',
  [ScenePurpose.PROBLEM]: 'Problem',
  [ScenePurpose.DEMO]: 'Demo',
  [ScenePurpose.FEATURE]: 'Feature',
  [ScenePurpose.PROOF]: 'Proof',
  [ScenePurpose.CALL_TO_ACTION]: 'Call to action',
  [ScenePurpose.SETUP]: 'Setup',
  [ScenePurpose.BUILD]: 'Build-up',
  [ScenePurpose.TURN]: 'Turn',
  // R29: a story's last scene, which always ends on a cliffhanger.
  [ScenePurpose.PAYOFF]: 'Cliffhanger',
};
const TRANSITION: Partial<Record<SceneTransition, string>> = {
  [SceneTransition.PUNCH_IN]: 'Punch-in',
  [SceneTransition.WHIP]: 'Whip',
  [SceneTransition.DISSOLVE]: 'Dissolve',
};
const IN_FRAME: Record<ShotSubject, string> = {
  [ShotSubject.CREATOR]: 'You on camera',
  [ShotSubject.HANDS]: 'Hands only',
  [ShotSubject.PRODUCT_ONLY]: 'Product only',
};
/** A story's In frame labels: the cast, hands, or no one (§3.23). */
const STORY_IN_FRAME: Record<ShotSubject, string> = {
  [ShotSubject.CREATOR]: 'Cast on camera',
  [ShotSubject.HANDS]: 'Hands only',
  [ShotSubject.PRODUCT_ONLY]: 'No one in frame',
};
const FRAMING: Record<ShotFraming, string> = {
  [ShotFraming.CLOSE_UP]: 'Close-up',
  [ShotFraming.MEDIUM]: 'Medium',
  [ShotFraming.WIDE]: 'Wide',
  [ShotFraming.OVERHEAD]: 'Overhead',
  [ShotFraming.POV]: 'POV',
};
const SOURCE: Record<FactSource, string> = {
  [FactSource.LISTING]: 'from the listing',
  [FactSource.EDITED]: 'edited from the listing',
  [FactSource.CREATOR]: 'you entered',
  [FactSource.NOT_STATED]: 'you entered',
};

/** Skits are filmed with live sound: what people say and the action's sound go into the video. */
export const SKIT_SOUND_NOTE =
  'Record with sound on. What people say and the natural sound go into the video.';

/** Shown when a skit's lines are timed: how to read a line's time and its pause. */
export const SKIT_TIMING_NOTE =
  "Times in [brackets] count from the start of the scene. Let each reaction play for its pause before the line; don't rush the answers.";

export const BRIEF_REMINDERS = [
  'Add the affiliate disclosure your platform requires.',
  'Label AI-assisted content if your platform asks for it.',
  'Check the price and stock on the listing on the day you post.',
];

export const STORY_BRIEF_REMINDERS = [
  'Get permission from everyone who appears.',
  'Fake fights and stunts with angles and cuts. Never film real danger.',
  'Label AI-generated scenes if your platform asks for it.',
];

const CLOSING_LINE =
  'These are reminders, not a compliance check. The final review is yours.';

/**
 * A studio's brief (Product Specification §5.9, §3.23): the header lines
 * between the title and the Script line, who is on camera in the shoot
 * plan, the In frame labels, whether the facts used are listed, and the
 * closing reminders. Shared code reads this, never a studio's name.
 */
interface BriefTemplate {
  header(project: ProjectRecord, version: ScriptVersionRecord): string[];
  /** The shoot plan's cast lines; null keeps the version's presenter line. */
  cast(project: ProjectRecord, version: ScriptVersionRecord): string[] | null;
  inFrame(subject: ShotSubject, skit: boolean): string;
  factsUsed: boolean;
  reminders: { title: string; items: string[] };
}

const BRIEFS: Record<StudioType, BriefTemplate> = {
  [StudioType.AFFILIATE]: {
    header: (project, version) => [
      `Product: ${project.product.title ?? project.title}`,
      ...(project.product.affiliateUrl
        ? [`Link: ${project.product.affiliateUrl}`]
        : []),
      `Format: ${PLATFORM[project.strategy.platform]} · ${LANGUAGE[version.language]} · ${version.lengthSeconds} s · ${TONE[project.strategy.tone]}${isSkit(version.contentStyle) ? ' · Skit' : ''}`,
      ...(version.angleTitle ? [`Angle: ${version.angleTitle}`] : []),
    ],
    cast: () => null,
    inFrame: (subject, skit) =>
      skit && subject === ShotSubject.CREATOR
        ? 'Cast on camera'
        : IN_FRAME[subject],
    factsUsed: true,
    reminders: { title: 'BEFORE YOU POST', items: BRIEF_REMINDERS },
  },
  [StudioType.ENTERTAINMENT]: {
    header: (project, version) => {
      const story = readStory(project);
      const premise = story.premise;

      return [
        `Genre: ${story.genre ? GENRE_LABELS[story.genre] : 'Not chosen'} · ${STORYTELLING_LABELS[storytellingOf(version)]}`,
        ...(premise?.logline
          ? [
              `Premise: ${premise.title ? `${premise.title}. ` : ''}${premise.logline}`,
            ]
          : version.angleTitle
            ? [`Premise: ${version.angleTitle}`]
            : []),
        `Format: ${LANGUAGE[version.language]} · ${version.lengthSeconds} s`,
      ];
    },
    cast: (project, version) =>
      storyCastLines(readStory(project).cast, isSkit(version.contentStyle)),
    inFrame: (subject) => STORY_IN_FRAME[subject],
    factsUsed: false,
    reminders: {
      title: 'BEFORE YOU FILM AND POST',
      items: STORY_BRIEF_REMINDERS,
    },
  },
};

/** Acted stories are written as skits; every other story is narrated. */
function storytellingOf(version: ScriptVersionRecord): Storytelling {
  return isSkit(version.contentStyle)
    ? Storytelling.ACTED
    : Storytelling.NARRATED;
}

/**
 * The story's cast in the shoot plan, one per line:
 * `- Ana: a nurse heading home after a night shift. 20s, yellow raincoat.`
 */
export function storyCastLines(
  cast: Array<Pick<StoryCharacterRecord, 'name' | 'role' | 'look'>>,
  acted: boolean,
): string[] {
  if (cast.length === 0) {
    return [
      acted
        ? 'Cast: Not named yet.'
        : 'Cast: Nobody. The narrator tells the story over the scenes.',
    ];
  }

  return [
    'Cast:',
    ...cast.map((character) => {
      const about = [character.role, character.look]
        .map((part) => sentence(part))
        .filter(Boolean)
        .join(' ');

      return `- ${character.name}${about ? `: ${about}` : ''}`;
    }),
  ];
}

/** A phrase as a sentence: trimmed, with a full stop unless it has one. */
function sentence(text: string): string {
  const trimmed = text.trim();

  return !trimmed || /[.!?…]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

/**
 * The plain-text creator brief (Design Reference §5.9), built only from the
 * latest current approved version. No AI call and no credits.
 */
@Injectable()
export class CreatorBriefService {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly scriptsService: ScriptsService,
    private readonly factsService: FactsService,
  ) {}

  async build(projectId: string, owner: OwnerContext): Promise<CreatorBrief> {
    const project = await this.projectsService.getRecord(projectId, owner);
    const versions = await this.scriptsService.records(projectId, owner);
    const approved = versions.find(
      (version) =>
        this.scriptsService.effectiveStatus(version, project.approvedFacts) ===
        ScriptVersionStatus.APPROVED,
    );

    if (!approved?.approvedAt) {
      throw new ConflictError('Approve a script first.', {
        code: 'NO_APPROVED_SCRIPT',
      });
    }

    const template = BRIEFS[studioFor(project).type];
    const facts = template.factsUsed
      ? await this.factsService.list(projectId, owner)
      : [];
    const hook = approved.hooks.find(
      (item) => item.id === approved.selectedHookId,
    );
    const usedFacts = approved.approvedFactSnapshot.map((snapshot) => ({
      text: snapshot.text,
      source:
        facts.find((fact) => fact.id === snapshot.id)?.source ??
        FactSource.CREATOR,
    }));

    const newest = versions[0];
    const newerDraft =
      newest && newest.number > approved.number && newest.status === 'DRAFT'
        ? {
            number: newest.number,
            hasNewClaim: this.hasNewClaim(
              newest,
              approved,
              project.approvedFacts,
            ),
          }
        : null;

    const skit = isSkit(approved.contentStyle);
    const lines: string[] = [
      project.title.toUpperCase(),
      ...template.header(project, approved),
      `Script: v${approved.number}, approved ${formatDate(approved.approvedAt)}`,
      '',
      'HOOK',
      `"${hook?.text ?? ''}"`,
      `Opening shot: ${hook?.openingShot ?? ''}`,
      '',
    ];
    const scenes = [...approved.scenes].sort((a, b) => a.order - b.order);

    lines.push(
      ...shootPlanLines(
        approved,
        scenes,
        template.cast(project, approved) ?? undefined,
      ),
      'SHOT LIST',
    );

    let elapsed = 0;

    scenes.forEach((scene, index) => {
      const start = elapsed;
      elapsed += scene.durationSeconds;
      lines.push(
        `${index + 1}. ${PURPOSE[scene.purpose]} (${timecode(start)}–${timecode(elapsed)})`,
        ...(skit ? spokenLines(scene) : [`   Say: ${scene.narration}`]),
        ...(scene.sound ? [`   Sound: ${scene.sound}`] : []),
        ...(scene.onScreenText ? [`   Text: ${scene.onScreenText}`] : []),
        ...(scene.visual ? [`   Shot: ${scene.visual}`] : []),
        ...(scene.direction
          ? [
              `   Frame: ${[
                FRAMING[scene.direction.framing],
                template.inFrame(scene.direction.inFrame, skit),
                scene.direction.setting,
              ]
                .filter(Boolean)
                .join(' · ')}`,
              ...(scene.direction.props
                ? [`   Props: ${scene.direction.props}`]
                : []),
            ]
          : []),
        ...sceneTransitionLines(scene, index),
        ...(scene.cta ? [`   CTA: ${scene.cta}`] : []),
      );
    });

    lines.push('', 'CAPTION', approved.caption, '');

    if (template.factsUsed) {
      lines.push(
        'APPROVED FACTS USED',
        ...(usedFacts.length > 0
          ? usedFacts.map((fact) => `- ${fact.text} (${SOURCE[fact.source]})`)
          : ['- None']),
        '',
      );
    }

    lines.push(
      template.reminders.title,
      ...template.reminders.items.map((reminder) => `- ${reminder}`),
      CLOSING_LINE,
    );

    return {
      text: `${lines.join('\n')}\n`,
      fileName: `${slugify(project.title)}-brief-v${approved.number}.txt`,
      versionNumber: approved.number,
      approvedAt: approved.approvedAt,
      newerDraft,
    };
  }

  /** A newer draft adds a claim when it has a flagged line or uses new facts. */
  private hasNewClaim(
    draft: ScriptVersionRecord,
    approved: ScriptVersionRecord,
    approvedFacts: Array<{ id: string; text: string }>,
  ): boolean {
    const flags = this.scriptsService.flagsFor(draft, approvedFacts);
    const flagged =
      [...flags.scenes.values()].some((list) => list.length > 0) ||
      flags.caption.length > 0 ||
      (draft.selectedHookId
        ? (flags.hooks.get(draft.selectedHookId)?.length ?? 0) > 0
        : false);
    const approvedUses = new Set(
      approved.approvedFactSnapshot.map((fact) => fact.id),
    );

    return (
      flagged ||
      draft.scenes.some((scene) =>
        scene.factIds.some((factId) => !approvedUses.has(factId)),
      )
    );
  }
}

/**
 * A skit scene's lines as the cast plays them: `Ana: "…"`, with each line's
 * delivery, and under it the reaction before it and where the camera is.
 * When the scene's lines are timed (any pause), each line opens with when
 * its words start and end in the scene: `[1–2.5 s] Ben (half laughing): "…"`.
 */
export function spokenLines(
  scene: Pick<ScriptSceneRecord, 'lines' | 'durationSeconds'>,
): string[] {
  const lines = (scene.lines ?? []).map(readLine);
  const timed = isTimed(lines);
  const beats = lineTimeline(lines, scene.durationSeconds);

  return lines.flatMap((line, index) => {
    const who = [line.speaker, line.delivery ? `(${line.delivery})` : '']
      .filter(Boolean)
      .join(' ');
    const when = timed
      ? `[${secondsRange(beats[index].speakSeconds, beats[index].endSeconds)}] `
      : '';
    const before = line.reaction || (line.pauseSeconds ? 'a quiet beat' : '');

    return [
      `   ${when}${who ? `${who}: ` : ''}"${line.text}"`,
      ...(before
        ? [
            `      Before: ${before}${line.pauseSeconds ? ` (${seconds(line.pauseSeconds)} s)` : ''}`,
          ]
        : []),
      ...(line.shot ? [`      Camera: ${line.shot}`] : []),
    ];
  });
}

/** Lines are timed once any of them holds a reaction before it. */
function isTimed(lines: { pauseSeconds?: number | null }[]): boolean {
  return lines.some((line) => snapPause(line.pauseSeconds ?? 0) > 0);
}

/** Seconds to the nearest half: `2`, `2.5`. */
function seconds(value: number): string {
  return String(Math.round(value * 2) / 2);
}

/** `1–2.5 s`; a span too short to show still reads half a second. */
function secondsRange(start: number, end: number): string {
  const from = Math.round(start * 2) / 2;
  const to = Math.max(Math.round(end * 2) / 2, from + 0.5);

  return `${seconds(from)}–${seconds(to)} s`;
}

export function sceneTransitionLines(
  scene: Pick<ScriptSceneRecord, 'transitionIn'>,
  index: number,
): string[] {
  if (
    index === 0 ||
    !scene.transitionIn ||
    scene.transitionIn === SceneTransition.CUT
  ) {
    return [];
  }

  return [`   Transition: ${TRANSITION[scene.transitionIn]}`];
}

/**
 * The shoot plan: the scenario, who is on camera, and each location and prop
 * once, so every scene in one place can be filmed together. Versions written
 * before shot direction existed have none, and the section is left out.
 */
export function shootPlanLines(
  version: ScriptVersionRecord,
  scenes: ScriptVersionRecord['scenes'],
  /** The studio's cast lines in place of the version's presenter line. */
  cast?: string[],
): string[] {
  const directed = scenes.some((scene) => scene.direction);

  if (!version.shoot && !directed && !cast) return [];

  const locations = new Map<string, { label: string; scenes: number[] }>();
  const props = new Map<string, string>();

  scenes.forEach((scene, index) => {
    const setting = scene.direction?.setting;
    if (setting) {
      const key = setting.toLowerCase();
      const entry = locations.get(key) ?? { label: setting, scenes: [] };
      entry.scenes.push(index + 1);
      locations.set(key, entry);
    }
    for (const prop of splitProps(scene.direction?.props ?? '')) {
      if (!props.has(prop.toLowerCase())) props.set(prop.toLowerCase(), prop);
    }
  });

  const skit = isSkit(version.contentStyle);

  return [
    'SHOOT PLAN',
    ...(version.shoot?.scenario ? [`Scenario: ${version.shoot.scenario}`] : []),
    ...(cast ??
      (skit
        ? [`Cast: ${version.shoot?.presenter ?? 'Not named yet.'}`]
        : [
            `On camera: ${version.shoot?.presenter ?? 'Nobody. Hands and product only.'}`,
          ])),
    ...(skit ? [SKIT_SOUND_NOTE] : []),
    ...(skit && scenes.some((scene) => isTimed(scene.lines ?? []))
      ? [SKIT_TIMING_NOTE]
      : []),
    ...(locations.size > 0
      ? [
          'Locations:',
          ...[...locations.values()].map(
            (location) =>
              `- ${location.label} (scene${location.scenes.length > 1 ? 's' : ''} ${location.scenes.join(', ')})`,
          ),
        ]
      : []),
    ...(props.size > 0
      ? ['Props:', ...[...props.values()].map((prop) => `- ${prop}`)]
      : []),
    '',
  ];
}

function timecode(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function formatDate(date: Date): string {
  // Newer ICU writes the en-GB short month as “Sept”; the brief uses “Sep”.
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Manila',
  })
    .formatToParts(date)
    .map((part) =>
      part.type === 'month' ? part.value.slice(0, 3) : part.value,
    )
    .join('');
}
