import { ToolSchema } from '@modelcontextprotocol/sdk/types.js'
import { z } from 'zod'

export const DeepResearchArgsSchema = z.object({
  query: z.string()
})

export type ToolInput = z.infer<typeof ToolSchema.shape.inputSchema>
