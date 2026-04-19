/**
 * 8-bit NES-style sprite definitions for the Zelda Contribution Graph.
 *
 * Each sprite is a 16x16 pixel grid. Pixels are encoded as single characters
 * that index into a color palette. '.' means transparent.
 *
 * Colors are approximated from the NES palette used in The Legend of Zelda (1986).
 */

export interface SpritePalette {
	[key: string]: string;
}

/** Shared NES-inspired palette. */
export const PALETTE: SpritePalette = {
	'.': 'transparent',
	'0': '#000000', // outline
	's': '#F8B878', // skin (Link's face)
	'S': '#B86820', // skin shadow
	'g': '#58D854', // bright green (Link tunic, bushes)
	'G': '#087808', // dark green
	'y': '#F8D878', // light yellow (hair highlight)
	'r': '#F83800', // red (shield, red rupee, heart, octorok)
	'R': '#B00000', // dark red
	'b': '#3CBCFC', // bright blue (blue rupee)
	'B': '#0058F8', // dark blue
	'o': '#FC9838', // orange (moblin body)
	'O': '#844028', // moblin brown
	'l': '#C8682C', // leever tan
	'L': '#843800', // leever dark
	'k': '#303830', // keese dark
	'w': '#FCFCFC', // white (eye sparkle, pupil highlight)
	'p': '#FC9AB0', // pink (heart highlight)
	'x': '#58F898', // light green (rupee highlight)
	't': '#F8F800', // yellow (rupee trim)
};

/** Render a sprite's pixel grid into an SVG <g> element as tiny <rect>s. */
export function renderSprite(
	pixels: string[],
	pixelSize: number = 1,
	palette: SpritePalette = PALETTE
): string {
	const rects: string[] = [];
	for (let y = 0; y < pixels.length; y++) {
		const row = pixels[y];
		for (let x = 0; x < row.length; x++) {
			const ch = row[x];
			const color = palette[ch];
			if (!color || color === 'transparent') continue;
			rects.push(
				`<rect x="${x * pixelSize}" y="${y * pixelSize}" width="${pixelSize}" height="${pixelSize}" fill="${color}"/>`
			);
		}
	}
	return rects.join('');
}

/** Convert a sprite into a reusable <symbol> for efficient SVG output. */
export function spriteSymbol(
	id: string,
	pixels: string[],
	pixelSize: number = 1
): string {
	const size = pixels.length * pixelSize;
	return `<symbol id="${id}" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">${renderSprite(
		pixels,
		pixelSize
	)}</symbol>`;
}

// ============================================================================
// LINK — 16x16 sprites, 4 directions, 2 walking frames each
// ============================================================================

export const LINK_DOWN_A: string[] = [
	'................',
	'.....000000.....',
	'....0gggggg0....',
	'...0gyyyyyyg0...',
	'...0gyyyyyyg0...',
	'....0ssssss0....',
	'....0s0ss0s0....',
	'....0ssssss0....',
	'.....0ssss0.....',
	'....0gggggg0....',
	'...0ggggggggr0..',
	'...0g0gggg0g00..',
	'..0ss0gggg0ss0..',
	'..0ss00gg00ss0..',
	'...00.0000.00...',
	'.....00..00.....',
];

export const LINK_DOWN_B: string[] = [
	'................',
	'.....000000.....',
	'....0gggggg0....',
	'...0gyyyyyyg0...',
	'...0gyyyyyyg0...',
	'....0ssssss0....',
	'....0s0ss0s0....',
	'....0ssssss0....',
	'.....0ssss0.....',
	'....0gggggg0....',
	'...0ggggggggr0..',
	'..0sg0gggg0gs0..',
	'..0ss0gggg0ss0..',
	'...000gg0g000...',
	'....00000000....',
	'.....00..00.....',
];

