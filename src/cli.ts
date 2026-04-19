#!/usr/bin/env node
/**
 * Command-line interface.
 *
 * Usage:
 *   zelda-contribution-graph --username <name> --output <path> [--token <token>] [--theme dark|light] [--mock]
 *
 * Environment variables:
 *   GITHUB_TOKEN   — fallback if --token not provided
 */

import * as fs from 'fs';
import * as path from 'path';
import { fetchContributions, generateMockGrid } from './fetch-contributions';
import { generateSVG } from './svg-generator';
import { RenderOptions } from './types';

interface CliArgs {
	username?: string;
	token?: string;
	output: string;
	theme: 'dark' | 'light';
	mock: boolean;
	durationSeconds: number;
}

function parseArgs(argv: string[]): CliArgs {
	const args: CliArgs = {
		output: 'zelda-contribution-graph.svg',
		theme: 'dark',
		mock: false,
		durationSeconds: 90,
	};
	for (let i = 2; i < argv.length; i++) {
		const a = argv[i];
		switch (a) {
			case '--username':
			case '-u':
				args.username = argv[++i];
				break;
			case '--token':
			case '-t':
				args.token = argv[++i];
				break;
			case '--output':
			case '-o':
				args.output = argv[++i];
				break;
			case '--theme':
				args.theme = argv[++i] as 'dark' | 'light';
				break;
			case '--duration':
				args.durationSeconds = Number(argv[++i]);
				break;
			case '--mock':
				args.mock = true;
				break;
			case '--help':
			case '-h':
				printHelp();
				process.exit(0);
		}
	}
	return args;
}

function printHelp(): void {
	console.log(`
zelda-contribution-graph — turn your GitHub contributions into an 8-bit Zelda adventure

Usage:
  zelda-contribution-graph --username <name> [--output <path>] [options]

Options:
  -u, --username <name>   GitHub username (required unless --mock)
  -t, --token <token>     GitHub personal access token (or set GITHUB_TOKEN env var)
  -o, --output <path>     Output SVG path (default: zelda-contribution-graph.svg)
      --theme <dark|light>  Color theme (default: dark)
      --duration <seconds>  Total animation length (default: 90)
      --mock                Use mock data — no network call, good for testing
  -h, --help                Show this help message

Examples:
  zelda-contribution-graph --username octocat --token $GITHUB_TOKEN
  zelda-contribution-graph --mock --output preview.svg
`);
}

async function main(): Promise<void> {
	const args = parseArgs(process.argv);

	let grid;
	if (args.mock) {
		grid = generateMockGrid(args.username ?? 'hero');
	} else {
		if (!args.username) {
			console.error('Error: --username is required (or use --mock for testing).');
			process.exit(1);
		}
		const token = args.token ?? process.env.GITHUB_TOKEN;
		if (!token) {
			console.error(
				'Error: --token or GITHUB_TOKEN env variable is required. Create one at https://github.com/settings/tokens with read:user scope.'
			);
			process.exit(1);
		}
		console.log(`Fetching contributions for @${args.username}…`);
		grid = await fetchContributions(args.username, token);
	}

	console.log(
		`Generating SVG (${grid.totalContributions} contributions over ${grid.cols} weeks)…`
	);

	const options: RenderOptions = {
		theme: args.theme,
		durationSeconds: args.durationSeconds,
	};
	const svg = generateSVG(grid, options);

	const outPath = path.resolve(args.output);
	fs.mkdirSync(path.dirname(outPath), { recursive: true });
	fs.writeFileSync(outPath, svg, 'utf-8');
	console.log(`Wrote ${outPath} (${(svg.length / 1024).toFixed(1)} KB).`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
