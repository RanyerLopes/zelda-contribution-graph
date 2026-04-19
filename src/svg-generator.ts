/**
 * Generate an animated SVG of Link traversing a GitHub contribution graph,
 * 8-bit Zelda NES style.
 *
 * The animation has three phases of equal length that loop forever:
 *   Phase 1: collectibles are rupees (green/blue/red by contribution level)
 *   Phase 2: collectibles are hearts
 *   Phase 3: collectibles are bushes
 *
 * Link walks the same zig-zag path across the grid once per phase, and the
 * collectibles disappear as he reaches each cell.
 */

import {
	ContributionCell,
	ContributionGrid,
	Enemy,
	RenderOptions,
} from './types';
import {
	generateEnemyPatrol,
	generateLinkPath,
	createEnemies,
	collectibleForPhase,
	selectContributingCells,
	Waypoint,
} from './game-logic';
import { spriteSymbol, SPRITES } from './sprites';

const SPRITE_SIZE = 16; // sprite is 16x16 "sprite pixels"
const WALK_FRAME_DUR = 0.22; // seconds between walk frame swaps
const PHASES: Array<'rupee' | 'heart' | 'bush'> = ['rupee', 'heart', 'bush'];

// Theme colors
const THEME = {
	dark: {
		bg: '#0D0B1E',
		panel: '#1A1530',
		cellEmpty: '#1F1A38',
		cellLow: '#2A2A52',
		text: '#FFFFFF',
		textMuted: '#9FA3C7',
		border: '#3A3560',
		hyrule: '#58D854',
	},
	light: {
		bg: '#F6F8FA',
		panel: '#FFFFFF',
		cellEmpty: '#EBEDF0',
		cellLow: '#D0D7DE',
		text: '#1F2328',
		textMuted: '#656D76',
		border: '#D0D7DE',
		hyrule: '#2DA44E',
	},
};

/**
 * Build the complete SVG string.
 */