export const LINK_UP_A: string[] = [
	'................',
	'.....000000.....',
	'....0gggggg0....',
	'...0gyyyyyyg0...',
	'...0gyyyyyyg0...',
	'....0ssssss0....',
	'....0ssssss0....',
	'....0ssssss0....',
	'.....0ssss0.....',
	'....0gggggg0....',
	'.r00ggggggggg0..',
	'.r0gg0gggg0g00..',
	'..0ss0gggg0ss0..',
	'..0ss00gg00ss0..',
	'...00.0000.00...',
	'.....00..00.....',
];

export const LINK_UP_B: string[] = [
	'................',
	'.....000000.....',
	'....0gggggg0....',
	'...0gyyyyyyg0...',
	'...0gyyyyyyg0...',
	'....0ssssss0....',
	'....0ssssss0....',
	'....0ssssss0....',
	'.....0ssss0.....',
	'....0gggggg0....',
	'.r00ggggggggg0..',
	'.r0g0gggggg0gs0.',
	'..0s0gggggg0ss0.',
	'...000gg0g000...',
	'....00000000....',
	'.....00..00.....',
];

export const LINK_RIGHT_A: string[] = [
	'................',
	'.....00000......',
	'....0ggggg0.....',
	'...0gyyyyyg0....',
	'...0gyyyyy0.....',
	'....0ssss00.....',
	'....0s0sss0.....',
	'....0sssss0.....',
	'.....0sss0......',
	'....0ggggg00....',
	'...0gggggggg0...',
	'..0gggggggggr0..',
	'..0ssgggggg00...',
	'...00sggggg0....',
	'.....000ss0.....',
	'.......00.......',
];

export const LINK_RIGHT_B: string[] = [
	'................',
	'......00000.....',
	'.....0ggggg0....',
	'....0gyyyyyg0...',
	'....0gyyyyy0....',
	'.....0ssss00....',
	'.....0s0sss0....',
	'.....0sssss0....',
	'......0sss0.....',
	'.....0ggggg00...',
	'....0ggggggg0...',
	'...0ggggggggr0..',
	'..0ssgggggg00...',
	'..0ss0ggggg0....',
	'...00.00ss0.....',
	'........00......',
];

export const LINK_LEFT_A: string[] = [
	'................',
	'......00000.....',
	'.....0ggggg0....',
	'....0gyyyyyg0...',
	'.....0yyyyyg0...',
	'.....00ssss0....',
	'.....0sss0s0....',
	'.....0sssss0....',
	'......0sss0.....',
	'....00ggggg0....',
	'...0gggggggg0...',
	'..r0gggggggggg0.',
	'...00gggggggss0.',
	'....0ggggggs00..',
	'.....0ss000.....',
	'.......00.......',
];

export const LINK_LEFT_B: string[] = [
	'................',
	'.....00000......',
	'....0ggggg0.....',
	'...0gyyyyyg0....',
	'....0yyyyyg0....',
	'....00ssss0.....',
	'....0sss0s0.....',
	'....0sssss0.....',
	'.....0sss0......',
	'...00ggggg0.....',
	'...0ggggggg0....',
	'..r0gggggggg0...',
	'...00gggggg0ss0.',
	'.....0ggggg0ss0.',
	'......0ss0.00...',
	'......00........',
];

// ============================================================================
// ENEMIES — Octorok (red), Moblin (orange), Leever (tan), Keese (dark bat)
// ============================================================================

export const OCTOROK_A: string[] = [
	'................',
	'................',
	'......0000......',
	'.....0rrrr0.....',
	'....0rrrrrr0....',
	'....0rw0r0wr....',
	'....0rrrrrr0....',
	'....0rr00rr0....',
	'...0rrrrrrrr0...',
	'..0rr0rrrr0rr0..',
	'..0rrrrrrrrrr0..',
	'..0r0r0rr0r0r0..',
	'...0.0.00.0.0...',
	'................',
	'................',
	'................',
];

