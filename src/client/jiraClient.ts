import {
	Platform,
	requestUrl,
	RequestUrlParam,
	RequestUrlResponse,
} from 'obsidian'
import {
	AVATAR_RESOLUTION,
	JiraAccountSettings,
} from '../settings/settings.interfaces'
import {
	ESprintState,
	IJiraBoard,
	IJiraField,
	IJiraIssue,
	IJiraSearchResults,
	IJiraSprint,
	IJiraUser,
} from '../interfaces/issueInterfaces'
import { SettingsData } from '../settings'

interface RequestOptions {
	method: string
	path: string
	queryParameters?: URLSearchParams
	noBasePath?: boolean
}

function logHttpRequestResponse(
	request: RequestUrlParam,
	response: RequestUrlResponse
) {
	SettingsData.debugMode
		? response.status < 400
			? console.info('JiraTracker:', { request, response })
			: console.warn('JiraTracker:', { request, response })
		: false
}

function getMimeType(imageBuffer: ArrayBuffer): string {
	const imageBufferUint8 = new Uint8Array(imageBuffer.slice(0, 4))
	let bytes: string[] = []
	imageBufferUint8.forEach((byte) => {
		bytes.push(byte.toString(16))
	})
	const hex = bytes.join('').toUpperCase()
	switch (hex) {
		case '89504E47':
			return 'image/png'
		case '47494638':
			return 'image/gif'
		case 'FFD8FFDB':
		case 'FFD8FFE0':
		case 'FFD8FFE1':
			return 'image/jpeg'
		case '3C737667':
		case '3C3F786D':
			return 'image/svg+xml'
		default:
			SettingsData.debugMode && console.error('Image mimeType not found:', hex)
			return null
	}
}

function bufferBase64Encode(b: ArrayBuffer) {
	const a = new Uint8Array(b)
	if (Platform.isMobileApp) {
		return btoa(String.fromCharCode(...a))
	} else {
		return Buffer.from(a).toString('base64')
	}
}

function base64Encode(s: string) {
	if (Platform.isMobileApp) {
		return btoa(s)
	} else {
		return Buffer.from(s).toString('base64')
	}
}

function buildUrl(host: string, requestOptions: RequestOptions): string {
	const basePath = requestOptions.noBasePath ? '' : SettingsData.apiBasePath
	const url = new URL(`${host}${basePath}${requestOptions.path}`)
	if (requestOptions.queryParameters) {
		url.search = requestOptions.queryParameters.toString()
	}
	return url.toString()
}

function buildHeaders(account: JiraAccountSettings): Record<string, string> {
	const requestHeaders: Record<string, string> = {}
	requestHeaders['Authorization'] =
		'Basic ' + base64Encode(`${account.username}:${account.password}`)
	requestHeaders['Accept'] = 'application/json'
	return requestHeaders
}

async function sendRequest(requestOptions: RequestOptions): Promise<any> {
	const { account } = SettingsData
	const requestUrlParam: RequestUrlParam = {
		method: requestOptions.method,
		url: buildUrl(account.host, requestOptions),
		headers: buildHeaders(account),
		contentType: 'application/json',
	}
	let response: RequestUrlResponse
	try {
		response = await requestUrl(requestUrlParam)
	} catch (errorResponse) {
		response = errorResponse
	} finally {
		logHttpRequestResponse(requestUrlParam, response)
	}

	if (response.status === 200) {
		return { ...response.json, account: account }
	}

	if (response.json?.errorMessages) {
		throw new Error(response.json.errorMessages.join('\n'))
	} else if (response && response.status) {
		switch (response.status) {
			case 400:
				throw new Error(`Invalid query`)
			case 404:
				throw new Error(
					`Jira issue Not found. Please check the issue key or your permissions`
				)
			default:
				throw new Error(`HTTP status ${response.status}`)
		}
	} else {
		throw new Error(response as any)
	}
}

async function preFetchImage(
	account: JiraAccountSettings,
	url: string
): Promise<string> {
	// Pre fetch only images hosted on the Jira server
	if (!url.startsWith(account.host)) {
		return url
	}

	const options = {
		url: url,
		method: 'GET',
		headers: buildHeaders(account),
	}
	let response: RequestUrlResponse
	try {
		response = await requestUrl(options)
	} catch (errorResponse) {
		response = errorResponse
	} finally {
		logHttpRequestResponse(options, response)
	}

	if (response.status === 200) {
		const mimeType = getMimeType(response.arrayBuffer)
		if (mimeType) {
			return (
				`data:${mimeType};base64,` + bufferBase64Encode(response.arrayBuffer)
			)
		}
	}
	return null
}

async function fetchIssueImages(issue: IJiraIssue) {
	if (issue.fields) {
		if (issue.fields.issuetype && issue.fields.issuetype.iconUrl) {
			issue.fields.issuetype.iconUrl = await preFetchImage(
				issue.account,
				issue.fields.issuetype.iconUrl
			)
		}
		if (issue.fields.reporter) {
			issue.fields.reporter.avatarUrls[AVATAR_RESOLUTION] = await preFetchImage(
				issue.account,
				issue.fields.reporter.avatarUrls[AVATAR_RESOLUTION]
			)
		}
		if (
			issue.fields.assignee &&
			issue.fields.assignee.avatarUrls &&
			issue.fields.assignee.avatarUrls[AVATAR_RESOLUTION]
		) {
			issue.fields.assignee.avatarUrls[AVATAR_RESOLUTION] = await preFetchImage(
				issue.account,
				issue.fields.assignee.avatarUrls[AVATAR_RESOLUTION]
			)
		}
		if (issue.fields.priority && issue.fields.priority.iconUrl) {
			issue.fields.priority.iconUrl = await preFetchImage(
				issue.account,
				issue.fields.priority.iconUrl
			)
		}
	}
}

