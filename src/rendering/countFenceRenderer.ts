import { MarkdownPostProcessorContext } from 'obsidian'
import { JiraSearchResults } from '../client/jira.models'
import JiraClient from '../client/jiraClient'
import ObjectsCache from '../objectsCache'
import RC from './renderingCommon'
import { SearchQueryConfig } from '../search-query-config'

function renderSearchCount(
	el: HTMLElement,
	searchResults: JiraSearchResults,
	searchView: SearchQueryConfig
): void {
	const tagsRow = createDiv('ji-tags has-addons')
	const { account } = searchView
	createSpan({
		cls: `ji-tag ji-band`,
		attr: { style: `background-color: ${account.color}` },
		title: account.alias,
		parent: tagsRow,
	})
	createSpan({
		cls: `ji-tag is-link`,
		text: searchView.label || `Count`,
		title: searchView.query,
		parent: tagsRow,
	})
	createSpan({
		cls: `ji-tag`,
		text: searchResults.total.toString(),
		title: searchView.query,
		parent: tagsRow,
	})
	el.replaceChildren(RC.renderContainer([tagsRow]))
}

export const CountFenceRenderer = async (
	source: string,
	el: HTMLElement,
	ctx: MarkdownPostProcessorContext
): Promise<void> => {
	// console.log(`Search query: ${source}`)
	const searchView = SearchQueryConfig.fromString(source)
	const cachedSearchResults = ObjectsCache.get(searchView.getCacheKey())
	if (cachedSearchResults) {
		if (cachedSearchResults.isError) {
			RC.renderSearchError(el, cachedSearchResults.data as string, searchView)
		} else {
			renderSearchCount(
				el,
				cachedSearchResults.data as JiraSearchResults,
				searchView
			)
		}
	} else {
		RC.renderLoadingItem('Loading...')
		JiraClient.getSearchResults(searchView.account,searchView.query)
			.then((newSearchResults) => {
				const searchResults = ObjectsCache.add(
					searchView.getCacheKey(),
					newSearchResults
				).data as JiraSearchResults
				renderSearchCount(el, searchResults, searchView)
			})
			.catch((err) => {
				ObjectsCache.add(searchView.getCacheKey(), err, true)
				RC.renderSearchError(el, err, searchView)
			})
	}
}