export function generateSVG(
	grid: ContributionGrid,
	options: RenderOptions = {}
): string {
	const {
		pixelSize = 1,
		cellGap = 3,
		durationSeconds = 90,
		theme = 'dark',
		showHud = true,
	} = options;

	const palette = THEME[theme];
	const cellPx = SPRITE_SIZE * pixelSize;
	const slotPx = cellPx + cellGap;

	const hudHeight = showHud ? 50 : 0;
	const leftPad = 28; // for day labels
	const topPad = 16;
	const gridW = grid.cols * slotPx - cellGap;
	const gridH = grid.rows * slotPx - cellGap;
	const svgW = gridW + leftPad * 2;
	const svgH = gridH + hudHeight + topPad * 2;

	// Compute Link's path.
	const path = generateLinkPath(grid.cols, grid.rows);
	const pathDuration = durationSeconds / PHASES.length;
	const stepDuration = pathDuration / path.length;
	const totalEnemySteps = Math.ceil(durationSeconds / stepDuration);

	// Which cells have collectibles.
	const contributing = selectContributingCells(grid);

	// Build a cell lookup by "col,row" -> cell.
	const cellMap = new Map<string, ContributionCell>();
	for (const c of grid.cells) cellMap.set(`${c.col},${c.row}`, c);

	// For each contributing cell, find at which path step Link arrives.
	const arrivalStep = new Map<string, number>();
	path.forEach((wp, idx) => {
		const key = `${wp.col},${wp.row}`;
		if (!arrivalStep.has(key)) arrivalStep.set(key, idx);
	});

	// Convert col/row to SVG pixel coordinates.
	const cellX = (col: number) => leftPad + col * slotPx;
	const cellY = (row: number) => hudHeight + topPad + row * slotPx;

	// --- Sprite <defs> ---
	const defs: string[] = [];
	// Link: 4 directions × 2 frames
	const dirs = ['down', 'up', 'left', 'right'] as const;
	for (const d of dirs) {
		defs.push(spriteSymbol(`link-${d}-a`, SPRITES.link[d][0]));
		defs.push(spriteSymbol(`link-${d}-b`, SPRITES.link[d][1]));
	}
	// Enemies
	for (const kind of ['octorok', 'moblin', 'leever', 'keese'] as const) {
		defs.push(spriteSymbol(`${kind}-a`, SPRITES.enemies[kind][0]));
		defs.push(spriteSymbol(`${kind}-b`, SPRITES.enemies[kind][1]));
	}
	// Collectibles
	defs.push(spriteSymbol('rupee-green', SPRITES.collectibles.rupeeGreen));
	defs.push(spriteSymbol('rupee-blue', SPRITES.collectibles.rupeeBlue));
	defs.push(spriteSymbol('rupee-red', SPRITES.collectibles.rupeeRed));
	defs.push(spriteSymbol('heart', SPRITES.collectibles.heart));
	defs.push(spriteSymbol('bush', SPRITES.collectibles.bush));

	// --- Background ---
	const parts: string[] = [];
	parts.push(
		`<rect width="${svgW}" height="${svgH}" fill="${palette.bg}"/>`
	);

	// --- HUD ---
	if (showHud) {
		parts.push(renderHud(svgW, hudHeight, grid, palette));
	}

	// --- Grid background cells (empty tiles / contribution heatmap) ---
	const gridBg: string[] = [];
	for (const cell of grid.cells) {
		const x = cellX(cell.col);
		const y = cellY(cell.row);
		const lvl = cell.level;
		let fill = palette.cellEmpty;
		if (lvl === 1) fill = palette.cellLow;
		if (lvl === 2) fill = blend(palette.cellLow, palette.hyrule, 0.33);
		if (lvl === 3) fill = blend(palette.cellLow, palette.hyrule, 0.66);
		if (lvl === 4) fill = palette.hyrule;
		gridBg.push(
			`<rect x="${x}" y="${y}" width="${cellPx}" height="${cellPx}" rx="2" fill="${fill}"/>`
		);
	}
	parts.push(`<g id="grid-bg">${gridBg.join('')}</g>`);

	// --- Day-of-week labels ---
	parts.push(renderDayLabels(cellY, cellPx, palette));
	// --- Month labels ---
	parts.push(renderMonthLabels(grid, cellX, hudHeight + topPad, palette));

	// --- Collectibles per phase ---
	const phaseDurFrac = 1 / PHASES.length; // fraction of total duration per phase

	for (let phaseIdx = 0; phaseIdx < PHASES.length; phaseIdx++) {
		const phase = PHASES[phaseIdx];
		const phaseStart = phaseIdx * phaseDurFrac;
		const phaseEnd = (phaseIdx + 1) * phaseDurFrac;

		const cellEls: string[] = [];
		for (const key of contributing) {
			const [cs, rs] = key.split(',');
			const col = Number(cs);
			const row = Number(rs);
			const cell = cellMap.get(key);
			if (!cell) continue;
			const kind = collectibleForPhase(phase, cell.level);
			const symbolId = kindToSymbol(kind);
			const x = cellX(col);
			const y = cellY(row);

			// When does Link arrive at this cell *within this phase*?
			const step = arrivalStep.get(key);
			if (step === undefined) continue;
			const localArrival = step * stepDuration; // seconds into phase
			const globalArrival = phaseIdx * pathDuration + localArrival;
			const tFrac = globalArrival / durationSeconds;

			// Opacity animation: 1 until Link arrives, then 0 for rest of cycle.
			const collectedAnim = `<animate attributeName="opacity" values="1;1;0;0" keyTimes="0;${tFrac.toFixed(
				4
			)};${(tFrac + 0.003).toFixed(4)};1" dur="${durationSeconds}s" repeatCount="indefinite"/>`;

			cellEls.push(
				`<use href="#${symbolId}" x="${x}" y="${y}" width="${cellPx}" height="${cellPx}">${collectedAnim}</use>`
			);
		}

		// Phase visibility animation: opacity=1 within [phaseStart, phaseEnd), else 0.
		const eps = 0.002;
		const phaseAnim = `<animate attributeName="opacity" values="${phaseVisibilityValues(
			phaseStart,
			phaseEnd
		)}" keyTimes="${phaseVisibilityKeyTimes(phaseStart, phaseEnd, eps)}" dur="${durationSeconds}s" repeatCount="indefinite"/>`;

		// Initial opacity: phase 0 starts visible (1), others hidden (0).
		const phaseInitial = phaseIdx === 0 ? '1' : '0';
		parts.push(
			`<g id="phase-${phase}" opacity="${phaseInitial}">${phaseAnim}${cellEls.join('')}</g>`
		);
	}

	// --- Enemies (continuous patrol over full duration) ---
	const enemies = createEnemies(grid.cols, grid.rows);
	for (const enemy of enemies) {
		parts.push(
			renderEnemy(enemy, grid.cols, grid.rows, totalEnemySteps, stepDuration, durationSeconds, cellX, cellY, cellPx)
		);
	}

	// --- Link ---
	parts.push(
		renderLink(path, pathDuration, durationSeconds, cellX, cellY, cellPx)
	);

	// Assemble.
	return [
		`<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}" shape-rendering="crispEdges" font-family="'Press Start 2P', 'Courier New', monospace">`,
		`<defs>${defs.join('')}</defs>`,
		parts.join(''),
		`</svg>`,
	].join('');
}

