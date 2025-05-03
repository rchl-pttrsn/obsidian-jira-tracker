import { setIcon, TFile } from "obsidian"
import { IJiraDevStatus, IJiraIssue, IJiraSearchField, IJiraUser } from "../interfaces/issueInterfaces"
import RC, { JIRA_STATUS_COLOR_MAP, JIRA_STATUS_COLOR_MAP_BY_NAME } from "./renderingCommon"
import * as jsonpath from 'jsonpath'
import ObjectsCache from "../objectsCache"
import JiraClient from "../client/jiraClient"
import { AVATAR_RESOLUTION, ESearchColumnsTypes, ISearchColumn } from "../interfaces/settingsInterfaces"


export const renderTableColumn = async (columns: ISearchColumn[], issue: IJiraIssue, row: HTMLTableRowElement): Promise<void> => {
    let markdownNotes: TFile[] = null
    for (const column of columns) {
        switch (column.type) {
            case ESearchColumnsTypes.KEY:
                createEl('a', {
                    cls: 'no-wrap',
                    href: RC.issueUrl(issue.account, issue.key),
                    text: column.compact ? '🔗' : issue.key,
                    title: column.compact ? issue.key : RC.issueUrl(issue.account, issue.key),
                    parent: createEl('td', { parent: row })
                })
                break
            case ESearchColumnsTypes.SUMMARY:
                renderLongTextField(column, row, issue.fields.summary)
                break
            case ESearchColumnsTypes.DESCRIPTION:
                renderLongTextField(column, row, issue.fields.description)
                break
            case ESearchColumnsTypes.TYPE:
                const typeCell = createEl('td', { parent: row })
                renderIconField(column, typeCell, issue.fields.issuetype)
                break
            case ESearchColumnsTypes.CREATED:
                renderDateField(column, row, issue.fields.created)
                break
            case ESearchColumnsTypes.UPDATED:
                renderDateField(column, row, issue.fields.updated)
                break
            case ESearchColumnsTypes.REPORTER:
                renderUserField(column, row, issue.fields.reporter)
                break
            case ESearchColumnsTypes.ASSIGNEE:
                renderUserField(column, row, issue.fields.assignee)
                break
            case ESearchColumnsTypes.PRIORITY:
                const parentCell = createEl('td', { parent: row })
                if (issue.fields.priority && issue.fields.priority.name) {
                    renderIconField(column, parentCell, issue.fields.priority)
                } else {
                    parentCell.setText('-')
                }
                break
            case ESearchColumnsTypes.STATUS:
                const statusColor = JIRA_STATUS_COLOR_MAP_BY_NAME[issue.fields.status.name] || 
                JIRA_STATUS_COLOR_MAP[issue.fields.status.statusCategory.colorName] || 
                'is-light'
                if (column.compact) {
                    // TODO IS this valid? name array?
                    createSpan({ cls: `ji-tag no-wrap ${statusColor}`, text: issue.fields.status.name[0].toUpperCase(), title: issue.fields.status.name, attr: { 'data-status': issue.fields.status.name }, parent: createEl('td', { parent: row }) })
                } else {
                    createSpan({ cls: `ji-tag no-wrap ${statusColor}`, text: issue.fields.status.name, title: issue.fields.status.description, attr: { 'data-status': issue.fields.status.name }, parent: createEl('td', { parent: row }) })
                }
                break
            case ESearchColumnsTypes.DUE_DATE:
                renderDateField(column, row, issue.fields.duedate)
                break
            case ESearchColumnsTypes.RESOLUTION:
                if (issue.fields.resolution.description) {
                    createEl('abbr', { text: issue.fields.resolution.name, title: issue.fields.resolution.description, parent: createEl('td', { parent: row }) })
                } else {
                    createEl('td', { text: issue.fields.resolution.name, title: issue.fields.resolution.description, parent: row })
                }
                break
            case ESearchColumnsTypes.RESOLUTION_DATE:
                renderDateField(column, row, issue.fields.resolutiondate)
                break
            case ESearchColumnsTypes.ENVIRONMENT:
                renderLongTextField(column, row, issue.fields.environment)
                break
            case ESearchColumnsTypes.LABELS:
                if (column.compact) {
                    createEl('td', { text: '🏷️', title: issue.fields.labels.join('\n'), parent: row })
                } else {
                    createEl('td', { text: issue.fields.labels.join(', '), parent: row })
                }
                break
            case ESearchColumnsTypes.PROJECT:
                createEl('td', { text: issue.fields.project.key, title: issue.fields.project.name, parent: row })
                break
            case ESearchColumnsTypes.FIX_VERSIONS:
                const fixVersionsCell = createEl('td', { parent: row })
                for (let i = 0; i < issue.fields.fixVersions.length; i++) {
                    const fixVersion = issue.fields.fixVersions[i]
                    if (fixVersion.released) {
                        createEl('strong', { text: fixVersion.name, title: fixVersion.description, parent: fixVersionsCell })
                    } else {
                        createSpan({ text: fixVersion.name, title: fixVersion.description, parent: fixVersionsCell })
                    }
                    if (i < issue.fields.fixVersions.length - 1) {
                        createSpan({ text: ', ', parent: fixVersionsCell })
                    }
                }
                break
            case ESearchColumnsTypes.COMPONENTS:
                createEl('td', { text: issue.fields.components.flatMap(c => c.name).join(', '), parent: row })
                break
            case ESearchColumnsTypes.AGGREGATE_TIME_ESTIMATED:
                renderEstimatorField(column, row, issue.fields.aggregatetimeestimate)
                break
            case ESearchColumnsTypes.AGGREGATE_TIME_ORIGINAL_ESTIMATE:
                renderEstimatorField(column, row, issue.fields.aggregatetimeoriginalestimate)
                break
            case ESearchColumnsTypes.AGGREGATE_TIME_SPENT:
                renderEstimatorField(column, row, issue.fields.aggregatetimespent)
                break
            case ESearchColumnsTypes.TIME_ESTIMATE:
                renderEstimatorField(column, row, issue.fields.timeestimate)
                break
            case ESearchColumnsTypes.TIME_ORIGINAL_ESTIMATE:
                renderEstimatorField(column, row, issue.fields.timeoriginalestimate)
                break
            case ESearchColumnsTypes.TIME_SPENT:
                renderEstimatorField(column, row, issue.fields.timespent)
                break
            case ESearchColumnsTypes.AGGREGATE_PROGRESS:
                createEl('td', { text: issue.fields.aggregateprogress.percent.toString() + '%', parent: row })
                break
            case ESearchColumnsTypes.PROGRESS:
                createEl('td', { text: issue.fields.progress.percent.toString() + '%', parent: row })
                break
            case ESearchColumnsTypes.CUSTOM_FIELD:
                createEl('td', { text: renderCustomField(issue, column.extra), parent: row })
                break
            case ESearchColumnsTypes.NOTES:
                if (!markdownNotes) {
                    markdownNotes = RC.getNotes()
                }
                const noteCell = createEl('td', { parent: row })
                const noteRegex = new RegExp('^' + issue.key + '[^0-9]')
                const connectedNotes = markdownNotes.filter(n => n.name.match(noteRegex))
                if (connectedNotes.length > 0) {
                    for (const note of connectedNotes) {
                        if (column.extra) {
                            renderNoteFrontMatter(column, note, noteCell)
                        } else {
                            renderNoteFile(column, note, noteCell)
                        }
                    }
                } else {
                    createEl('a', { text: '➕', title: 'Create new note', href: issue.key, cls: 'internal-link icon-link', parent: noteCell })
                }
                break
            case ESearchColumnsTypes.LAST_VIEWED:
                renderDateField(column, row, issue.fields.lastViewed)
                break
            case ESearchColumnsTypes.DEV_STATUS:
                const cacheKey = 'dev-status-' + issue.id
                let devStatus: IJiraDevStatus = null
                const devStatusCacheItem = ObjectsCache.get(cacheKey)
                if (devStatusCacheItem) {
                    devStatus = devStatusCacheItem.data as IJiraDevStatus
                } else {
                    devStatus = await JiraClient.getDevStatus(issue.id, { account: issue.account })
                    ObjectsCache.add(cacheKey, devStatus)
                }
                const cell = createEl('td', { parent: row })
                const prDetails = devStatus.summary.pullrequest.overall.details
                if (prDetails.openCount + prDetails.mergedCount + prDetails.declinedCount > 0) {
                    if (prDetails.openCount > 0) {
                        const prOpen = createSpan({ parent: cell, cls: `pull-request-tag pull-request-open ${RC.getTheme()}`, title: 'Open pull-request' })
                        setIcon(prOpen, 'jira-issue-git-pull-request')
                        prOpen.appendText(`${prDetails.openCount}`)
                    }
                    if (prDetails.mergedCount > 0) {
                        const prMerged = createSpan({ parent: cell, cls: `pull-request-tag pull-request-merged ${RC.getTheme()}`, title: 'Merged pull-request' })
                        setIcon(prMerged, 'jira-issue-git-merge')
                        prMerged.appendText(`${prDetails.mergedCount}`)
                    }
                    if (prDetails.declinedCount > 0) {
                        const prDeclined = createSpan({ parent: cell, cls: `pull-request-tag pull-request-delete ${RC.getTheme()}`, title: 'Declined pull-request' })
                        setIcon(prDeclined, 'jira-issue-git-delete')
                        prDeclined.appendText(`${prDetails.declinedCount}`)
                    }
                } else {
                    createSpan({ parent: cell, title: 'No data available', text: '-' })
                }
                break
        }
    }
}

