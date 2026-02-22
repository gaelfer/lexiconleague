#!/usr/bin/env node
/**
 * Install a skill for Cursor, Claude Code, and Codex.
 * Usage: node scripts/install-skill-all.mjs <repo-url> <skill-name>
 * Example: node scripts/install-skill-all.mjs https://github.com/vercel-labs/agent-skills vercel-react-best-practices
 */

import { execSync } from "child_process";
import { cpSync, rmSync, existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";

const [repoUrl, skillName] = process.argv.slice(2);
if (!repoUrl || !skillName) {
  console.error("Usage: node scripts/install-skill-all.mjs <repo-url> <skill-name>");
  console.error("Example: node scripts/install-skill-all.mjs https://github.com/vercel-labs/agent-skills vercel-react-best-practices");
  process.exit(1);
}

const agentsSkills = join(homedir(), ".agents", "skills", skillName);
const claudeSkills = join(homedir(), ".claude", "skills", skillName);

console.log("Installing skill for Cursor, Claude Code, and Codex...\n");

// Step 1: npx skills add
console.log("1. Running npx skills add...");
execSync(`npx skills add ${repoUrl} --skill ${skillName} --yes --global`, {
  stdio: "inherit",
});

// Step 2: Copy to ~/.claude/skills/ for Claude Code (avoids symlink issues)
if (existsSync(agentsSkills)) {
  console.log("\n2. Copying to ~/.claude/skills/ for Claude Code...");
  rmSync(claudeSkills, { recursive: true, force: true });
  cpSync(agentsSkills, claudeSkills, { recursive: true });
  console.log("   Done.");
} else {
  console.warn("\n2. Warning: ~/.agents/skills/" + skillName + " not found; skipping Claude Code copy.");
}

console.log("\n✓ Skill installed for Cursor, Claude Code, and Codex.");
console.log("  Restart Claude Code if it doesn't show up.");
