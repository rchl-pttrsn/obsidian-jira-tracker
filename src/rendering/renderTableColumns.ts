import { TFile } from 'obsidian'
import {
	JiraIssue,
	JiraApi,
} from '../client/jira.models'
import RC, {
	JIRA_STATUS_COLOR_MAP,
	JIRA_STATUS_COLOR_MAP_BY_NAME,
} from './renderingCommon'
import * as jsonpath from 'jsonpath'
import {
	AVATAR_RESOLUTION,
	JiraFields,
	JiraAccountSettings,
	ISearchColumn,
} from '../settings/settings.models'
import { SettingsData } from 'src/settings'

export const renderTableColumn = async (
	account: JiraAccountSettings,
	columns: ISearchColumn[],
	issue: JiraIssue,
	row: HTMLTableRowElement
): Promise<void> => {
	let markdownNotes: TFile[] = null
	for (const column of columns) {
		switch (column.type) {
			case JiraFields.KEY:
				renderLinkField(column, row, account, issue.key)
				break
			case JiraFields.PARENT:
				renderLinkField(column, row, account, issue.fields.parent?.key)
				break
			case JiraFields.SUMMARY:
				renderLongTextField(column, row, issue.fields.summary)
				break
			case JiraFields.DESCRIPTION:
				renderLongTextField(column, row, issue.fields.description)
				break
			case JiraFields.TYPE:
				const typeCell = createEl('td', { parent: row })
				renderIconField(column, typeCell, issue.fields.issuetype)
				break
			case JiraFields.CREATED:
				renderDateField(column, row, issue.fields.created)
				break
			case JiraFields.UPDATED:
				renderDateField(column, row, issue.fields.updated)
				break
			case JiraFields.REPORTER:
				renderUserField(column, row, issue.fields.reporter)
				break
			case JiraFields.ASSIGNEE:
				renderUserField(column, row, issue.fields.assignee)
				break
			case JiraFields.CREATOR:
				renderUserField(column, row, issue.fields.creator)
				break
			case JiraFields.PRIORITY:
				const parentCell = createEl('td', { parent: row })
				if (issue.fields.priority && issue.fields.priority.name) {
					renderIconField(column, parentCell, issue.fields.priority)
				} else {
					parentCell.setText('-')
				}
				break
			case JiraFields.STATUS:
				const { status } = issue.fields
				const statusColor =
					JIRA_STATUS_COLOR_MAP_BY_NAME[status.name] ||
					JIRA_STATUS_COLOR_MAP[issue.fields.status.statusCategory.colorName]
				createSpan({
					cls: `ji-tag no-wrap ${statusColor}`,
					text: column.compact ? status.name[0].toUpperCase() : status.name,
					title: status.description,
					attr: { 'data-status': status.name },
					parent: createEl('td', { parent: row }),
				})
				break
			case JiraFields.DUE_DATE:
				renderDateField(column, row, issue.fields.duedate)
				break
			case JiraFields.RESOLUTION:
				if (issue.fields.resolution.description) {
					createEl('abbr', {
						text: issue.fields.resolution.name,
						title: issue.fields.resolution.description,
						parent: createEl('td', { parent: row }),
					})
				} else {
					createEl('td', {
						text: issue.fields.resolution.name,
						title: issue.fields.resolution.description,
						parent: row,
					})
				}
				break
			case JiraFields.RESOLUTION_DATE:
				renderDateField(column, row, issue.fields.resolutiondate)
				break
			case JiraFields.ENVIRONMENT:
				renderLongTextField(column, row, issue.fields.environment)
				break
			case JiraFields.LABELS:
				if (column.compact) {
					createEl('td', {
						text: '🏷️',
						title: issue.fields.labels.join('\n'),
						parent: row,
					})
				} else {
					createEl('td', {
						text: issue.fields.labels.join(', '),
						parent: row,
					})
				}
				break
			case JiraFields.PROJECT:
				createEl('td', {
					text: issue.fields.project.key,
					title: issue.fields.project.name,
					parent: row,
				})
				break
			case JiraFields.FIX_VERSIONS:
				const fixVersionsCell = createEl('td', { parent: row })
				for (let i = 0; i < issue.fields.fixVersions.length; i++) {
					const fixVersion = issue.fields.fixVersions[i]
					if (fixVersion.released) {
						createEl('strong', {
							text: fixVersion.name,
							title: fixVersion.description,
							parent: fixVersionsCell,
						})
					} else {
						createSpan({
							text: fixVersion.name,
							title: fixVersion.description,
							parent: fixVersionsCell,
						})
					}
					if (i < issue.fields.fixVersions.length - 1) {
						createSpan({ text: ', ', parent: fixVersionsCell })
					}
				}
				break
			case JiraFields.COMPONENTS:
				createEl('td', {
					text: issue.fields.components.flatMap((c) => c.name).join(', '),
					parent: row,
				})
				break
			case JiraFields.AGGREGATE_TIME_ESTIMATED:
				renderEstimatorField(column, row, issue.fields.aggregatetimeestimate)
				break
			case JiraFields.AGGREGATE_TIME_ORIGINAL_ESTIMATE:
				renderEstimatorField(
					column,
					row,
					issue.fields.aggregatetimeoriginalestimate
				)
				break
			case JiraFields.AGGREGATE_TIME_SPENT:
				renderEstimatorField(column, row, issue.fields.aggregatetimespent)
				break
			case JiraFields.TIME_ESTIMATE:
				renderEstimatorField(column, row, issue.fields.timeestimate)
				break
			case JiraFields.TIME_ORIGINAL_ESTIMATE:
				renderEstimatorField(column, row, issue.fields.timeoriginalestimate)
				break
			case JiraFields.TIME_SPENT:
				renderEstimatorField(column, row, issue.fields.timespent)
				break
			case JiraFields.AGGREGATE_PROGRESS:
				renderProgressField(column, row, issue.fields.aggregateprogress)
				break
			case JiraFields.PROGRESS:
				renderProgressField(column, row, issue.fields.progress)
				break
			case JiraFields.LINKED_ISSUES:
				renderLinkedIssuesField(column, row, account, issue)
				break
			case JiraFields.SUB_TASKS:
				if (!!issue.fields.subtasks.length) {
					issue.fields.subtasks.forEach((subtask) =>
						renderLinkField(column, row, account, subtask.key)
					)
				} else {
					createEl('td', { parent: row })
				}
				break
			case JiraFields.CUSTOM_FIELD:
				createEl('td', {
					text: renderCustomField(account, issue, column.extra),
					parent: row,
				})
				break
			case JiraFields.NOTES:
				if (!markdownNotes) {
					markdownNotes = RC.getNotes()
				}
				const noteCell = createEl('td', {
					parent: row,
					cls: 'text-align-center',
				})
				const noteRegex = new RegExp('^' + issue.key + '[^0-9]')
				const connectedNotes = markdownNotes.filter((n) =>
					n.name.match(noteRegex)
				)
				if (connectedNotes.length > 0) {
					for (const note of connectedNotes) {
						if (column.extra) {
							renderNoteFrontMatter(column, note, noteCell) // TODO wat?
						} else {
							renderNoteFile(column, note, noteCell)
						}
					}
				} else {
					const folder = SettingsData.noteFolder ?? ''
					const fullPath = `${folder}/${issue.key}.md`

					const el = createEl('a', {
						text: '+',
						title: 'Create new note',
						href: `${fullPath}`,
						cls: 'icon-link',
						parent: noteCell,
					})

					if (
						SettingsData.noteTemplate &&
						!RC.getAbstractFileByPath(fullPath)
					) {
						//TODO on(name: 'rename', callback: (file: TAbstractFile, oldPath: string) => any, ctx?: any): EventRef;
						el.addEventListener('click', async () => {
							RC.readNote(RC.getAbstractFileByPath(SettingsData.noteTemplate))
								.then((templateContents: any) =>
									RC.createNote(fullPath, templateContents)
								)
								.then((newNote: any) => newNote.edit())
								.catch((error: any) =>
									console.debug('Error writing template', error)
								)
						})
					}
				}
				break
			case JiraFields.LAST_VIEWED:
				renderDateField(column, row, issue.fields.lastViewed)
				break
			case JiraFields.WATCHES:
				createEl('td', {
					text: `${issue.fields.watches.watchCount ?? 0}`,
					parent: row,
				})
				break
			case JiraFields.VOTES:
				createEl('td', {
					text: `${issue.fields.votes.votes ?? 0}`,
					parent: row,
				})

				break
		}
	}
}
function renderNoteFile(
	column: ISearchColumn,
	note: TFile,
	noteCell: HTMLTableCellElement
) {
	//TODO on(name: 'rename', callback: (file: TAbstractFile, oldPath: string) => any, ctx?: any): EventRef;

	if (column.compact) {
		createEl('a', {
			text: '📙',
			title: note.path,
			href: note.path,
			cls: 'int-link',
			parent: noteCell,
		})
	} else {
		const noteNameWithoutExtension = note.name.split('.')
		noteNameWithoutExtension.pop()
		createEl('a', {
			text: noteNameWithoutExtension.join('.'),
			title: note.path,
			href: note.path,
			parent: noteCell,
		})
		createEl('br', { parent: noteCell })
	}
}

