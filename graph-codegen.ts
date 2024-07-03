import { CodegenConfig } from '@graphql-codegen/cli'
import { config as dotenvConfig } from 'dotenv'

dotenvConfig({ path: './.env.local' }) // point to root of project for now

const config: CodegenConfig = {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  schema: [process.env.GRAPH_URL_ARBITRUM_NEW!],
  documents: ['src/graphQueries/**/*.{ts,tsx}'],
  generates: {
    './src/types/gql/': {
      preset: 'client',
      plugins: [],
      presetConfig: {
        gqlTagName: 'gql',
        fragmentMasking: false,
      },
      config: {
        skipTypename: true,
        scalars: {
          BigInt: 'string',
          Bytes: 'string',
        },
      },
    },
  },
  ignoreNoDocuments: true,
}

export default config
