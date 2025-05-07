import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import {
  CallToolResult,
  isInitializeRequest
} from '@modelcontextprotocol/sdk/types.js'
import cors from 'cors'
import express, { Request, Response } from 'express'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { MCP_SERVER_NAME, MCP_SERVER_VERSION, PORT } from './constants.js'

// Create an MCP server with implementation details
const getServer = () => {
  const server = new McpServer(
    {
      name: MCP_SERVER_NAME,
      version: MCP_SERVER_VERSION
    },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
        logging: {}
      }
    }
  )

  server.tool(
    'deep_research',
    "Executing deep research workflow based on user's requirement",
    {
      name: z.string().describe('Name to greet')
    },
    async ({ name }, { sendNotification }): Promise<CallToolResult> => {
      const sleep = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms))

      await sendNotification({
        method: 'notifications/message',
        params: { level: 'debug', data: `Starting multi-greet for ${name}` }
      })

      await sleep(1000) // Wait 1 second before first greeting

      await sendNotification({
        method: 'notifications/message',
        params: { level: 'info', data: `Sending first greeting to ${name}` }
      })

      await sleep(1000) // Wait another second before second greeting

      await sendNotification({
        method: 'notifications/message',
        params: { level: 'info', data: `Sending second greeting to ${name}` }
      })

      return {
        content: [
          {
            type: 'text',
            text: `Good morning, ${name}!`
          }
        ]
      }
    }
  )
  return server
}

const app = express()
app.use(express.json())
app.use(cors())

// Map to store transports by session ID
const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {}

app.post('/mcp', async (req: Request, res: Response) => {
  console.log('Received MCP request:', req.body)
  try {
    // Check for existing session ID
    const sessionId = req.headers['mcp-session-id'] as string | undefined
    let transport: StreamableHTTPServerTransport

    if (sessionId && transports[sessionId]) {
      // Reuse existing transport
      transport = transports[sessionId]
    } else if (!sessionId && isInitializeRequest(req.body)) {
      // New initialization request - use JSON response mode
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        enableJsonResponse: true, // Enable JSON response mode
        onsessioninitialized: (sessionId) => {
          // Store the transport by session ID when session is initialized
          // This avoids race conditions where requests might come in before the session is stored
          console.log(`Session initialized with ID: ${sessionId}`)
          transports[sessionId] = transport
        }
      })

      // Connect the transport to the MCP server BEFORE handling the request
      const server = getServer()
      await server.connect(transport)
      await transport.handleRequest(req, res, req.body)
      return // Already handled
    } else {
      // Invalid request - no session ID or not initialization request
      res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: No valid session ID provided'
        },
        id: null
      })
      return
    }

    // Handle the request with existing transport - no need to reconnect
    await transport.handleRequest(req, res, req.body)
  } catch (error) {
    console.error('Error handling MCP request:', error)
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error'
        },
        id: null
      })
    }
  }
})

// Handle GET requests for SSE streams according to spec
app.get('/mcp', async (req: Request, res: Response) => {
  // Since this is a very simple example, we don't support GET requests for this server
  // The spec requires returning 405 Method Not Allowed in this case
  res.status(405).set('Allow', 'POST').send('Method Not Allowed')
})

// Start the server
app.listen(PORT, () => {
  console.log(`MCP Streamable HTTP Server listening on port ${PORT}`)
})

// Handle server shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...')
  process.exit(0)
})