function renderNoteFrontMatter(
	column: ISearchColumn,
	note: TFile,
	noteCell: HTMLTableCellElement
) {
	const frontMatter = RC.getFrontMatter(note)
	const values = jsonpath.query(frontMatter, '$.' + column.extra)
	for (let value of values) {
		value = typeof value === 'object' ? JSON.stringify(value) : value.toString()
		createEl('a', {
			text: value,
			title: note.path,
			href: note.path,
			parent: noteCell,
		})
		createEl('br', { parent: noteCell })
	}
}

function renderCustomField(account: JiraAccountSettings, issue: JiraIssue, customField: string): string {
	if (!Number(customField)) {
		customField = account.cache.customFieldsNameToId[customField]
	}
	const value = issue.fields[`customfield_${customField}`]
	if (typeof value === 'string' || typeof value === 'number') {
		return value.toString()
	}
	return JSON.stringify(value)
}

function renderLinkField(
	column: ISearchColumn,
	row: HTMLTableRowElement,
	account: JiraAccountSettings,
	issueKey: string
) {
	if (issueKey) {
		createEl('a', {
			cls: 'no-wrap',
			href: RC.issueUrl(account, issueKey),
			text: column.compact ? '🔗' : issueKey,
			title: column.compact ? issueKey : RC.issueUrl(account, issueKey),
			parent: createEl('td', { parent: row }),
		})
	} else {
		createEl('td', { parent: row })
	}
}

