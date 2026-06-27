import { GraphQLDefinitionsFactory } from '@nestjs/graphql';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

async function generateGraphqlTypes() {
  const outputDir = join(process.cwd(), 'src/graphql/generated');
  const outputPath = join(outputDir, 'graphql.ts');

  mkdirSync(outputDir, { recursive: true });
  const definitionsFactory = new GraphQLDefinitionsFactory();

  await definitionsFactory.generate({
    typePaths: [join(process.cwd(), 'src/graphql/schemas/**/*.gql')],
    path: outputPath,
    outputAs: 'interface',
    emitTypenameField: true,
    watch: false,
  });

  console.log(`Generated GraphQL types: ${outputPath}`);
}

generateGraphqlTypes().catch((error: unknown) => {
  console.error('Failed to generate GraphQL types.', error);
  process.exit(1);
});
