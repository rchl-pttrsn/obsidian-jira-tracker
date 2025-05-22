import { Notice, Setting } from 'obsidian'
import { JiraAccountSettings } from './settings.interfaces'
import JiraClient from 'src/client/jiraClient'

export const ACCOUNT_TEMPLATE: JiraAccountSettings = {
	alias: 'Jira',
	host: 'https://mycompany.atlassian.net',
	color: '#000000',
	cache: {
		statusColor: {},
		customFieldsIdToName: {},
		customFieldsNameToId: {},
		customFieldsType: {},
		jqlAutocomplete: {
			fields: [],
			functions: {},
		},
	},
}
function debounce<T extends (...args: any[]) => void>(func: T, wait: number) {
	let timeout: ReturnType<typeof setTimeout>
	return function (this: any, ...args: Parameters<T>) {
		clearTimeout(timeout)
		timeout = setTimeout(() => func.apply(this, args), wait)
	}
}

export function createJiraAccountTile(
	containerEl: HTMLElement,
	account: JiraAccountSettings,
	buttonOverride?: (button: import('obsidian').ButtonComponent) => void,
	extraButtonCb?: (button: import('obsidian').ExtraButtonComponent) => void
) {
	const setting = new Setting(containerEl)
		.setName(`${account.alias || ACCOUNT_TEMPLATE.alias} Account`)
		.setDesc(account.host || ACCOUNT_TEMPLATE.host)

	if (extraButtonCb) {
		setting.addExtraButton(extraButtonCb)
		// setting.addExtraButton((button) =>
		// 	button
		// 		.setIcon('plug-zap')
		// 		.setTooltip('Test connection')
		// 		.onClick(async () => {
		// 			button.setDisabled(true)
		// 			button.setIcon('loader').extraSettingsEl.addClass('rotate-animation')
		// 			try {
		// 				const loggedUser = await JiraClient.getLoggedUser()
		// 				new Notice(
		// 					`Successfully connected to Jira - Logged as ${loggedUser.displayName}`
		// 				)
		// 			} catch (e) {
		// 				new Notice('Failed to connect to Jira...')
		// 				console.error('JiraTracker:TestConnection', e)
		// 			}
		// 			button.setIcon('plug-zap')
		// 			button.setDisabled(false)
		// 		})
		// )
	}

	// if (buttonOverride) {
	// 	setting.addButton((button) => {
	// 		buttonOverride(button)
	// 	})
	// }
	setting.addButton((button) => {
		if (buttonOverride) {
			buttonOverride(button)
		} else {
			button.setButtonText('Test connection').onClick(async () => {
				button.setDisabled(true)
				button.setButtonText('Testing...')
				try {
					const loggedUser = await JiraClient.getLoggedUser()
					new Notice(
						`Successfully connected to Jira - Logged as ${loggedUser.displayName}`
					)
				} catch (e) {
					new Notice('Failed to connect to Jira...')
					console.error('JiraTracker:TestConnection', e)
				}
				button.setButtonText('Test connection')
				button.setDisabled(false)
			})
		}
	})

	setting.infoEl.addClass('jira-account-tile')
	setting.infoEl.style.setProperty('--jira-account-color', account.color)
	return setting
}

export function addTextSetting(
	containerEl: HTMLElement,
	onChangeCb: (value: string) => void,
	options: { name: string; initialValue: string; placeholder?: string }
) {
	const debouncedUpdate = debounce(onChangeCb, 1000)
	const { name, placeholder = '', initialValue } = options
	new Setting(containerEl)
		.setName(name)
		.addText((text) =>
			text
				.setPlaceholder(placeholder)
				.setValue(initialValue)
				.onChange(debouncedUpdate)
		)
}
