jest.mock('obsidian')
jest.mock('../src/client/jiraClient')
import { DEFAULT_SETTINGS, JiraIssueSettingTab, SettingsData } from "../src/settings"
import { ACCOUNT_TEMPLATE } from "../src/settings/account-settings-mixin"
import { JiraFieldVisibility, JiraTrackerSettings } from "../src/settings/settings.interfaces"

function deepCopy(obj: any): any {
    return JSON.parse(JSON.stringify(obj))
}

const StoredSettings = {
	account: ACCOUNT_TEMPLATE,
	apiBasePath: 'apiBasePathVal',
	cache: {
		columns: ['column1', 'column2'],
	},
	cacheTime: 'cacheTimeVal',
	inlineIssuePrefix: 'inlineIssuePrefixVal',
	inlineIssueUrlToTag: true,
    debugMode: true,
    jiraFieldOptions: {} as JiraFieldVisibility,
	searchColumns: [],
	searchResultsLimit: 99,
} as JiraTrackerSettings

describe('Settings', () => {
    const pluginMock = {
        loadData: jest.fn(),
        saveData: jest.fn(),
    }
    const settingTab = new JiraIssueSettingTab(null as any, pluginMock as any)

    test('loadSettings empty settings to default', async () => {
        pluginMock.loadData.mockReturnValueOnce({})
        await settingTab.loadSettings()
        expect(pluginMock.loadData).toBeCalledTimes(1)
        expect(pluginMock.saveData).toBeCalledTimes(1)
        expect(pluginMock.saveData.mock.calls[0][0]).toEqual({
            ...DEFAULT_SETTINGS,
            accounts: [ACCOUNT_TEMPLATE],
            customFieldsIdToName: null,
            customFieldsNameToId: null,
            jqlAutocomplete: null,
            statusColorCache: null,
        })
        expect(SettingsData).toEqual({
            ...DEFAULT_SETTINGS,
            accounts: [ACCOUNT_TEMPLATE],
        })
    })
    test('loadSettings valid full settings', async () => {
        pluginMock.loadData.mockReturnValueOnce(deepCopy(StoredSettings))
        await settingTab.loadSettings()
        expect(pluginMock.loadData).toBeCalledTimes(1)
        expect(pluginMock.saveData).toBeCalledTimes(0)
        expect(SettingsData).toEqual({
            ...StoredSettings,
            accounts: [{
                ...StoredSettings.account,
                priority: 1,
                "cache": {
                    "customFieldsIdToName": {},
                    "customFieldsNameToId": {},
                    "customFieldsType": {},
                    "jqlAutocomplete": {
                        "fields": [],
                        "functions": {},
                    },
                    "statusColor": {},
                },
            }],
            cache: { columns: [] }
        })
    })
    test('loadSettings clean cache', async () => {
        pluginMock.loadData.mockReturnValueOnce(deepCopy(StoredSettings))
        await settingTab.loadSettings()
        expect(SettingsData.cache.columns.length).toEqual(0)
    })
    test.todo('loadSettings legacy account migration')
    test.todo('saveSettings')
    test.todo('createNewEmptyAccount')
    test.todo('accountsConflictsFix')
    test.todo('createPriorityOptions')

    afterEach(() => {
        jest.clearAllMocks()
    })
})

export { }