function renderNoteFile(column: ISearchColumn, note: TFile, noteCell: HTMLTableCellElement) {
    if (column.compact) {
        createEl('a', { text: '📝', title: note.path, href: note.path, cls: 'internal-link', parent: noteCell })
    } else {
        const noteNameWithoutExtension = note.name.split('.')
        noteNameWithoutExtension.pop()
        createEl('a', { text: noteNameWithoutExtension.join('.'), title: note.path, href: note.path, cls: 'internal-link', parent: noteCell })
        createEl('br', { parent: noteCell })
    }
}

function renderNoteFrontMatter(column: ISearchColumn, note: TFile, noteCell: HTMLTableCellElement) {
    const frontMatter = RC.getFrontMatter(note)
    const values = jsonpath.query(frontMatter, '$.' + column.extra)
    for (let value of values) {
        value = typeof value === 'object' ? JSON.stringify(value) : value.toString()
        createEl('a', { text: value, title: note.path, href: note.path, cls: 'internal-link', parent: noteCell })
        createEl('br', { parent: noteCell })
    }
}

function renderCustomField(issue: IJiraIssue, customField: string): string {
    if (!Number(customField)) {
        customField = issue.account.cache.customFieldsNameToId[customField]
    }
    const value = issue.fields[`customfield_${customField}`]
    if (typeof value === 'string' || typeof value === 'number') {
        return value.toString()
    }
    return JSON.stringify(value)
}

