import { MarkdownPostProcessorContext } from "obsidian"
import { IJiraSearchResults } from "../interfaces/issueInterfaces"
import JiraClient from "../client/jiraClient"
import ObjectsCache from "../objectsCache"
import RC from "./renderingCommon"
import { SearchView } from "../searchView"

function renderSearchCount(el: HTMLElement, searchResults: IJiraSearchResults, searchView: SearchView): void {
    const tagsRow = createDiv('ji-tags has-addons');
    const account = searchResults.account;
    createSpan({ cls: `ji-tag ji-band`, attr: { style: `background-color: ${account.color}` }, title: account.alias, parent: tagsRow })
    if (searchView.label !== '') {
        createSpan({ cls: `ji-tag is-link`, text: searchView.label || `Count`, title: searchView.query, parent: tagsRow })
    }
    createSpan({ cls: `ji-tag`, text: searchResults.total.toString(), title: searchView.query, parent: tagsRow })
    el.replaceChildren(RC.renderContainer([tagsRow]))
}

export const CountFenceRenderer = async (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext): Promise<void> => {
    // console.log(`Search query: ${source}`)
    const searchView = SearchView.fromString(source)
    const cachedSearchResults = ObjectsCache.get(searchView.getCacheKey())
    if (cachedSearchResults) {
        if (cachedSearchResults.isError) {
            RC.renderSearchError(el, cachedSearchResults.data as string, searchView)
        } else {
            renderSearchCount(el, (cachedSearchResults.data as IJiraSearchResults), searchView)
        }
    } else {
        RC.renderLoadingItem('Loading...')
        JiraClient.getSearchResults(searchView.query).then(newSearchResults => {
            const searchResults = ObjectsCache.add(searchView.getCacheKey(), newSearchResults).data as IJiraSearchResults
            renderSearchCount(el, searchResults, searchView)
        }).catch(err => {
            ObjectsCache.add(searchView.getCacheKey(), err, true)
            RC.renderSearchError(el, err, searchView)
        })
    }
}
