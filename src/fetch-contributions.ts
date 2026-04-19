/**
 * Fetch contribution calendar data from GitHub's GraphQL API.
 */

import fetch from 'node-fetch';
import { ContributionCell, ContributionGrid, ContributionLevel } from './types';

const GITHUB_GRAPHQL = 'https://api.github.com/graphql';

interface GqlDay {
	date: string;
	contributionCount: number;
	contributionLevel:
		| 'NONE'
		| 'FIRST_QUARTILE'
		| 'SECOND_QUARTILE'
		| 'THIRD_QUARTILE'
		| 'FOURTH_QUARTILE';
}

interface GqlWeek {
	contributionDays: GqlDay[];
}

interface GqlResponse {
	data?: {
		user?: {
			contributionsCollection: {
				contributionCalendar: {
					totalContributions: number;
					weeks: GqlWeek[];
				};
			};
		};
	};
	errors?: Array<{ message: string }>;
}

const LEVEL_MAP: Record<GqlDay['contributionLevel'], ContributionLevel> = {
	NONE: 0,
	FIRST_QUARTILE: 1,
	SECOND_QUARTILE: 2,
	THIRD_QUARTILE: 3,
	FOURTH_QUARTILE: 4,
};

/**
 * Fetch a user's GitHub contribution calendar.
 *
 * Requires a personal access token with `read:user` scope (or the default
 * GITHUB_TOKEN in GitHub Actions, which has sufficient permissions for
 * the authenticated user's own data).
 */
export async function fetchContributions(
	username: string,
	token: string
): Promise<ContributionGrid> {
	const query = `
		query($login: String!) {
			user(login: $login) {
				contributionsCollection {
					contributionCalendar {
						totalContributions
						weeks {
							contributionDays {
								date
								contributionCount
								contributionLevel
							}
						}
					}
				}
			}
		}
	`;

	const res = await fetch(GITHUB_GRAPHQL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `bearer ${token}`,
			'User-Agent': 'zelda-contribution-graph',
		},
		body: JSON.stringify({ query, variables: { login: username } }),
	});

	if (!res.ok) {
		throw new Error(`GitHub API returned ${res.status}: ${await res.text()}`);
	}

	const json = (await res.json()) as GqlResponse;

	if (json.errors && json.errors.length) {
		throw new Error(
			`GitHub GraphQL errors: ${json.errors.map((e) => e.message).join(', ')}`
		);
	}

	const calendar = json.data?.user?.contributionsCollection?.contributionCalendar;
	if (!calendar) {
		throw new Error(`No contribution data for user "${username}"`);
	}

	const cells: ContributionCell[] = [];
	calendar.weeks.forEach((week, colIdx) => {
		week.contributionDays.forEach((day) => {
			const d = new Date(day.date);
			const rowIdx = d.getUTCDay(); // 0 = Sunday
			cells.push({
				col: colIdx,
				row: rowIdx,
				date: day.date,
				count: day.contributionCount,
				level: LEVEL_MAP[day.contributionLevel],
			});
		});
	});

	return {
		cells,
		cols: calendar.weeks.length,
		rows: 7,
		username,
		totalContributions: calendar.totalContributions,
	};
}

/**
 * Generate a deterministic mock grid for local testing without hitting the API.
 * Useful for CI and for users who want to preview the output before wiring up
 * their GITHUB_TOKEN.
 */
export function generateMockGrid(username = 'mock-user'): ContributionGrid {
	const cells: ContributionCell[] = [];
	const cols = 53;
	const rows = 7;

	// Simple deterministic pattern — sine wave + pseudo-random jitter.
	let seed = 42;
	const rand = () => {
		seed = (seed * 1103515245 + 12345) & 0x7fffffff;
		return seed / 0x7fffffff;
	};

	for (let c = 0; c < cols; c++) {
		for (let r = 0; r < rows; r++) {
			const wave = Math.sin(c * 0.3) * 0.4 + 0.4;
			const noise = rand() * 0.6;
			const raw = wave + noise;
			let level: ContributionLevel = 0;
			if (raw > 0.3) level = 1;
			if (raw > 0.55) level = 2;
			if (raw > 0.75) level = 3;
			if (raw > 0.95) level = 4;
			const count = level === 0 ? 0 : Math.floor(raw * 12);
			cells.push({
				col: c,
				row: r,
				date: `2025-${String(Math.min(12, Math.floor(c / 4.5) + 1)).padStart(
					2,
					'0'
				)}-01`,
				count,
				level,
			});
		}
	}

	return {
		cells,
		cols,
		rows,
		username,
		totalContributions: cells.reduce((sum, c) => sum + c.count, 0),
	};
}
