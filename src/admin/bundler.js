import { bundle } from '@adminjs/bundler'

await bundle({
  customComponentsInitializationFilePath: './src/admin/components.js',
  destinationDir: './public',
})