export const OCTOROK_B: string[] = [
	'................',
	'................',
	'......0000......',
	'.....0rrrr0.....',
	'....0rrrrrr0....',
	'....0rw0r0wr....',
	'....0rrrrrr0....',
	'....0rr00rr0....',
	'...0rrrrrrrr0...',
	'..0rrr0rr0rrr0..',
	'..0rrrrrrrrrr0..',
	'...0r0r00r0r0...',
	'....0.0..0.0....',
	'................',
	'................',
	'................',
];

export const MOBLIN_A: string[] = [
	'................',
	'....0000..0000..',
	'...0OOO0..0OOO0.',
	'....0OO000OO0...',
	'....0oooooo0....',
	'...0ooww0ww0....',
	'...0ooww0ww0....',
	'...0oo0ooo0o0...',
	'...0ooooooo0....',
	'..0ooooooooo0...',
	'..0ooo0oo0ooo...',
	'...0oo0oo0oo0...',
	'...0OO0oo0OO0...',
	'...0OO0oo0OO0...',
	'...00..0o.00....',
	'.......00.......',
];

export const MOBLIN_B: string[] = [
	'................',
	'....0000..0000..',
	'...0OOO0..0OOO0.',
	'....0OO000OO0...',
	'....0oooooo0....',
	'...0ooww0ww0....',
	'...0ooww0ww0....',
	'...0oo0ooo0o0...',
	'...0ooooooo0....',
	'..0ooooooooo0...',
	'..0oooo00oooo...',
	'...0oo0oo0oo0...',
	'....0O0oo0O0....',
	'....0O0oo0O0....',
	'....00.0o.00....',
	'.......00.......',
];

export const LEEVER_A: string[] = [
	'................',
	'................',
	'................',
	'......0000......',
	'.....0LLLL0.....',
	'....0LllllL0....',
	'...0LllLLllL0...',
	'...0lLL00LLl0...',
	'..0LlLrr00rLlL0.',
	'..0LllLr00rlL0..',
	'...0LllLL0Ll0...',
	'....0LllllL0....',
	'.....0LLLL0.....',
	'......0000......',
	'................',
	'................',
];

export const LEEVER_B: string[] = [
	'................',
	'................',
	'......0000......',
	'.....0LLLL0.....',
	'....0LllllL0....',
	'...0LllLLllL0...',
	'..0LllLrrLllL0..',
	'..0lLL0rr0LLl0..',
	'..0lLL0rr0LLl0..',
	'..0LllLrrLllL0..',
	'...0LllLLllL0...',
	'....0LllllL0....',
	'.....0LLLL0.....',
	'......0000......',
	'................',
	'................',
];

export const KEESE_A: string[] = [
	'................',
	'................',
	'................',
	'.0k00........00k',
	'.0kkk00....00kk0',
	'..0kkkk0..0kkk0.',
	'..0kkkkk00kkkk0.',
	'...0kkkkrrkkk0..',
	'...0kkkrwwrkk0..',
	'....0kkkrrkk0...',
	'.....0kkkkk0....',
	'......0kkk0.....',
	'.......000......',
	'................',
	'................',
	'................',
];

export const KEESE_B: string[] = [
	'................',
	'................',
	'.00k........k00.',
	'.0kk00....00kk0.',
	'..0kkk0..0kkk0..',
	'...0kkk00kkk0...',
	'...0kkkkkkkk0...',
	'....0kkrrkk0....',
	'....0krwwrk0....',
	'....0kkrrkk0....',
	'.....0kkkk0.....',
	'......0kk0......',
	'.......00.......',
	'................',
	'................',
	'................',
];

// ============================================================================
// COLLECTIBLES — Rupees (green/blue/red), Heart, Bush
// ============================================================================

export const RUPEE_GREEN: string[] = [
	'................',
	'................',
	'.......00.......',
	'......0gg0......',
	'.....0gxxg0.....',
	'....0gxggxg0....',
	'....0gxggxg0....',
	'....0gxggxg0....',
	'....0gxggxg0....',
	'....0gxggxg0....',
	'....0gxggxg0....',
	'.....0gxxg0.....',
	'......0gg0......',
	'.......00.......',
	'................',
	'................',
];

