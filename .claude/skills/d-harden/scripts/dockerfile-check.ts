#!/usr/bin/env bun

/**
 * dockerfile-check.ts — Verifies Dockerfile runtime stage includes all files needed by railway.toml commands.
 *
 * Reads railway.toml for preDeployCommand and startCommand.
 * Reads Dockerfile for COPY statements in the runtime stage (after last FROM).
 * Checks that all files/dirs referenced by commands are included in COPY statements.
 *
 * Usage: bun dockerfile-check.ts [--repo-root <path>]
 * Output: JSON with missing files
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const args = process.argv.slice(2);
const rootIdx = args.indexOf("--repo-root");
const repoRoot = rootIdx !== -1 && args[rootIdx + 1]
	? resolve(args[rootIdx + 1])
	: resolve(process.cwd());

function readFile(path: string): string | null {
	try {
		return readFileSync(resolve(repoRoot, path), "utf-8");
	} catch {
		return null;
	}
}

function extractTomlValue(content: string, key: string): string | null {
	const regex = new RegExp(`${key}\\s*=\\s*"([^"]*)"`, "m");
	const match = content.match(regex);
	return match ? match[1] : null;
}

function extractRuntimeCopies(dockerfile: string): string[] {
	const lines = dockerfile.split("\n");
	const copies: string[] = [];
	let inRuntimeStage = false;

	for (const line of lines) {
		const trimmed = line.trim();

		// Track FROM statements — the last FROM is the runtime stage
		if (/^FROM\s+/i.test(trimmed)) {
			inRuntimeStage = true;
			copies.length = 0; // Reset — only care about last stage
		}

		if (inRuntimeStage && /^COPY\s+/i.test(trimmed)) {
			// Parse COPY --from=builder /app/dist ./dist style
			// or COPY package.json .
			const copyMatch = trimmed.match(/^COPY\s+(?:--from=\S+\s+)?(.+)\s+(\S+)$/i);
			if (copyMatch) {
				const sources = copyMatch[1].trim();
				// Handle multiple sources: COPY file1 file2 dest/
				const parts = sources.split(/\s+/);
				for (const part of parts) {
					// Normalize paths — remove leading /app/ or ./ for comparison
					const normalized = part
						.replace(/^\/app\//, "")
						.replace(/^\.\//, "")
						.replace(/\/$/, "");
					copies.push(normalized);
				}
			}
		}
	}

	return copies;
}

function extractReferencedFiles(command: string): string[] {
	const files: string[] = [];
	const tokens = command.split(/\s+/);

	for (const token of tokens) {
		// Look for file paths (contains / or ends with known extensions)
		if (
			token.includes("/") ||
			token.endsWith(".js") ||
			token.endsWith(".ts") ||
			token.endsWith(".json")
		) {
			// Skip flags
			if (token.startsWith("-")) continue;
			// Skip common non-file tokens
			if (token.startsWith("http")) continue;

			const normalized = token
				.replace(/^\.\//, "")
				.replace(/\/$/, "");
			files.push(normalized);
		}
	}

	// Also check for bun run scripts that imply package.json
	if (/bun\s+run\s+/.test(command) || /bun\s+install/.test(command)) {
		files.push("package.json");
	}

	return files;
}

function isFileCoveredByCopy(file: string, copies: string[]): boolean {
	for (const copy of copies) {
		// Exact match
		if (file === copy) return true;
		// Directory match — if copy is "dist" and file is "dist/app.js"
		if (file.startsWith(`${copy}/`)) return true;
		// Glob match — if copy is "*.json" and file is "package.json"
		if (copy.includes("*")) {
			const pattern = copy.replace(/\*/g, ".*");
			if (new RegExp(`^${pattern}$`).test(file)) return true;
		}
	}
	return false;
}

// --- Main ---
const railwayToml = readFile("railway.toml");
const dockerfile = readFile("Dockerfile");

if (!railwayToml) {
	console.log(JSON.stringify({ pass: true, message: "No railway.toml found — skipping check." }));
	process.exit(0);
}

if (!dockerfile) {
	console.log(JSON.stringify({ pass: true, message: "No Dockerfile found — skipping check." }));
	process.exit(0);
}

const preDeployCommand = extractTomlValue(railwayToml, "preDeployCommand");
const startCommand = extractTomlValue(railwayToml, "startCommand");

const commands: Array<{ name: string; command: string }> = [];
if (preDeployCommand) commands.push({ name: "preDeployCommand", command: preDeployCommand });
if (startCommand) commands.push({ name: "startCommand", command: startCommand });

const runtimeCopies = extractRuntimeCopies(dockerfile);

const missing: Array<{ command: string; file: string; reason: string }> = [];

for (const { name, command } of commands) {
	const referencedFiles = extractReferencedFiles(command);
	for (const file of referencedFiles) {
		if (!isFileCoveredByCopy(file, runtimeCopies)) {
			missing.push({
				command: name,
				file,
				reason: `${name} references "${file}" but it is not included in any COPY statement in the Dockerfile runtime stage`,
			});
		}
	}
}

const result = {
	pass: missing.length === 0,
	runtimeCopies,
	commands: commands.map((c) => ({ name: c.name, command: c.command })),
	missing,
};

console.log(JSON.stringify(result, null, 2));
process.exit(missing.length > 0 ? 1 : 0);
