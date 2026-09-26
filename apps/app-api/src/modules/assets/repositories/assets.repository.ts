import { Connection } from 'mongoose';
import type {
  AssetKind,
  AssetOrigin,
  AssetPurpose,
  AssetStatus,
  SceneClipMode,
} from 'src/graphql/generated/graphql';
import { MongooseRepository } from 'src/libs/mongoose-repository';
import type { Repository } from 'src/libs/repository';

/** How an AI scene clip was made (origin AI_CLIP only). */
export interface AiClipRecord {
  jobId: string;
  sceneId: string;
  /** Null when no photo was sent (Describe only, or a story's still-only one-click clip). */
  sourceAssetId: string | null;
  /** Missing on clips made before modes existed; read as FIRST_FRAME. */
  mode?: SceneClipMode;
  /** FIRST_LAST_FRAME: the photo it ends on. */
  endAssetId?: string | null;
  /** REFERENCES and CONSISTENT: every photo it was matched to, in order. */
  referenceAssetIds?: string[];
  /** CONSISTENT: the scene whose still was sent last; null for the first scene. */
  continuitySceneId?: string | null;
  /** CONSISTENT: that scene's photo or clip. */
  continuityAssetId?: string | null;
  label: string;
  prompt: string;
  model: string;
  providerTaskId: string;
  /** The creator's product-accuracy check; required before use in a scene. */
  checkedAt: Date | null;
}

export interface AssetRecord {
  id: string;
  ownerId: string;
  organizationId: string | null;
  projectId: string;
  kind: AssetKind;
  /** Missing on files stored before audio uploads existed; read as MEDIA. */
  purpose?: AssetPurpose;
  /** Missing on files stored before AI clips existed; read as UPLOAD. */
  origin?: AssetOrigin;
  aiClip?: AiClipRecord | null;
  status: AssetStatus;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  durationSeconds: number | null;
  /** Server-generated: projects/<projectId>/(assets|audio|ai-clips)/<assetId>.<ext>. */
  storageKey: string;
  rightsConfirmedAt: Date;
  replacesAssetId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type AssetsRepository = Repository<AssetRecord>;

export async function AssetsRepositoryFactory(
  connection: Connection,
): Promise<AssetsRepository> {
  return new MongooseRepository<AssetRecord>(
    connection,
    'Assets',
    {
      id: { type: String, required: true },
      ownerId: { type: String, required: true },
      organizationId: { type: String, default: null },
      projectId: { type: String, required: true },
      kind: { type: String, required: true },
      purpose: { type: String, default: 'MEDIA' },
      origin: { type: String, default: 'UPLOAD' },
      aiClip: { type: Object, default: null },
      status: { type: String, required: true },
      fileName: { type: String, required: true },
      contentType: { type: String, required: true },
      sizeBytes: { type: Number, required: true },
      durationSeconds: { type: Number, default: null },
      storageKey: { type: String, required: true },
      rightsConfirmedAt: { type: Date, required: true },
      replacesAssetId: { type: String, default: null },
      createdAt: Date,
      updatedAt: Date,
    },
    [
      [{ id: 1 }, { unique: true }],
      [{ organizationId: 1, projectId: 1, createdAt: 1 }],
    ],
  );
}
