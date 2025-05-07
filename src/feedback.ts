import { generateObject, generateText, LanguageModelV1 } from 'ai'
import { z } from 'zod'
import { feedbackPrompt, systemPrompt } from './prompt.js'

export async function generateFeedback({
  query,
  model
}: {
  query: string
  model: LanguageModelV1
}) {
  const userFeedback = await generateText({
    model,
    system: systemPrompt,
    prompt: feedbackPrompt(query),
    maxSteps: 1
  })

  return userFeedback.response.messages
}

export async function generateResearchPlan({
  query,
  model
}: {
  query: string
  model: LanguageModelV1
}) {
  const response = await generateObject({
    model,
    system: `
Your task is to generate a step-by-step research plan for the user's topic.

Example: If the user's topic is The timeline for NASA's SpaceX Crew-10 mission, the research plan should follow this structure, ensuring each step is a single sentence:

(1) Search for official announcements from NASA and SpaceX regarding the Crew-10 mission.
(2) Identify the planned launch date and time for the Crew-10 mission.
(3) Find information about the planned duration of the Crew-10 mission on the International Space Station (ISS).
(4) Determine the expected date and time of docking with the ISS.
(5) Research the planned activities and experiments to be conducted by the Crew-10 astronauts while on the ISS.
(6) Identify the expected date and time of undocking from the ISS.
(7) Find the anticipated date and time for the Crew-10 spacecraft's return to Earth.
(8) Look for any potential delays or changes to the Crew-10 mission timeline.
`,
    prompt: query,
    schema: z.object({
      queries: z.string().array().describe(`List of the research plan`)
    })
  })

  return response.object.queries
}
