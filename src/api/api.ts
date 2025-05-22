import ObjectsCache from "../objectsCache"
import { getActiveSprint, getVelocity } from "./apiMacro"
import { getBoards, getIssue, getSearchResults, getSprint, getSprints } from "./apiBase"

const API = {
    base: {
        getIssue: getIssue,
        getSearchResults: getSearchResults,
        getBoards: getBoards,
        getSprint: getSprint,
        getSprints: getSprints,
        getActiveSprint: getActiveSprint,
        getVelocity: getVelocity,
    },
    util: {
        clearCache: ObjectsCache.clear
    },
}

export default API
// TODO add get devStatus