/**
 * Game logic: generate Link's path through the grid, assign collectibles,
 * and plan enemy patrol patterns.
 */

import {
	CollectibleKind,
	ContributionGrid,
	Direction,
	Enemy,
	EnemyKind,
} from './types';

export interface Waypoint {
	col: number;
	row: number;
	direction: Direction;
}

/**
 * Generate a zigzag path that visits every cell of the grid.
 *
 * Pattern: walk right along row 0, step down to row 1, walk left along row 1,
 * step down to row 2, ... down to row 6, then snake back up.
 * This produces a continuous loop that covers the whole grid twice.
 */
export function generateLinkPath(
	cols: number,
	rows: number
): Waypoint[] {
	const path: Waypoint[] = [];

	// Forward pass: row 0 -> row rows-1, alternating left/right.
	for (let r = 0; r < rows; r++) {
		const goingRight = r % 2 === 0;
		if (goingRight) {
			for (let c = 0; c < cols; c++) {
				path.push({ col: c, row: r, direction: 'right' });
			}
			if (r < rows - 1) path.push({ col: cols - 1, row: r + 1, direction: 'down' });
		} else {
			for (let c = cols - 1; c >= 0; c--) {
				path.push({ col: c, row: r, direction: 'left' });
			}
			if (r < rows - 1) path.push({ col: 0, row: r + 1, direction: 'down' });
		}
	}

	// Return pass: walk back up from bottom to top along the rightmost column
	// in a gentle serpentine, so the animation loops cleanly.
	const lastRow = rows - 1;
	const lastGoingRight = lastRow % 2 === 0;
	const startC = lastGoingRight ? cols - 1 : 0;
	for (let r = rows - 1; r >= 0; r--) {
		path.push({ col: startC, row: r, direction: 'up' });
	}

	return path;
}

/**
 * Assign a collectible to each contributing cell.
 *
 * The "kind" is rotated over time at animation runtime (see svg-generator),
 * so here we only need to decide WHICH cells have collectibles.
 */
export function selectContributingCells(
	grid: ContributionGrid
): Set<string> {
	const out = new Set<string>();
	for (const cell of grid.cells) {
		if (cell.level > 0) {
			out.add(`${cell.col},${cell.row}`);
		}
	}
	return out;
}

/**
 * Determine which collectible appears based on the cell's contribution level.
 * Used when rotation cycles a given *phase*, we still want visual variety
 * within that phase based on intensity.
 */
export function collectibleForPhase(
	phase: 'rupee' | 'heart' | 'bush',
	level: number
): CollectibleKind {
	if (phase === 'rupee') {
		if (level >= 4) return 'rupeeRed';
		if (level >= 2) return 'rupeeBlue';
		return 'rupeeGreen';
	}
	if (phase === 'heart') return 'heart';
	return 'bush';
}

/**
 * Place enemies across the grid with distinct patrol patterns.
 *
 * - Octorok: horizontal patrol on row 1
 * - Moblin:  horizontal patrol on row 5
 * - Leever:  vertical patrol in column 17
 * - Keese:   diagonal bouncing pattern (like a DVD logo)
 */
export function createEnemies(cols: number, rows: number): Enemy[] {
	const enemies: Enemy[] = [];

	const mkEnemy = (kind: EnemyKind, col: number, row: number, dir: Direction): Enemy => ({
		kind,
		col,
		row,
		fx: col,
		fy: row,
		direction: dir,
		patternIndex: 0,
	});

	enemies.push(mkEnemy('octorok', Math.floor(cols * 0.2), 1, 'right'));
	enemies.push(mkEnemy('moblin', Math.floor(cols * 0.7), 5, 'left'));
	enemies.push(mkEnemy('leever', Math.floor(cols * 0.5), 3, 'down'));
	enemies.push(mkEnemy('keese', Math.floor(cols * 0.35), 2, 'right'));

	return enemies;
}

/**
 * Generate a patrol path (list of cell positions) for a given enemy over
 * `totalSteps` ticks, used to build the SVG animation keyframes.
 */
export function generateEnemyPatrol(
	enemy: Enemy,
	cols: number,
	rows: number,
	totalSteps: number
): Array<{ col: number; row: number; direction: Direction }> {
	const path: Array<{ col: number; row: number; direction: Direction }> = [];
	let col = enemy.col;
	let row = enemy.row;
	let dir: Direction = enemy.direction;

	const rangeH = Math.min(cols - 1, 12); // how far horizontal enemies roam
	const rangeV = rows - 1;

	const hStart = Math.max(1, enemy.col - Math.floor(rangeH / 2));
	const hEnd = Math.min(cols - 2, enemy.col + Math.floor(rangeH / 2));

	for (let step = 0; step < totalSteps; step++) {
		path.push({ col, row, direction: dir });

		switch (enemy.kind) {
			case 'octorok':
			case 'moblin': {
				if (dir === 'right') {
					col++;
					if (col >= hEnd) dir = 'left';
				} else {
					col--;
					if (col <= hStart) dir = 'right';
				}
				break;
			}
			case 'leever': {
				if (dir === 'down') {
					row++;
					if (row >= rangeV) dir = 'up';
				} else {
					row--;
					if (row <= 0) dir = 'down';
				}
				break;
			}
			case 'keese': {
				// Bouncing diagonal
				let dc = dir === 'right' ? 1 : dir === 'left' ? -1 : 0;
				let dr = 0;
				// Use a secondary direction stored via patternIndex parity
				const verticalDown = step % 2 === 0 ? 1 : -1;
				dr = verticalDown;

				col += dc;
				row += dr;

				if (col >= cols - 1) {
					col = cols - 1;
					dir = 'left';
				} else if (col <= 0) {
					col = 0;
					dir = 'right';
				}
				if (row >= rows - 1) row = rows - 2;
				if (row <= 0) row = 1;
				break;
			}
		}
	}

	return path;
}