function renderLinkedIssuesField(
	column: ISearchColumn,
	row: HTMLTableRowElement,
	account: JiraAccountSettings,
	issue: JiraIssue
) {
	const parentCell = createEl('td', { parent: row })
	issue.fields.issuelinks.forEach((l) => {
		const div = createDiv({ parent: parentCell })
		let text = ''
		let issueKey = ''

		if (l.outwardIssue) {
			text = l.type.inward
			issueKey = l.outwardIssue.key
		} else {
			text = l.type.outward
			issueKey = l.inwardIssue.key
		}
		createSpan({
			text: text[0].toUpperCase() + text.substring(1) + ': ',
			title: text,
			parent: div,
		})
		createEl('a', {
			cls: 'no-wrap',
			href: RC.issueUrl(account, issueKey),
			text: column.compact ? '🔗' : issueKey,
			title: column.compact ? issueKey : RC.issueUrl(account, issueKey),
			parent: div,
		})
	})
}

function renderUserField(
	column: ISearchColumn,
	row: HTMLTableRowElement,
	user: JiraApi.User
) {
	const userName = user.displayName || ''
	if (column.compact && userName && user.avatarUrls[AVATAR_RESOLUTION]) {
		createEl('img', {
			attr: { src: user.avatarUrls[AVATAR_RESOLUTION], alt: userName },
			title: userName,
			cls: 'avatar',
			parent: createEl('td', { parent: row }),
		})
	} else {
		createEl('td', { text: userName, parent: row })
	}
}

function renderIconField(
	column: ISearchColumn,
	parentCell: HTMLTableCellElement,
	icon: JiraApi.IssueType
) {
	if (icon.iconUrl) {
		createEl('img', {
			attr: { src: icon.iconUrl, alt: icon.name },
			title: column.compact ? icon.name : '',
			cls: 'letter-height',
			parent: parentCell,
		})
	}
	if (!column.compact) {
		createSpan({ text: ' ' + icon.name, parent: parentCell })
	}
}

function renderDateField(
	column: ISearchColumn,
	row: HTMLTableRowElement,
	date: string
) {
	const localDateStr = !!date ? new Date(date).toLocaleDateString() : date
	if (column.compact) {
		createEl('td', { text: '🕑', title: localDateStr, parent: row })
	} else {
		createEl('td', { text: localDateStr, parent: row })
	}
}

function renderLongTextField(
	column: ISearchColumn,
	row: HTMLTableRowElement,
	text: string
) {
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

function renderEstimatorField(
	column: ISearchColumn,
	row: HTMLTableRowElement,
	delta: number
) {
	let timeStr = ''
	if (delta) {
		const h = Math.floor(delta / 3600)
		const m = Math.floor((delta % 3600) / 60)
		const s = Math.floor((delta % 3600) % 60)
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

function renderProgressField(
	column: ISearchColumn,
	row: HTMLTableRowElement,
	progress: JiraApi.Progress
) {
	let percent = 0
	if (progress.progress > 0 && progress.total > 0) {
		percent = (progress.progress / progress.total) * 100
	}
	createEl('td', { text: percent.toString() + '%', parent: row })
}
