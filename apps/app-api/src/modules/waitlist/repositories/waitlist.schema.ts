import type { IndexDefinition, IndexOptions, SchemaDefinition } from 'mongoose';
import { Types } from 'mongoose';
import { WaitlistRole } from 'src/graphql/generated/graphql';

export const WAITLIST_COLLECTION_NAME = 'WaitlistEntries';

export const WAITLIST_SCHEMA_DEFINITION: SchemaDefinition = {
  id: Types.ObjectId,
  email: String,
  role: {
    type: String,
    enum: Object.values(WaitlistRole),
  },
  firstName: String,
  lastName: String,
  organizationName: String,
  city: String,
  mobile: String,
  message: String,
  createdAt: Date,
};

export const WAITLIST_SCHEMA_INDEXES: [IndexDefinition, IndexOptions?][] = [
  [{ email: 1 }, { unique: true }],
  [{ role: 1, createdAt: -1 }],
  [{ createdAt: -1 }],
];
