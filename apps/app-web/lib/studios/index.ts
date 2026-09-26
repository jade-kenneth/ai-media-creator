import { Drama, ShoppingBag, type LucideIcon } from 'lucide-react';

import {
  ProjectStepKey,
  ShotSubject,
  StoryGenre,
  Storytelling,
  StudioType,
} from '@/react-query/generated__types';

import { SHOT_SUBJECT_LABEL } from '@/lib/studio/labels';

/**
 * The presentation half of the studio registry (Product Specification §3.23,
 * “The studio contract”). The API's `src/modules/studios/` owns the rules;
 * this file owns what each studio looks like. Shared components read a
 * studio's entry here instead of branching on a studio by name, so a new
 * studio is a new entry plus its own intake step.
 */
export interface StudioPresentation {
  type: StudioType;
  /** The rail caption, e.g. “Affiliate Studio”. */
  name: string;
  /** The New video card icon. */
  icon: LucideIcon;
  /**
   * The New video card's overline, title and description. They mirror the
   * API's `studios` query, which the dialog reads first; these are the
   * fallback when that query can't load.
   */
  area: string;
  title: string;
  description: string;
  /** The New video card's accessible name. */
  createLabel: string;
  /** Locked-step banners that differ from the shared ones, by locked step. */
  lockedBanner: Partial<Record<ProjectStepKey, LockedBanner>>;
  /** Steps before Script, in rail order. */
  intakeSteps: ProjectStepKey[];
  /** The rail group the intake steps sit in. */
  intakeGroup: 'Plan';
  /** A project card's second line, and the muted flag for its empty value. */
  subjectLine: (project: SubjectSource) => { text: string; muted: boolean };
  /** The rail's second line under the project title. */
  railSubject: (project: SubjectSource) => { text: string; muted: boolean };
  /** The dashboard card's Duplicate is disabled with this reason, or null. */
  duplicateBlocked: (project: SubjectSource) => string | null;
  /** In frame option labels in Shot direction. */
  shotSubjectLabel: Record<ShotSubject, string>;
  /** Claim check UI (flags, fact chips, Claim check card) is shown. */
  claimCheck: boolean;
  /** Stories: a Keep consistent item can be a character. */
  characters: boolean;
  /** The caption for posting offers “Start with #ad”. */
  adTag: boolean;
  /** The Shoot plan's presenter always names a cast, whatever the content style (§5.8). */
  castShoot: boolean;
  /** A caption under a draft's last scene, or null (a story's cliffhanger, R29). */
  lastSceneNote: string | null;
  /** Script Studio's write job panel: its steps and what a failure kept (§5.8). */
  writeJob: { steps: readonly string[]; kept: string };
  /** The creator brief's aside card (§5.9). */
  briefAside: { title: string; reminders: readonly string[] };
  /** Media and Keep consistent (§5.12). */
  media: {
    /** The note under the uploads count in the aside. */
    uploadsNote: string;
    keepConsistentSubtitle: string;
    keepConsistentHint: string;
    /** Keep consistent photos are optional: nothing waits on them (R28 D3). */
    photosOptional: boolean;
    /** Under a scene that comes in with a Punch-in, past the first (§5.12). */
    punchInHint: string;
  };
  /** The Shoot plan's caption under Cast, when the presenter names a cast (§5.8). */
  castHint: string;
  /** Voice: why AI voice and My recording are off when nothing is narrated (§5.13). */
  noNarration: string;
  /** The uploader's line under its rights checkbox. */
  uploadRightsNote: string;
  /** The AI clip sheet (§5.16). */
  clips: {
    /** **Describe only** is offered, first and selected by default (R28 D2). */
    describe: boolean;
    /** Check before you use it: the two ticks and the closing caption. */
    checks: readonly [string, string];
    checkCaption: string;
    /** The sheet's description under its title. */
    sheetDescription: string;
    /** The hint under the description field. */
    promptHint: string;
    /** Match my photos: the mode hint and the picker's label noun. */
    referencesHint: string;
    referencesPhotos: string;
    /** The photo picker's hint per photo mode. */
    pickerHint: {
      firstFrame: string;
      firstLastFrame: string;
      references: string;
    };
    /** The request view with no photos uploaded. */
    noPhotos: string;
  };
  /** Edit & preview (§5.14). */
  edit: {
    endCardHint: string;
    /** The end card takes an optional End line. */
    endLine: boolean;
    /** The end card's title and second line. */
    endCardLines: (card: EndCardSource) => {
      title: string;
      line: string | null;
    };
    musicRightsLabel: string;
  };
  /** Export's “Before you post on TikTok” list (§5.15). */
  exportReminders: readonly string[];
}

