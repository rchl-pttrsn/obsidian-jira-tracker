jest.mock('../src/main', () => {
    return { ObsidianApp: { vault: { getConfig: jest.fn() } } }
})
jest.mock('../src/settings', () => { return { SettingsData: { colorSchema: null } } })

import { SettingsData } from '../src/settings'
import RC from '../src/rendering/renderingCommon'
import { EColorSchema } from '../src/interfaces/settingsInterfaces'
import * as main from '../src/main'

const kLightCSSClass = 'is-light'
const kDarkCSSClass = 'is-dark'

const getConfigMock: jest.Mock = (main.ObsidianApp.vault as any).getConfig

export { }