export default {
	async getIssue(
		issueKey: string,
		options: { fields?: string[]; } = {}
	): Promise<IJiraIssue> {
		const opt = {
			fields: options.fields || [],
		}
		const queryParameters = new URLSearchParams({
			fields: opt.fields.join(','),
		})
		const issue = (await sendRequest({
			method: 'GET',
			path: `/issue/${issueKey}`,
			queryParameters: queryParameters,
		})) as IJiraIssue
		await fetchIssueImages(issue)
		return issue
	},

	async getSearchResults(
		query: string,
		options: {
			limit?: number
			offset?: number
			fields?: string[]
		} = {}
	): Promise<IJiraSearchResults> {
		const opt = {
			fields: options.fields || ['*navigable'],
			offset: options.offset || 0,
			limit: options.limit || 50,
		}
		const queryParameters = new URLSearchParams({
			jql: query,
			fields: opt.fields.join(','),
			startAt: opt.offset > 0 ? opt.offset.toString() : '',
			maxResults: opt.limit > 0 ? opt.limit.toString() : '',
		})
		const searchResults = (await sendRequest({
			method: 'GET',
			path: `/search/jql`,
			queryParameters: queryParameters,
		})) as IJiraSearchResults
		for (const issue of searchResults.issues) {
			issue.account = searchResults.account
			await fetchIssueImages(issue)
		}
		searchResults.total = searchResults.issues.length
		return searchResults
	},

	async updateStatusColorCache(
		status: string,
		account: JiraAccountSettings
	): Promise<void> {
		if (status in account.cache.statusColor) {
			return
		}
		const response = await sendRequest({
			method: 'GET',
			path: `/status/${status}`,
		})
		account.cache.statusColor[status] = response.statusCategory.colorName
	},

	async updateCustomFieldsCache(): Promise<void> {
		SettingsData.cache.columns = []
		const { account } = SettingsData
		try {
			const response = (await sendRequest({
				method: 'GET',
				path: `/field`,
			})) as IJiraField[]
			account.cache.customFieldsIdToName = {}
			account.cache.customFieldsNameToId = {}
			account.cache.customFieldsType = {}
			for (let i in response) {
				const field = response[i]
				if (field.custom && field.schema && field.schema.customId) {
					account.cache.customFieldsIdToName[field.schema.customId] = field.name
					account.cache.customFieldsNameToId[field.name] =
						field.schema.customId.toString()
					account.cache.customFieldsType[field.schema.customId] = field.schema
					SettingsData.cache.columns.push(
						field.schema.customId.toString(),
						field.name.toUpperCase()
					)
				}
			}
		} catch (e) {
			console.error(
				'Error while retrieving custom fields list of account:',
				account.alias,
				e
			)
		}
	},

	async getLoggedUser(): Promise<IJiraUser> {
		return (await sendRequest({
			method: 'GET',
			path: `/myself`,
		})) as IJiraUser
	},

	async getBoards(
		projectKeyOrId: string,
		options: {
			limit?: number
			offset?: number
		} = {}
	): Promise<IJiraBoard[]> {
		const opt = {
			offset: options.offset || 0,
			limit: options.limit || 50,
		}
		const queryParameters = new URLSearchParams({
			projectKeyOrId: projectKeyOrId,
			startAt: opt.offset > 0 ? opt.offset.toString() : '',
			maxResults: opt.limit > 0 ? opt.limit.toString() : '',
		})
		const boards = await sendRequest({
			method: 'GET',
			path: `/rest/agile/1.0/board`,
			queryParameters: queryParameters,
			noBasePath: true,
		})
		if (boards.values && boards.values.length) {
			return boards.values
		}
		return []
	},

	async getSprints(
		boardId: number,
		options: {
			limit?: number
			offset?: number
			state?: ESprintState[]
		} = {}
	): Promise<IJiraSprint[]> {
		const opt = {
			state: options.state || [],
			offset: options.offset || 0,
			limit: options.limit || 50,
		}
		const queryParameters = new URLSearchParams({
			state: opt.state.join(','),
			startAt: opt.offset > 0 ? opt.offset.toString() : '',
			maxResults: opt.limit > 0 ? opt.limit.toString() : '',
		})
		const sprints = await sendRequest({
			method: 'GET',
			path: `/rest/agile/1.0/board/${boardId}/sprint`,
			queryParameters: queryParameters,
			noBasePath: true,
		})
		if (sprints.values && sprints.values.length) {
			return sprints.values
		}
		return []
	},

	async getSprint(
		sprintId: number,
	): Promise<IJiraSprint> {
		return await sendRequest({
			method: 'GET',
			path: `/rest/agile/1.0/sprint/${sprintId}`,
			noBasePath: true,
		})
	},
}