/** What a video's end card carries; each studio shows two of these. */
export interface EndCardSource {
  productTitle?: string | null;
  cta?: string | null;
  storyTitle?: string | null;
  endLine?: string | null;
}

/** The info banner a step shows after a locked step redirected to it. */
export interface LockedBanner {
  title: string;
  detail: string;
}

/** What a card and the rail need to write a studio's subject line. */
export interface SubjectSource {
  productTitle?: string | null;
  story?: { genre?: StoryGenre | null } | null;
}

export const GENRE_LABEL: Record<StoryGenre, string> = {
  [StoryGenre.Drama]: 'Drama',
  [StoryGenre.Action]: 'Action',
  [StoryGenre.Comedy]: 'Comedy',
  [StoryGenre.Romance]: 'Romance',
  [StoryGenre.Horror]: 'Horror',
  [StoryGenre.Mystery]: 'Mystery',
  [StoryGenre.Fantasy]: 'Fantasy',
  [StoryGenre.SliceOfLife]: 'Slice of life',
};

/** Chip order on the Story step. */
export const GENRES: StoryGenre[] = [
  StoryGenre.Drama,
  StoryGenre.Action,
  StoryGenre.Comedy,
  StoryGenre.Romance,
  StoryGenre.Horror,
  StoryGenre.Mystery,
  StoryGenre.Fantasy,
  StoryGenre.SliceOfLife,
];

/** The hint under the genre chips; mirrors the API's `GENRE_NOTES`. */
export const GENRE_NOTE: Record<StoryGenre, string> = {
  [StoryGenre.Drama]: 'Real feelings, a hard choice, a moment that lands.',
  [StoryGenre.Action]:
    'Clear stakes and movement. Fights and chases stay stylised, with no gore.',
  [StoryGenre.Comedy]: 'A setup, a turn and a punchline. Timing does the work.',
  [StoryGenre.Romance]:
    'Two people and one spark or misunderstanding. No sexual content.',
  [StoryGenre.Horror]: 'Scares come from suspense and sound, not gore.',
  [StoryGenre.Mystery]:
    'A question in the first seconds and a reveal at the end.',
  [StoryGenre.Fantasy]: 'One impossible thing in an ordinary world.',
  [StoryGenre.SliceOfLife]: 'Small, true-to-life moments people recognise.',
};

/** The mood an AI clip description asks for; mirrors the API's `GENRE_MOODS`. */
export const GENRE_MOOD: Record<StoryGenre, string> = {
  [StoryGenre.Drama]: 'quiet and emotional',
  [StoryGenre.Action]: 'fast and tense',
  [StoryGenre.Comedy]: 'light and comic',
  [StoryGenre.Romance]: 'warm and tender',
  [StoryGenre.Horror]: 'tense and eerie',
  [StoryGenre.Mystery]: 'hushed and curious',
  [StoryGenre.Fantasy]: 'bright and wondrous',
  [StoryGenre.SliceOfLife]: 'natural and everyday',
};

export const STORYTELLING_LABEL: Record<Storytelling, string> = {
  [Storytelling.Acted]: 'Acted',
  [Storytelling.Narrated]: 'Narrated',
};

export const STORYTELLING_HINT: Record<Storytelling, string> = {
  [Storytelling.Acted]:
    'The cast acts it out. Viewers hear what they say and the real sound.',
  [Storytelling.Narrated]: 'A narrator tells the story over the scenes.',
};

export const STORY_LENGTHS = [30, 45, 60] as const;

export const STORY_LIMITS = {
  cast: 4,
  detail: 160,
  name: 24,
  role: 80,
  look: 80,
  ownPremise: 280,
  endLine: 60,
} as const;