// ============================================================================
// Helpers
// ============================================================================

function kindToSymbol(kind: string): string {
	switch (kind) {
		case 'rupeeGreen':
			return 'rupee-green';
		case 'rupeeBlue':
			return 'rupee-blue';
		case 'rupeeRed':
			return 'rupee-red';
		case 'heart':
			return 'heart';
		case 'bush':
			return 'bush';
		default:
			return 'rupee-green';
	}
}

function phaseVisibilityValues(start: number, end: number): string {
	// At time=0, opacity is 1 only if start==0. Otherwise 0.
	// Build a 4-stop sequence: 0 -> start -> end -> 1
	const before = start === 0 ? '1' : '0';
	const atStart = '1';
	const atEnd = '0';
	const atOne = before;
	return `${before};${atStart};${atStart};${atEnd};${atEnd};${atOne}`;
}

function phaseVisibilityKeyTimes(start: number, end: number, eps: number): string {
	const a = Math.max(0, start - eps).toFixed(4);
	const b = start.toFixed(4);
	const c = Math.max(start, end - eps).toFixed(4);
	const d = end.toFixed(4);
	return `0;${a};${b};${c};${d};1`;
}

/** Linear-blend two hex colors. */
function blend(c1: string, c2: string, t: number): string {
	const parse = (c: string) => [
		parseInt(c.slice(1, 3), 16),
		parseInt(c.slice(3, 5), 16),
		parseInt(c.slice(5, 7), 16),
	];
	const [r1, g1, b1] = parse(c1);
	const [r2, g2, b2] = parse(c2);
	const r = Math.round(r1 + (r2 - r1) * t);
	const g = Math.round(g1 + (g2 - g1) * t);
	const b = Math.round(b1 + (b2 - b1) * t);
	const toHex = (n: number) => n.toString(16).padStart(2, '0');
	return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function renderHud(
	svgW: number,
	hudHeight: number,
	grid: ContributionGrid,
	palette: typeof THEME.dark
): string {
	const title = `THE LEGEND OF ${grid.username.toUpperCase()}`;
	const sub = `${grid.totalContributions.toLocaleString()} CONTRIBUTIONS · ${grid.cols} WEEKS`;
	return `
		<g id="hud">
			<rect x="0" y="0" width="${svgW}" height="${hudHeight}" fill="${palette.panel}"/>
			<rect x="0" y="${hudHeight - 2}" width="${svgW}" height="2" fill="${palette.hyrule}"/>
			<text x="16" y="22" fill="${palette.text}" font-size="11" font-weight="bold" letter-spacing="1">${escapeXml(title)}</text>
			<text x="16" y="40" fill="${palette.textMuted}" font-size="9" letter-spacing="1">${escapeXml(sub)}</text>
			<g transform="translate(${svgW - 100}, 12)">
				<use href="#rupee-green" x="0" y="0" width="16" height="16"/>
				<use href="#heart" x="24" y="0" width="16" height="16"/>
				<use href="#bush" x="48" y="0" width="16" height="16"/>
				<use href="#rupee-red" x="72" y="0" width="16" height="16"/>
			</g>
		</g>
	`;
}

function renderDayLabels(
	cellY: (row: number) => number,
	cellPx: number,
	palette: typeof THEME.dark
): string {
	const days = ['M', 'W', 'F']; // rows 1, 3, 5
	const rows = [1, 3, 5];
	const labels = days
		.map(
			(d, i) =>
				`<text x="8" y="${cellY(rows[i]) + cellPx - 3}" fill="${palette.textMuted}" font-size="8">${d}</text>`
		)
		.join('');
	return `<g id="day-labels">${labels}</g>`;
}

function renderMonthLabels(
	grid: ContributionGrid,
	cellX: (col: number) => number,
	baseY: number,
	palette: typeof THEME.dark
): string {
	const monthNames = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
	const seen = new Set<string>();
	const labels: string[] = [];
	for (let c = 0; c < grid.cols; c++) {
		const cell = grid.cells.find((x) => x.col === c && x.row === 0);
		if (!cell) continue;
		const m = cell.date.slice(0, 7);
		if (seen.has(m)) continue;
		seen.add(m);
		const month = parseInt(cell.date.slice(5, 7), 10) - 1;
		labels.push(
			`<text x="${cellX(c)}" y="${baseY - 4}" fill="${palette.textMuted}" font-size="8">${monthNames[month]}</text>`
		);
	}
	return `<g id="month-labels">${labels.join('')}</g>`;
}

function renderLink(
	path: Waypoint[],
	pathDuration: number,
	totalDuration: number,
	cellX: (c: number) => number,
	cellY: (r: number) => number,
	cellPx: number
): string {
	// Build transform values that span the full totalDuration (path repeats PHASES.length times).
	const loops = Math.round(totalDuration / pathDuration);

	const transformValues: string[] = [];
	const directionValues: string[] = [];
	const keyTimes: number[] = [];

	for (let loop = 0; loop < loops; loop++) {
		for (let i = 0; i < path.length; i++) {
			const wp = path[i];
			transformValues.push(`${cellX(wp.col)},${cellY(wp.row)}`);
			directionValues.push(wp.direction);
			const t = (loop * path.length + i) / (loops * path.length);
			keyTimes.push(t);
		}
	}
	// close the loop back to start
	transformValues.push(transformValues[0]);
	directionValues.push(directionValues[0]);
	keyTimes.push(1);

	const values = transformValues.join(';');
	const times = keyTimes.map((t) => t.toFixed(5)).join(';');

	// Use a <g> wrapping two <use> elements (frames A and B) that alternate
	// via opacity animation synced to WALK_FRAME_DUR.
	// We also pick sprite symbol by dominant direction — for simplicity, we
	// create separate <use> groups and toggle visibility by direction.
	// Approximation: show one direction at a time; compute "active" direction
	// signal over time via cycled opacity.

	// Simpler implementation: build one <use> per direction and animate their
	// visibility with keyTimes matching each direction segment.

	const dirs: Array<'down' | 'up' | 'left' | 'right'> = ['down', 'up', 'left', 'right'];
	const dirOpacityValues: Record<(typeof dirs)[number], string[]> = {
		down: [],
		up: [],
		left: [],
		right: [],
	};

	for (const d of directionValues) {
		for (const dir of dirs) {
			dirOpacityValues[dir].push(dir === d ? '1' : '0');
		}
	}

	// Walking frame toggle: we render two frames per direction and alternate their
	// opacity at a fixed rate independent of movement.
	const frameAlt = Math.max(2, Math.round(totalDuration / WALK_FRAME_DUR));
	const frameValuesA: string[] = [];
	const frameValuesB: string[] = [];
	const frameTimes: string[] = [];
	for (let i = 0; i <= frameAlt; i++) {
		frameValuesA.push(i % 2 === 0 ? '1' : '0');
		frameValuesB.push(i % 2 === 0 ? '0' : '1');
		frameTimes.push((i / frameAlt).toFixed(5));
	}

	const moveAnim = `<animateTransform attributeName="transform" type="translate" values="${values}" keyTimes="${times}" dur="${totalDuration}s" repeatCount="indefinite" calcMode="discrete"/>`;

	const linkBody = dirs
		.map((dir) => {
			const dirOpAnim = `<animate attributeName="opacity" values="${dirOpacityValues[dir].join(
				';'
			)};${dirOpacityValues[dir][0]}" keyTimes="${times}" dur="${totalDuration}s" repeatCount="indefinite" calcMode="discrete"/>`;

			const a = `<use href="#link-${dir}-a" x="0" y="0" width="${cellPx}" height="${cellPx}"><animate attributeName="opacity" values="${frameValuesA.join(
				';'
			)}" keyTimes="${frameTimes.join(';')}" dur="${totalDuration}s" repeatCount="indefinite" calcMode="discrete"/></use>`;
			const b = `<use href="#link-${dir}-b" x="0" y="0" width="${cellPx}" height="${cellPx}"><animate attributeName="opacity" values="${frameValuesB.join(
				';'
			)}" keyTimes="${frameTimes.join(';')}" dur="${totalDuration}s" repeatCount="indefinite" calcMode="discrete"/></use>`;

			// Initial opacity matches the first keyframe so static renders also show Link.
			const initialOpacity = dirOpacityValues[dir][0];
			return `<g opacity="${initialOpacity}">${dirOpAnim}${a}${b}</g>`;
		})
		.join('');

	return `<g id="link" transform="translate(${cellX(path[0].col)}, ${cellY(path[0].row)})">${moveAnim}${linkBody}</g>`;
}

function renderEnemy(
	enemy: Enemy,
	cols: number,
	rows: number,
	totalSteps: number,
	stepDuration: number,
	totalDuration: number,
	cellX: (c: number) => number,
	cellY: (r: number) => number,
	cellPx: number
): string {
	const patrol = generateEnemyPatrol(enemy, cols, rows, totalSteps);
	const values: string[] = [];
	const keyTimes: string[] = [];
	for (let i = 0; i < patrol.length; i++) {
		const p = patrol[i];
		values.push(`${cellX(p.col)},${cellY(p.row)}`);
		keyTimes.push((i / patrol.length).toFixed(5));
	}
	values.push(values[0]);
	keyTimes.push('1');

	const moveAnim = `<animateTransform attributeName="transform" type="translate" values="${values.join(
		';'
	)}" keyTimes="${keyTimes.join(';')}" dur="${totalDuration}s" repeatCount="indefinite" calcMode="discrete"/>`;

	// Frame swap animation
	const frameAlt = Math.max(2, Math.round(totalDuration / 0.3));
	const frameValuesA: string[] = [];
	const frameValuesB: string[] = [];
	const frameTimes: string[] = [];
	for (let i = 0; i <= frameAlt; i++) {
		frameValuesA.push(i % 2 === 0 ? '1' : '0');
		frameValuesB.push(i % 2 === 0 ? '0' : '1');
		frameTimes.push((i / frameAlt).toFixed(5));
	}

	const a = `<use href="#${enemy.kind}-a" x="0" y="0" width="${cellPx}" height="${cellPx}"><animate attributeName="opacity" values="${frameValuesA.join(
		';'
	)}" keyTimes="${frameTimes.join(';')}" dur="${totalDuration}s" repeatCount="indefinite" calcMode="discrete"/></use>`;
	const b = `<use href="#${enemy.kind}-b" x="0" y="0" width="${cellPx}" height="${cellPx}"><animate attributeName="opacity" values="${frameValuesB.join(
		';'
	)}" keyTimes="${frameTimes.join(';')}" dur="${totalDuration}s" repeatCount="indefinite" calcMode="discrete"/></use>`;

	return `<g class="enemy enemy-${enemy.kind}" transform="translate(${cellX(
		enemy.col
	)}, ${cellY(enemy.row)})">${moveAnim}${a}${b}</g>`;
}

function escapeXml(s: string): string {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}
