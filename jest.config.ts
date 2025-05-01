import { createDefaultPreset, type JestConfigWithTsJest } from 'ts-jest'

const presetConfig = createDefaultPreset({
  tsconfig: false
})

const jestConfig: JestConfigWithTsJest = {
  ...presetConfig,
}

export default jestConfig