/** The Story step aside (R28 D6). */
export const STORY_RULES = [
  'Stories are fiction. Don’t present one as real news.',
  'Action and scares stay stylised, with no gore.',
  'No sexual content, and no one under 18 in romance or violence.',
  'Never use a real public figure as a character.',
] as const;

const AFFILIATE: StudioPresentation = {
  type: StudioType.Affiliate,
  name: 'Affiliate Studio',
  icon: ShoppingBag,
  area: 'Marketing',
  title: 'Affiliate video',
  description:
    'Turn a product into a short video that sells, from facts you approve.',
  createLabel: 'Create an affiliate video, Affiliate Studio',
  lockedBanner: {},
  intakeSteps: [
    ProjectStepKey.Product,
    ProjectStepKey.Facts,
    ProjectStepKey.Strategy,
  ],
  intakeGroup: 'Plan',
  subjectLine: (project) =>
    project.productTitle
      ? { text: project.productTitle, muted: false }
      : { text: 'No product yet', muted: true },
  railSubject: (project) =>
    project.productTitle
      ? { text: project.productTitle, muted: false }
      : { text: 'No product yet', muted: true },
  duplicateBlocked: (project) =>
    project.productTitle ? null : 'Add a product first',
  shotSubjectLabel: SHOT_SUBJECT_LABEL,
  claimCheck: true,
  characters: false,
  adTag: true,
  castShoot: false,
  lastSceneNote: null,
  writeJob: {
    steps: [
      'Reading your approved facts',
      'Writing hooks and scenes',
      'Checking claims',
    ],
    kept: 'Your facts, strategy and earlier versions are safe.',
  },
  briefAside: {
    title: 'Before you post',
    reminders: [
      'Add the affiliate disclosure your platform requires.',
      'Label AI-assisted content if your platform asks for it.',
      'Check the price and stock on the listing on the day you post.',
    ],
  },
  media: {
    uploadsNote:
      'Check that each photo shows the product you’re promoting. What viewers see counts as a claim too.',
    keepConsistentSubtitle:
      'The product and props that appear across scenes. Add a photo of each so every AI clip shows the same thing.',
    keepConsistentHint:
      'Objects and places only. Describe people in the shot direction.',
    photosOptional: false,
    punchInHint:
      'Comes in with a Punch-in. Pick a shot with some room around the product.',
  },
  castHint: '1 to 3 people: a first name, who they are and what they wear.',
  noNarration: 'This skit has no narration.',
  uploadRightsNote: 'Only upload media you own or have permission to use in ads.',
  clips: {
    describe: false,
    checks: [
      'The packaging, logo, buttons and colors match my product.',
      'It doesn’t show the product doing anything my approved facts don’t say.',
    ],
    checkCaption:
      'AI clips can change small details. What viewers see counts as a claim too.',
    sheetDescription:
      'Makes clips as long as the scene from your photos. Check a clip before you use it.',
    promptHint:
      'Describe the camera and the scene. Don’t add features the product doesn’t have.',
    referencesHint:
      'The AI keeps the product looking like these photos. It picks the opening frame itself.',
    referencesPhotos: 'photos of the product',
    pickerHint: {
      firstFrame:
        'The clip starts on this frame. Pick a clear photo of the real product.',
      firstLastFrame:
        'Use two photos of the same product, for example the box and then the product in use.',
      references: 'Different angles of the same product help it stay accurate.',
    },
    noPhotos: 'Add a product photo first. Clips always use your own photos.',
  },
  edit: {
    endCardHint: '2 s at the end with your product name and call to action.',
    endLine: false,
    endCardLines: (card) => ({
      title: card.productTitle ?? '',
      line: card.cta ?? null,
    }),
    musicRightsLabel: 'I have the right to use this music in ads',
  },
  exportReminders: [
    'Turn on TikTok’s content disclosure setting when you earn commission from the video.',
    'Add TikTok’s AI-generated label when your platform asks for it, for example for an AI voice.',
    'Check the price and stock on the listing on the day you post.',
  ],
};

