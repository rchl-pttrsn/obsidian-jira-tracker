import { MarkdownPostProcessorContext, setIcon } from 'obsidian'
import { toDefaultedIssue, JiraSearchResults } from '../client/jira.models'
import JiraClient from '../client/jiraClient'
import ObjectsCache from '../objectsCache'
import { renderTableColumn } from './renderTableColumns'
import { SearchQueryConfig } from '../search-query-config'
import { SettingsData } from '../settings'
import RC from './renderingCommon'
import {
	JiraFields,
	SearchResultFormats,
	JiraAccountSettings,
	JIRA_FIELDS,
} from '../settings/settings.models'

async function renderSearchResults(
	rootEl: HTMLElement,
	searchView: SearchQueryConfig,
	searchResults: JiraSearchResults
): Promise<void> {
	if (searchView.type === SearchResultFormats.LIST) {
		renderSearchResultsList(rootEl, searchView, searchResults)
	} else {
		await renderSearchResultsTable(rootEl, searchView, searchResults)
	}
}

async function renderSearchResultsTable(
	rootEl: HTMLElement,
	searchView: SearchQueryConfig,
	searchResults: JiraSearchResults
): Promise<void> {
	const table = createEl('table', { cls: 'is-narrow' })
	renderSearchResultsTableHeader(table, searchView)
	await renderSearchResultsTableBody(table, searchView, searchResults)

	const footer = renderSearchFooter(rootEl, searchView, searchResults)
	rootEl.replaceChildren(RC.renderContainer([table, footer]))
}

function renderSearchResultsTableHeader(
	table: HTMLElement,
	searchView: SearchQueryConfig
): void {
	const header = createEl('tr', {
		parent: createEl('thead', {
			attr: { style: 'border-left: 3px solid ' + searchView.account.color },
			parent: table,
		}),
	})
	const { columns } = searchView
	for (const column of columns) {
		let name = JIRA_FIELDS[column.type]
		// Frontmatter
		if (column.type === JiraFields.NOTES && column.extra) {
			name = column.extra
		}
		// // Custom field
		// if (column.type === JiraFields.CUSTOM_FIELD) {
		// 	if (Number(column.extra)) {
		// 		name = account.cache.customFieldsIdToName[column.extra]
		// 	} else {
		// 		name = column.extra
		// 	}
		// }
		if (column.compact) {
			createEl('th', {
				text: name[0].toUpperCase(),
				attr: { 'aria-label-position': 'top', 'aria-label': column.type },
				parent: header,
			})
		} else {
			createEl('th', { text: name, title: column.type, parent: header })
		}
	}
}

async function renderSearchResultsTableBody(
	table: HTMLElement,
	searchView: SearchQueryConfig,
	searchResults: JiraSearchResults
): Promise<void> {
	const { account, columns } = searchView
	const tbody = createEl('tbody', { parent: table })
	for (let issue of searchResults.issues) {
		issue = toDefaultedIssue(issue)
		const row = createEl('tr', { parent: tbody })
		await renderTableColumn(account, columns, issue, row)
	}
}

function renderSearchResultsList(
	rootEl: HTMLElement,
	serachView: SearchQueryConfig,
	searchResults: JiraSearchResults
): void {
	const list: HTMLElement[] = []
	for (const issue of searchResults.issues) {
		list.push(RC.renderIssue(serachView.account, issue))
	}
	rootEl.replaceChildren(RC.renderContainer(list))
}

function renderSearchFooter(
	rootEl: HTMLElement,
	searchView: SearchQueryConfig,
	searchResults: JiraSearchResults
): HTMLElement {
	const searchFooter = createDiv({ cls: 'search-footer' })
	const searchCount = `Total results: ${searchResults.total.toString()} - ${
		searchView.account.alias
	}`

	createEl('a', {
		text: searchCount,
		href: RC.searchUrl(searchView.account, searchView.query),
		parent: searchFooter,
	})

	const lastUpdateContainer = createDiv({ parent: searchFooter })
	createSpan({
		text: `Last update: ${ObjectsCache.getTime(searchView.getCacheKey())}`,
		parent: lastUpdateContainer,
	})
	const refreshButton = createEl('button', {
		parent: lastUpdateContainer,
		title: 'Refresh',
		cls: 'rotate-animation',
	})
	setIcon(refreshButton, 'sync-small')
	refreshButton.onClickEvent(() => {
		rootEl.empty()
		ObjectsCache.delete(searchView.getCacheKey())
		SearchFenceRenderer(searchView.toRawString(), rootEl, null)
	})
	return searchFooter
}

export const SearchFenceRenderer = async (
	source: string,
	rootEl: HTMLElement,
	ctx: MarkdownPostProcessorContext
): Promise<void> => {
	try {
		const searchView = SearchQueryConfig.fromString(source)
		const cachedSearchResults = ObjectsCache.get(searchView.getCacheKey())
		if (cachedSearchResults) {
			if (cachedSearchResults.isError) {
				RC.renderSearchError(
					rootEl,
					cachedSearchResults.data as string,
					searchView
				)
			} else {
				await renderSearchResults(
					rootEl,
					searchView,
					cachedSearchResults.data as JiraSearchResults
				)
			}
		} else {
			// console.log(`Search results not available in the cache`)
			RC.renderLoadingItem('Loading...')
			JiraClient.getSearchResults(searchView.account, searchView.query, {
				limit: searchView.limit
			})
				.then((newSearchResults) => {
					const searchResults = ObjectsCache.add(
						searchView.getCacheKey(),
						newSearchResults
					).data as JiraSearchResults
					renderSearchResults(rootEl, searchView, searchResults)
				})
				.catch((err) => {
					ObjectsCache.add(searchView.getCacheKey(), err, true)
					RC.renderSearchError(rootEl, err, searchView)
				})
		}
	} catch (err) {
		RC.renderSearchError(rootEl, err, null)
	}
}
