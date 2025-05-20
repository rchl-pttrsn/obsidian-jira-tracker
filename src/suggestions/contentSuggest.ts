import {
	AbstractInputSuggest,
	App,
	SearchResult,
	prepareFuzzySearch,
} from 'obsidian'
import { SEARCH_COLUMNS_DESCRIPTION } from 'src/interfaces/settingsInterfaces'
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
		// FIXME: this is a hack to make the suggestEl the same width as the inputEl; REPOSITION IS WONKY e.prototype.reposition on resize
	}
	close() {
		super.close()
		this.limit = this.incrementalLimit
		this.suggestEl.getElementsByClassName(
			'footer-text'
		)[0].textContent = `${this.limit} of ${this.total}`
	}

// 	private createFooter(): void {
// 		const footer = this.suggestEl.createEl('div', { cls: 'suggestion-footer' })

// 		const nextSuggestionButton = footer.createEl('button', {
// 			text: 'Show more',
// 			cls: 'next-suggestion',
// 		})

// 		const footerText = footer.createEl('span', {
// 			text: `${this.limit} of ${this.total}`,
// 			cls: 'footer-text',
// 		})

// 		this.suggestEl.on('mousedown', '.suggestion-footer', function (e) {
// 			e.preventDefault()
// 		})
// 		nextSuggestionButton.addEventListener('click', (e) => {
// 			e.preventDefault()
// 			e.stopPropagation()
// 			const remaining = this.total - this.limit
// 			this.limit += Math.min(remaining, this.incrementalLimit)
// 			footerText.textContent = `${this.limit} of ${this.total}`

// 			if (this.limit === this.incrementalLimit) {
// 				super.showSuggestions(this.content)
// 			} else {
// 				const newValues = this.content.slice(
// 					this.limit - this.incrementalLimit,
// 					this.limit
// 				)
// 				newValues.forEach((val) => this.suggestions.addSuggestion(val))
// 				// this.calculateVisibleSuggestions(e)
// 			}
// 		})
// 	}

// 	calculateVisibleSuggestions(source: Event): void {
// 		const [lastVisibleItem, lastVisibleIdx] = getLastVisibleItemIdx(
// 			this.suggestions.containerEl,
// 			this.suggestions.suggestions
// 		)
// console.log({ lastVisibleItem: lastVisibleItem.getText(), lastVisibleIdx })
// 		this.suggestions.setSelectedItem(lastVisibleIdx, source)

// 		lastVisibleItem.scrollIntoView({
// 			behavior: 'smooth',
// 			block: 'start',
// 		})

// 		function getLastVisibleItemIdx(
// 			container: HTMLElement,
// 			items: HTMLElement[]
// 		): [HTMLElement, number] {
// 			const containerRect = container.getBoundingClientRect()

// 			let lastVisible: [HTMLElement, number]
// 			for (let i = 0; i < items.length; i++) {
// 				const itemRect = items[i].getBoundingClientRect()
// 				if (itemRect.bottom > containerRect.bottom) {
// 					console.log({itemTop: itemRect.top, bottomContainer: containerRect.bottom})
// 					break
// 				}
// 				console.log('last visible: ',items[i].getText(), i, itemRect)
// 				lastVisible = [items[i], i]
// 			}
// 			return lastVisible
// 		}
// 	}
}