const ENTERTAINMENT: StudioPresentation = {
  type: StudioType.Entertainment,
  name: 'Entertainment Studio',
  icon: Drama,
  area: 'Entertainment',
  title: 'Story',
  description:
    'A short drama, action or comedy scene with a cast, lines and sound.',
  createLabel: 'Create a story, Entertainment Studio',
  lockedBanner: {
    [ProjectStepKey.Script]: {
      title: 'Finish the story first.',
      detail:
        'Script opens after you choose a genre and a premise, and add a character for an acted story.',
    },
  },
  intakeSteps: [ProjectStepKey.Story],
  intakeGroup: 'Plan',
  subjectLine: (project) => {
    const genre = project.story?.genre;

    return genre
      ? { text: `Story · ${GENRE_LABEL[genre]}`, muted: false }
      : { text: 'Story · No genre yet', muted: true };
  },
  railSubject: (project) => {
    const genre = project.story?.genre;

    return genre
      ? { text: GENRE_LABEL[genre], muted: false }
      : { text: 'No genre yet', muted: true };
  },
  duplicateBlocked: (project) =>
    project.story?.genre ? null : 'Pick a genre first',
  shotSubjectLabel: {
    [ShotSubject.Creator]: 'Cast on camera',
    [ShotSubject.Hands]: 'Hands only',
    [ShotSubject.ProductOnly]: 'No one in frame',
  },
  claimCheck: false,
  characters: true,
  adTag: false,
  castShoot: true,
  lastSceneNote: 'Stories end on a cliffhanger, so viewers want the next part.',
  writeJob: {
    steps: [
      'Reading your story',
      'Writing hooks and scenes',
      'Checking the script',
    ],
    kept: 'Your story and earlier versions are safe.',
  },
  briefAside: {
    title: 'Before you film and post',
    reminders: [
      'Get permission from everyone who appears.',
      'Fake fights and stunts with angles and cuts. Never film real danger.',
      'Label AI-generated scenes if your platform asks for it.',
    ],
  },
  media: {
    uploadsNote:
      'Use photos you have the rights to, and only people who agreed to appear.',
    keepConsistentSubtitle:
      'The characters and props that appear across scenes. Add a photo to keep one looking the same, or let the words describe them.',
    keepConsistentHint:
      'Characters and props only. Describe places in the shot direction.',
    photosOptional: true,
    punchInHint:
      'Comes in with a Punch-in. Pick a shot with some room around the subject.',
  },
  castHint: 'Up to 4 people: a first name, who they are and what they wear.',
  noNarration: 'This story has no narration.',
  uploadRightsNote:
    'Only upload media you own or have permission to use, and only people who agreed to appear.',
  clips: {
    describe: true,
    checks: [
      'The characters and places look the way the story needs.',
      'It doesn’t show a real person who hasn’t agreed to appear.',
    ],
    checkCaption:
      'AI clips can change small details between scenes. Check faces and clothes against scene 1.',
    sheetDescription:
      'Makes clips as long as the scene from your description or your photos. Check a clip before you use it.',
    promptHint: 'Describe the camera, the place and who is in the shot.',
    referencesHint:
      'The AI keeps people and things looking like these photos. It picks the opening frame itself.',
    referencesPhotos: 'photos',
    pickerHint: {
      firstFrame:
        'The clip starts on this frame. Pick a clear photo of the person or place.',
      firstLastFrame:
        'Use two photos of the same scene, for example a character before and after the moment.',
      references:
        'Different angles of the same person or thing help them stay the same.',
    },
    noPhotos: 'No photos yet. Use Describe only, or add a photo.',
  },
  edit: {
    endCardHint: '2 s at the end with the story’s title and your end line.',
    endLine: true,
    endCardLines: (card) => ({
      title: card.storyTitle ?? '',
      line: card.endLine?.trim() || null,
    }),
    musicRightsLabel: 'I have the right to use this music in this video',
  },
  exportReminders: [
    'Add TikTok’s AI-generated label when a scene uses an AI clip or voice.',
    'Make sure everyone who appears agreed to be in the video.',
    'Don’t present the story as something that really happened.',
  ],
};

/** Every studio; the Record makes a missing one a type error. */
export const STUDIOS: Record<StudioType, StudioPresentation> = {
  [StudioType.Affiliate]: AFFILIATE,
  [StudioType.Entertainment]: ENTERTAINMENT,
};

/** A project's studio; anything unknown reads as Affiliate, as the API does. */
export function studioOf(
  type: StudioType | null | undefined,
): StudioPresentation {
  return (type && STUDIOS[type]) || AFFILIATE;
}
