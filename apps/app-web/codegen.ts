import { resolve } from 'node:path';

const SCALARS = {
  ID: 'string',
  Cursor: 'string',
  DateTime: {
    input: 'string | Date',
    output: 'string',
  },
};

interface CreateAppConfigOptions {
  schema: string | string[];
  documents: string | string[];
  outputFile: string;
}

function createConfig(options: CreateAppConfigOptions) {
  return {
    schema: options.schema,
    documents: options.documents,
    extensions: {
      codegen: {
        debug: true,
        overwrite: true,
        ignoreNoDocuments: true,
        hooks: {
          afterAllFileWrite: ['prettier --write'],
        },
        generates: {
          [options.outputFile]: {
            plugins: ['typescript', 'typescript-operations'],
            config: {
              scalars: SCALARS,
              strictScalars: true,
              addDocBlocks: false,
              disableDescriptions: true,
              skipDocumentsValidation: true,
              onlyOperationTypes: true,
              skipTypename: true,
            },
          },
        },
      },
    },
  };
}
const APP_API_SCHEMA =
  process.env.APP_API_SCHEMA ??
  resolve(__dirname, '../app-api/src/graphql/schemas/**/*.gql');

const projects = {
  'app-web': createConfig({
    schema: APP_API_SCHEMA,
    documents: 'react-query/graphql/*.ts',
    outputFile: 'react-query/generated__types.ts',
  }),
};

const config = {
  projects,
};

export default config;
