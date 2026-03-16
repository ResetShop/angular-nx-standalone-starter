import { z } from 'zod'

/** Validates duration strings matching the format: number followed by d/h/m/s (e.g., '5s', '1m', '24h', '7d'). */
export const durationStringSchema = z.string().regex(/^\d+[dhms]$/, {
	message: "Invalid duration format. Expected format: number followed by d/h/m/s (e.g., '5s', '1m', '24h', '7d')",
})

export type DurationString = z.infer<typeof durationStringSchema>
