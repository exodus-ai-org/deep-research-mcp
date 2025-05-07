export interface ResearchResult {
  learnings: string[]
  visitedUrls: Map<string, DocumentData>
}

export interface ResearchProgress {
  currentDepth: number
  totalDepth: number
  currentBreadth: number
  totalBreadth: number
  currentQuery?: string
  totalQueries: number
  completedQueries: number
}

export interface DocumentData {
  document: string
  tokenCount: number
}

export interface WebSearchResult {
  rank: number
  favicon: string
  headImage: string
  type: 'pdf' | 'html'
  link: string
  title: string
  content: string
  snippet: string
  tokenCount: number
}

export type WebSearchResultWithoutTokenCount = Exclude<
  WebSearchResult,
  'tokenCount'
>

export interface SearchParameters {
  q: string
  type: string
  engine: string
}

export interface OrganicResult {
  title: string
  link: string
  snippet: string
  position: number
  sitelinks?: {
    title: string
    link: string
  }[]
}

export interface RelatedSearch {
  query: string
}

export interface WebSearchResponse {
  searchParameters: SearchParameters
  organic: OrganicResult[]
  relatedSearches: RelatedSearch[]
  credits: number
}
