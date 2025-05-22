import { COMMENT_REGEX, COMPACT_SYMBOL, JiraFields, SearchResultFormats, JiraAccountSettings, ISearchColumn } from "./settings/settings.interfaces"
import { SettingsData } from "./settings"

export class SearchView {
    type: SearchResultFormats = SearchResultFormats.TABLE
    query: string = ''
    limit: number = null
    columns: ISearchColumn[] = []
    account: JiraAccountSettings = null
    label: string = null
    private _cacheKey: string = null

    static fromString(str: string): SearchView {
        const sv = new SearchView()
        const lines = str.split('\n').filter(line => line.trim() && !COMMENT_REGEX.test(line))
        for (const line of lines) {
            const [key, ...values] = line.split(':')
            const value = values.join(':').trim()

            if (!value && lines.length === 1) {
                // Basic mode with only the query
                sv.query = line
            } else {
                // Advanced mode with key value structure
                switch (key.trim().toLowerCase()) {
                    case 'type':
                        if (value.toUpperCase() in SearchResultFormats) {
                            sv.type = value.toUpperCase() as SearchResultFormats
                        } else {
                            throw new Error(`Invalid type: ${value}`)
                        }
                        break
                    case 'query':
                        sv.query = value
                        break
                    case 'limit':
                        if (parseInt(value)) {
                            sv.limit = parseInt(value)
                        } else {
                            throw new Error(`Invalid limit: ${value}`)
                        }
                        break
                    case 'columns':
                        sv.columns = value.split(',')
                            .filter(column => column.trim())
                            .map(column => {
                                let columnExtra = ''
                                // Compact
                                const compact = column.trim().startsWith(COMPACT_SYMBOL)
                                column = column.trim().replace(new RegExp(`^${COMPACT_SYMBOL}`), '')
                                // Frontmatter
                                if (column.toUpperCase().startsWith('NOTES.')) {
                                    const split = column.split('.')
                                    column = split.splice(0, 1)[0]
                                    columnExtra = split.join('.')
                                }
                                // Custom field
                                if (column.startsWith('$')) {
                                    columnExtra = column.slice(1)
                                    column = JiraFields.CUSTOM_FIELD
                                    if (SettingsData.cache.columns.indexOf(columnExtra.toUpperCase()) === -1) {
                                        throw new Error(`Custom field ${columnExtra} not found`)
                                    }
                                }
                                // Check validity
                                column = column.toUpperCase()
                                if (!(column in JiraFields)) {
                                    if (column.startsWith('#')) {
                                        throw new Error(`Please replace the symbol "#" with "${COMPACT_SYMBOL}" to use the compact format`)
                                    }
                                    throw new Error(`Invalid column: ${column}`)
                                }
                                return {
                                    type: column as JiraFields,
                                    compact: compact,
                                    extra: columnExtra,
                                }
                            })
                        break
                    case 'label':
                        sv.label = value
                        break
                    default:
                        throw new Error(`Invalid key: ${key.trim()}`)
                }
            }
        }
        if (sv.type === SearchResultFormats.LIST && sv.columns.length > 0) {
            throw new Error('Type LIST and custom columns are not compatible options')
        }
        return sv
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
            result += `columns: ${this.columns.map(c =>
                (c.compact ? COMPACT_SYMBOL : '') + (c.type !== JiraFields.CUSTOM_FIELD ? c.type : '$' + c.extra)
            ).join(', ')}\n`
        }
        if (this.account) {
            result += `account: ${this.account.alias}\n`
        }
        return result
    }

    getCacheKey(): string {
        if (!this._cacheKey) {
            this._cacheKey = this.query + (this.limit || '') + (this.account ? this.account.alias : '')
        }
        return this._cacheKey
    }
}