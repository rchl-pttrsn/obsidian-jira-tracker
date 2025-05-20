import {
	AbstractInputSuggest,
	App,
	SearchResult,
	prepareFuzzySearch,
} from 'obsidian'
import { SEARCH_COLUMNS_DESCRIPTION } from 'src/settings/settingsInterfaces'
import { SettingsData } from 'src/settings'

/*
 * Class that can be added to an existing inputElement to add suggestions.
 * It needs an implementation of `getContent` to provide the set of things to suggest from
 * By default it does a FuzzySearch over these: this can be changed to a simple search
 * by overriding `getSuggestions`
 * `targetMatch` is a regex that finds the part of the input to use as a search term
 * It should provide two groups: the first one is left alone, the second one is the
 * search term, and is replaced by the result of the suggestions. By default, it's
 * a comma separator.
 *
 */
abstract class ContentSuggest extends AbstractInputSuggest<string> {
	content: string[]
	suggestEl: HTMLElement
	suggestions: any
	inputEl: HTMLInputElement

	constructor(app: App, inputEl: HTMLInputElement) {
		super(app, inputEl)
		this.inputEl = inputEl
		this.content = this.getContent()
	}
	getContent() {
		return this.app.vault.getAllFolders().map(({ path }) => path)
	}

	getSuggestions(inputStr: string): string[] {
		return this.doFuzzySearch(inputStr)
	}

	doSimpleSearch(target: string): string[] {
		if (!target || target.length < 2) return []
		const lowerCaseInputStr = target.toLocaleLowerCase()
		const t = this.content.filter((content) =>
			content.toLocaleLowerCase().contains(lowerCaseInputStr)
		)
		return t
	}

	doFuzzySearch(target: string, maxResults = 20, minScore = -2): string[] {
		if (!target || target.length < 2) return this.content
		const fuzzy = prepareFuzzySearch(target)
		const matches: [string, SearchResult][] = this.content.map((c) => [
			c,
			fuzzy(c),
		])
		const goodMatches = matches.filter((i) => i[1] && i[1]['score'] > minScore)
		goodMatches.sort((c) => c[1]['score'])
		const ret = goodMatches.map((c) => c[0])
		return ret.slice(0, maxResults)	
	}

	renderSuggestion(content: string, el: HTMLElement): void {
		el.setText(content)
	}

	selectSuggestion(content: string, evt: MouseEvent | KeyboardEvent): void {
		this.inputEl.value = content
		this.inputEl.dispatchEvent(new Event('input', { bubbles: true }))
		this.inputEl.focus()
		this.close()
	}
}

export class FolderSuggest extends ContentSuggest {
	getContent() {
		return this.app.vault.getAllFolders(true).map(({ path }) => path)
	}
}

export class FileSuggest extends ContentSuggest {
	getContent() {
		return this.app.vault.getMarkdownFiles().map((f) => f.path)
	}
}

export class ColumnSuggest extends ContentSuggest {
	total: number
	incrementalLimit = 10

	constructor(app: App, inputEl: HTMLInputElement) {
		super(app, inputEl)
		this.limit = this.incrementalLimit
		this.total = Object.keys(SEARCH_COLUMNS_DESCRIPTION).length
	}

	getContent() {
		return Object.values(SEARCH_COLUMNS_DESCRIPTION)
	}

	open() {
		super.open()
		this.suggestEl.style.width = `${this.inputEl.parentElement.clientWidth}px`
	}

	selectSuggestion(content: string, evt: MouseEvent | KeyboardEvent): void {
		super.selectSuggestion(content, evt)
		const customEvent = new CustomEvent('selectSuggestion', {
			detail: {
				selectedSuggestion: content,
			},
			bubbles: true,
			cancelable: true,
			composed: false,
		})

		this.suggestEl.dispatchEvent(customEvent)
	}
}
