import { z } from 'zod';
import { GameMode, DatabasePhase } from '@/types/game';

// UUID validation
export const uuidSchema = z.string().uuid('Invalid UUID format');

// Lobby code validation (5 letters + 1 digit)
export const lobbyCodeSchema = z.string()
  .regex(/^[A-Z]{5}[0-9]$/, 'Lobby code must be 5 letters followed by 1 number (e.g. APPLE3)')
  .length(6, 'Lobby code must be exactly 6 characters');

// Player name validation
export const playerNameSchema = z.string()
  .min(1, 'Player name is required')
  .max(20, 'Player name must be 20 characters or less')
  .trim();

// Song validation schema
export const songSchema = z.object({
  id: z.string().min(1, 'Song ID is required'),
  deezer_title: z.string().min(1, 'Song title is required'),
  deezer_artist: z.string().min(1, 'Artist is required'),
  deezer_album: z.string().min(1, 'Album is required'),
  release_year: z.string().min(1, 'Release year is required'),
  genre: z.string().min(1, 'Genre is required'),
  cardColor: z.string().min(1, 'Card color is required'),
  preview_url: z.string().url().optional(),
  deezer_url: z.string().url().optional(),
});

// Player validation schema
export const playerSchema = z.object({
  id: uuidSchema,
  name: playerNameSchema,
  color: z.string().min(1, 'Player color is required'),
  timelineColor: z.string().min(1, 'Timeline color is required'),
  score: z.number().int().min(0, 'Score cannot be negative'),
  timeline: z.array(songSchema),
  character: z.string().min(1, 'Character is required'),
});

// Room creation schema
export const createRoomSchema = z.object({
  hostName: playerNameSchema.optional(),
});

// Join room schema
export const joinRoomSchema = z.object({
  lobbyCode: lobbyCodeSchema,
  playerName: playerNameSchema,
});

// Room update schema
export const roomUpdateSchema = z.object({
  roomId: uuidSchema,
  gamemode: z.enum([GameMode.CLASSIC, GameMode.FIEND, GameMode.SPRINT]).optional(),
  phase: z.enum([DatabasePhase.LOBBY, DatabasePhase.PLAYING, DatabasePhase.FINISHED]).optional(),
  songs: z.array(songSchema).optional(),
});

// Card placement schema
export const cardPlacementSchema = z.object({
  roomId: uuidSchema,
  playerId: uuidSchema,
  song: songSchema,
  position: z.number().int().min(0, 'Position cannot be negative'),
});

// Player update schema
export const playerUpdateSchema = z.object({
  playerId: uuidSchema,
  updates: z.object({
    name: playerNameSchema.optional(),
    character: z.string().min(1, 'Character is required').optional(),
    color: z.string().optional(),
    timelineColor: z.string().optional(),
  }),
});

// Realtime message schema
export const realtimeMessageSchema = z.object({
  type: z.string().min(1, 'Message type is required'),
  roomId: uuidSchema.optional(),
  playerId: uuidSchema.optional(),
  data: z.record(z.unknown()).optional(),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type JoinRoomInput = z.infer<typeof joinRoomSchema>;
export type RoomUpdateInput = z.infer<typeof roomUpdateSchema>;
export type CardPlacementInput = z.infer<typeof cardPlacementSchema>;
export type PlayerUpdateInput = z.infer<typeof playerUpdateSchema>;
export type RealtimeMessageInput = z.infer<typeof realtimeMessageSchema>;