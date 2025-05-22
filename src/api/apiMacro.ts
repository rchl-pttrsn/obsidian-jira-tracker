import { ESprintState, IJiraSprint } from "../interfaces/issueInterfaces"
import API from "./api"
const ms = require('ms')


export async function getActiveSprint(projectKeyOrId: string): Promise<IJiraSprint> {
    const boards = await API.base.getBoards(projectKeyOrId, { limit: 1 })
    if (boards.length > 0) {
        const sprints = await API.base.getSprints(boards[0].id, { state: [ESprintState.ACTIVE], limit: 1 })
        if (sprints.length > 0) {
            return sprints[0]
        }
    }
    return null
}

export async function getVelocity(projectKeyOrId: string, sprintId: number, storyPointFieldName: string = 'aggregatetimeoriginalestimate') {
    const searchResults = await API.base.getSearchResults(
        `project = "${projectKeyOrId}" AND sprint = ${sprintId} AND resolution = Done`,
        { limit: 50, fields: [storyPointFieldName] }
    )
    let velocity = 0
    for (const issue of searchResults.issues) {
        velocity += (issue.fields[storyPointFieldName] as number)
    }
    return velocity
}