/**
 * Shared types for the Zelda Contribution Graph.
 */

export type ContributionLevel = 0 | 1 | 2 | 3 | 4;

export interface ContributionCell {
	/** Column in the 53-wide grid (0 = oldest). */
	col: number;
	/** Row in the 7-tall grid (0 = Sunday, 6 = Saturday). */
	row: number;
	/** ISO date string (YYYY-MM-DD). */
	date: string;
	/** Raw number of contributions that day. */
	count: number;
	/** GitHub quartile level: 0 = none, 4 = max. */
	level: ContributionLevel;
}

export interface ContributionGrid {
	cells: ContributionCell[];
	cols: number;
	rows: number;
	username: string;
	totalContributions: number;
}

export type Direction = 'up' | 'down' | 'left' | 'right';

export type CollectibleKind = 'rupeeGreen' | 'rupeeBlue' | 'rupeeRed' | 'heart' | 'bush';

export type EnemyKind = 'octorok' | 'moblin' | 'leever' | 'keese';

export interface Entity {
	col: number;
	row: number;
	/** Fractional position for smooth animation (0-1 between cells). */
	fx: number;
	fy: number;
	direction: Direction;
}

export interface Enemy extends Entity {
	kind: EnemyKind;
	/** Patrol pattern index. */
	patternIndex: number;
}

export interface Frame {
	/** Link's state at this frame. */
	link: Entity;
	/** Enemies' state at this frame. */
	enemies: Enemy[];
	/** Cells that are still "alive" (not yet collected). */
	aliveCells: Set<string>;
}

export interface GameState {
	grid: ContributionGrid;
	frames: Frame[];
	/** Map from "col,row" to the collectible kind placed on that cell. */
	cellKinds: Map<string, CollectibleKind>;
}

export interface RenderOptions {
	/** Pixels per sprite pixel (each sprite is 16x16 sprite-pixels). Default 1 (16px per cell). */
	pixelSize?: number;
	/** Gap in CSS pixels between cells. Default 3. */
	cellGap?: number;
	/** Total duration of the animation in seconds. Default 60. */
	durationSeconds?: number;
	/** Theme: light or dark background. Default 'dark'. */
	theme?: 'light' | 'dark';
	/** Show score/heads-up display. Default true. */
	showHud?: boolean;
}
