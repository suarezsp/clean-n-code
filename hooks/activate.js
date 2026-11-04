#!/usr/bin/env node
// Injects the clean-n-code ruleset (skills/clean-n-code/SKILL.md body) as session context.
const fs = require('fs');
const path = require('path');

if ((process.env.CLEAN_N_CODE || '').toLowerCase() === 'off') process.exit(0);

const event = process.argv[2] || 'SessionStart';
const skill = fs.readFileSync(path.join(__dirname, '..', 'skills', 'clean-n-code', 'SKILL.md'), 'utf8');
const refs = path.join(__dirname, '..', 'skills', 'clean-n-code', 'references');
// Hook context has no skill base dir, so point catalog references at their absolute path.
const body = skill.replace(/^---\n[\s\S]*?\n---\n/, '').trim().replace(/`references\//g, `\`${refs}/`);
const context = `CLEAN-N-CODE MODE ACTIVE\n\n${body}`;

// SessionStart takes raw stdout; SubagentStart needs the JSON form or the context is dropped.
process.stdout.write(event === 'SubagentStart'
  ? JSON.stringify({ hookSpecificOutput: { hookEventName: event, additionalContext: context } })
  : context);
