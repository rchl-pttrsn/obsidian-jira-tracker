import { SettingsData } from './settings'
import {
	COMMENT_REGEX,
	COMPACT_SYMBOL,
	JiraFields,
	SearchResultFormats,
	ISearchColumn,
	JiraAccountSettings,
} from './settings/settings.models'

type Handler = (searchQueryConfig: SearchQueryConfig, value: string) => void

export class SearchQueryConfig {
	account: JiraAccountSettings = SettingsData.account
	type: SearchResultFormats = SearchResultFormats.TABLE
	limit: number = SettingsData.searchResultsLimit
	columns: ISearchColumn[] = SettingsData.searchColumns
	query: string = ''
	label: string = ''

	static searchQueryHandlers: { [key: string]: Handler } = {
		type: (ssearchQueryConfig, value) => {
			if (value.toUpperCase() in SearchResultFormats) {
				ssearchQueryConfig.type = value.toUpperCase() as SearchResultFormats
			} else {
				throw new Error(`Invalid type: ${value}`)
			}
		},
		query: (searchQueryConfig, value) => {
			searchQueryConfig.query = value
		},
		limit: (searchQueryConfig, value) => {
			if (parseInt(value)) {
				searchQueryConfig.limit = parseInt(value)
			} else {
				throw new Error(`Invalid limit: ${value}`)
			}
		},
		columns: (searchQueryConfig, value) => {
			searchQueryConfig.columns = value
				.split(',')
				.filter((column) => column.trim())
				.map((column) => {
					let columnExtra = ''
					const compact = column.trim().startsWith(COMPACT_SYMBOL)
					column = column.trim().replace(new RegExp(`^${COMPACT_SYMBOL}`), '')
					column = column.toUpperCase()
					if (!(column in JiraFields)) {
						throw new Error(`Invalid column: ${column}`)
					}
					return {
						type: column as JiraFields,
						compact: compact,
						extra: columnExtra,
					}
				})
		},
		label: (searchQueryConfig, value) => {
			searchQueryConfig.label = value
		},
	}

	static fromString(str: string): SearchQueryConfig {
		const searchQueryConfig = new SearchQueryConfig()
		const lines = str
			.split('\n')
			.filter((line) => line.trim() && !COMMENT_REGEX.test(line))

		for (const line of lines) {
			const [queryKey, ...parsedValues] = line.split(':')
			const queryValue = parsedValues.join(':').trim()

			if (SearchQueryConfig.searchQueryHandlers[queryKey]) {
				SearchQueryConfig.searchQueryHandlers[queryKey](
					searchQueryConfig,
					queryValue
				)
			} else {
				throw new Error(`Invalid key: ${queryKey}`)
			}
		}

		if (
			searchQueryConfig.type === SearchResultFormats.LIST &&
			searchQueryConfig.columns.length > 0
		) {
			throw new Error('Type LIST and custom columns are not compatible options')
		}
		return searchQueryConfig
	}

	toString(): string {
		return '```jira-search\n' + this.toRawString() + '```'
	}

	toRawString(): string {
		let result = ''
		result += `type: ${this.type}\n`
		result += `query: ${this.query}\n`
		if (this.limit) {
			result += `limit: ${this.limit}\n`
		}
		if (this.columns.length > 0) {
			result += `columns: ${this.columns
				.map(
					(c) =>
						(c.compact ? COMPACT_SYMBOL : '') +
						(c.type !== JiraFields.CUSTOM_FIELD ? c.type : '$' + c.extra)
				)
				.join(', ')}\n`
		}
		return result
	}

	getCacheKey(): string {
		return this.query + this.limit
	}
}