export const RUPEE_BLUE: string[] = [
	'................',
	'................',
	'.......00.......',
	'......0bb0......',
	'.....0bwwb0.....',
	'....0bwbbwb0....',
	'....0bwbbwb0....',
	'....0bwbbwb0....',
	'....0bwbbwb0....',
	'....0bwbbwb0....',
	'....0bwbbwb0....',
	'.....0bwwb0.....',
	'......0bb0......',
	'.......00.......',
	'................',
	'................',
];

export const RUPEE_RED: string[] = [
	'................',
	'................',
	'.......00.......',
	'......0rr0......',
	'.....0rtpr0.....',
	'....0rtrrrtr0...',
	'....0rtrrrtr0...',
	'....0rtrrrtr0...',
	'....0rtrrrtr0...',
	'....0rtrrrtr0...',
	'....0rtrrrtr0...',
	'.....0rtpr0.....',
	'......0rr0......',
	'.......00.......',
	'................',
	'................',
];

export const HEART: string[] = [
	'................',
	'................',
	'...00....00.....',
	'..0rr0..0rr0....',
	'.0rprr00rrpr0...',
	'.0rprrrrrrpr0...',
	'.0rrrrprrrrr0...',
	'.0rrrprrrrrrr0..',
	'..0rrrrrrrrr0...',
	'...0rrrrrrr0....',
	'....0rrrrr0.....',
	'.....0rrr0......',
	'......0r0.......',
	'.......0........',
	'................',
	'................',
];

export const BUSH: string[] = [
	'................',
	'................',
	'....00.00.00....',
	'...0gg0gg0gg0...',
	'..0gGgggggggg0..',
	'.0ggGggggGggg0..',
	'.0gggggGggggg0..',
	'.0gGggggggGgg0..',
	'.0gggGggggggG0..',
	'.0gggggGgggGg0..',
	'..0ggGggggggg0..',
	'...0gggggggg0...',
	'....00000000....',
	'................',
	'................',
	'................',
];

// ============================================================================
// EMPTY / CONTRIBUTION TILE — shown when cell has no collectible
// ============================================================================

/** Empty overworld tile (grass-like texture) — subtle, for "no contribution" days. */
export const GRASS_EMPTY: string[] = [
	'................',
	'................',
	'................',
	'................',
	'................',
	'................',
	'................',
	'................',
	'................',
	'................',
	'................',
	'................',
	'................',
	'................',
	'................',
	'................',
];

export interface SpriteSet {
	link: {
		down: [string[], string[]];
		up: [string[], string[]];
		right: [string[], string[]];
		left: [string[], string[]];
	};
	enemies: {
		octorok: [string[], string[]];
		moblin: [string[], string[]];
		leever: [string[], string[]];
		keese: [string[], string[]];
	};
	collectibles: {
		rupeeGreen: string[];
		rupeeBlue: string[];
		rupeeRed: string[];
		heart: string[];
		bush: string[];
	};
}

export const SPRITES: SpriteSet = {
	link: {
		down: [LINK_DOWN_A, LINK_DOWN_B],
		up: [LINK_UP_A, LINK_UP_B],
		right: [LINK_RIGHT_A, LINK_RIGHT_B],
		left: [LINK_LEFT_A, LINK_LEFT_B],
	},
	enemies: {
		octorok: [OCTOROK_A, OCTOROK_B],
		moblin: [MOBLIN_A, MOBLIN_B],
		leever: [LEEVER_A, LEEVER_B],
		keese: [KEESE_A, KEESE_B],
	},
	collectibles: {
		rupeeGreen: RUPEE_GREEN,
		rupeeBlue: RUPEE_BLUE,
		rupeeRed: RUPEE_RED,
		heart: HEART,
		bush: BUSH,
	},
};
