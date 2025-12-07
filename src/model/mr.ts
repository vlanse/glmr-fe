export class MergeRequestFilter {
    showOnlyMine: boolean = false;
    skipApprovedByMe: boolean = false;
}

export class Project {
    id: number = 0
    name: string = ""
    url: string = ""
}

export class User {
    username: string = ""
    avatarUrl?: string = ""
    trusted?: boolean = false
    url?: string = ""
    isMe?: boolean = false
}

export class Status {
    conflict?: boolean = false
    pipelineFailed?: boolean = false
    ready?: boolean = false
    pending?: boolean = false
    outdated?: boolean = false
    editorAvailable?: boolean = false
}

export class Comments {
    resolvedCount: number = 0
    unresolvedCount: number = 0
}


export class Issue {
    key: string = ""
    url: string = ""
}

export class DiffStatsSummary {
    additions: number = 0
    deletions: number = 0
    fileCount: number = 0
}

export class Pipeline {
    webUrl: string = ""
}

export class MergeRequest {
    project: Project = new Project()
    iid: number = 0
    url?: string = ""
    description: string = ""
    author: User = new User()
    status: Status = new Status()
    approvedBy: User[] = []
    comments?: Comments = new Comments()
    age?: string = ""
    approvedBefore: boolean = false
    issues?: Issue[] = []
    diffStatsSummary: DiffStatsSummary = new DiffStatsSummary()
    headPipeline: Pipeline = new Pipeline()
}

export class GroupSummary {
    total: number = 0
    visible: number = 0
    overdue: number = 0
    overdueVisible: number = 0
}

export class Group {
    name: string = ""
    mergeRequests: MergeRequest[] = []
    summary: GroupSummary = new GroupSummary()
}