function renderUserField(column: ISearchColumn, row: HTMLTableRowElement, user: IJiraUser) {
    const userName = user.displayName || ''
    if (column.compact && userName && user.avatarUrls[AVATAR_RESOLUTION]) {
        createEl('img', {
            attr: { src: user.avatarUrls[AVATAR_RESOLUTION], alt: userName },
            title: userName,
            cls: 'avatar-image',
            parent: createEl('td', { parent: row })
        })
    } else {
        createEl('td', { text: userName, parent: row })
    }
}

function renderIconField(column: ISearchColumn, parentCell: HTMLTableCellElement, icon: IJiraSearchField['issuetype']) {
    if (icon.iconUrl) {
        createEl('img', {
            attr: { src: icon.iconUrl, alt: icon.name },
            title: column.compact ? icon.name : '',
            cls: 'letter-height',
            parent: parentCell
        })
    } else {
        // TODO: is this valid? name[]?
        if (column.compact) {
            createSpan({ text: icon.name[0].toUpperCase(), title: icon.name, parent: parentCell })
        }
    }
    if (!column.compact) {
        createSpan({ text: ' ' + icon.name, parent: parentCell })
    }
}

function renderDateField(column: ISearchColumn, row: HTMLTableRowElement, date: string) {
    const localDateStr = !!date ? new Date(date).toLocaleDateString() : date;
    if (column.compact) {
        createEl('td', { text: '🕑', title: localDateStr, parent: row })
    } else {
        createEl('td', { text: localDateStr, parent: row })
    }
}

function renderLongTextField(column: ISearchColumn, row: HTMLTableRowElement, text: string) {
    const COMPACT_TEXT_LENGTH = 20
    if (column.compact) {
        let compactText = text.substring(0, COMPACT_TEXT_LENGTH)
        if (text.length > COMPACT_TEXT_LENGTH) {
            compactText += '…'
        }
        createEl('td', { text: compactText, title: text, parent: row })
    } else {
        createEl('td', { text: text, parent: row })
    }
}

function renderEstimatorField(column: ISearchColumn, row: HTMLTableRowElement, delta: number) {
    let timeStr = '';
    if (delta) {
        const h = Math.floor(delta / 3600)
        const m = Math.floor(delta % 3600 / 60)
        const s = Math.floor(delta % 3600 % 60)
        if (h > 0) {
            timeStr += h + 'h'
        }
        if (m > 0) {
            timeStr += m + 'm'
        }
        if (s > 0) {
            timeStr += s + 's'
        }
    }
    createEl('td', { text: timeStr, parent: row })
}