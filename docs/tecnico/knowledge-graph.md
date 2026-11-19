# Grafo de conocimiento: clean-n-code

Mapa de qué existe en el repositorio y cómo se conecta. Versión 1.0.0, foto del 2026-11-19 (`npm test`: 215 pasan, 0 fallan).

## Grafo

```mermaid
graph LR
  subgraph Plugin
    manifest[".claude-plugin/plugin.json"] --> hooksjson["hooks/hooks.json"]
  end

  subgraph Hooks
    hooksjson -- "SessionStart / SubagentStart" --> activate["hooks/activate.js"]
    hooksjson -- "PreToolUse" --> secrets["hooks/block-secrets.js"]
    hooksjson -- "PostToolUse" --> afterwrite["hooks/after-write.js"]
    hooksjson -- "Stop" --> checkcodes["hooks/check-codes.js"]
  end

  subgraph Lib
    codes["lib/codes.js"]
    session["lib/session.js"]
    lizard["lib/lizard.js"]
    pyhelpers["lib/check_helpers.py"]
    mjshelpers["lib/check-helpers.mjs"]
  end

  subgraph Reglas
    mode["skills/clean-n-code/SKILL.md (siempre activo)"]
    refs["skills/clean-n-code/references/ smells C-E-F-G-J-N-T, complexity K, design D, security S"]
    langs["languages/*.md (12 guías: PY JS TS JA CS CP GO PH SQ SH CL RS)"]
    review["skills/clean-review"]
    secure["skills/clean-secure"]
    audit["skills/clean-audit"]
    refactor["skills/clean-refactor"]
  end

  activate --> mode
  activate --> codes
  activate --> session
  afterwrite --> codes
  afterwrite --> session
  checkcodes --> codes
  checkcodes --> session
  codes --> langs
  codes --> refs
  mode --> refs
  review --> refs
  secure --> refs
  audit --> refs
  refactor --> refs
  mode --> langs
  review --> langs
  secure --> langs
  audit --> langs
  refactor --> langs

  subgraph Calidad
    tests["tests/*.test.js (215)"]
    evals["evals/ (29 casos)"]
    ab["scripts/ab.js + scripts/ab/"]
  end

  tests --> activate
  tests --> secrets
  tests --> afterwrite
  tests --> checkcodes
  tests --> codes
  tests --> ab
  ab --> lizard
  ab --> evals
  evals --> pyhelpers
  evals --> mjshelpers
```

## Nodos

| Nodo | Papel | Tamaño | Lo prueba |
|---|---|---|---|
| `hooks/activate.js` | Inyecta las reglas y una tarjeta de lenguaje (la del lenguaje más usado) al iniciar sesión o subagente | 98 líneas | `tests/hook.test.js` |
| `hooks/block-secrets.js` | Bloquea escrituras con claves (AWS, GitHub, Stripe, Anthropic…) | 45 | `tests/secrets-hook.test.js` |
| `hooks/after-write.js` | Envía la tarjeta de un lenguaje la primera vez que se escribe, sin pedir rehacer el fichero | 30 | `tests/after-write.test.js` |
| `hooks/check-codes.js` | Devuelve el turno si la línea final cita códigos inexistentes | 59 | `tests/check-codes.test.js` |
| `lib/codes.js` | Códigos de reglas, lenguajes y tarjetas | 81 | `tests/codes.test.js`, `tests/catalogs.test.js` |
| `lib/session.js` | Recuerda qué tarjetas ya están en contexto | 41 | `tests/after-write.test.js` |
| `lib/lizard.js` | Métricas de complejidad para el A/B | 28 | `tests/ab.test.js` |
| `scripts/ab.js` + `scripts/ab/` | A/B sin/con plugin, juez ciego (args, judge, report aparte) | 443 + 335 | `tests/ab.test.js` |
| `skills/*/SKILL.md` | Modo siempre activo + review, secure, audit, refactor | 44–57 | `tests/skills.test.js` |
| `languages/*.md` | 12 guías de lenguaje | 34–43 | `tests/languages.test.js` |
| `evals/` | 12 lang, 9 mode/refactor, 4 review, 2 secure, 1 audit, 1 skill-refactor | 29 casos | `claude plugin eval` (`npm run eval`) |

## Coste en tokens (frente a no usar el plugin)

| | Sonnet | Haiku |
|---|---|---|
| coste | +12% | +17% |
| tokens de salida | −1% | +11% |
| escritura en caché | +21% | +21% |

## Puntos débiles conocidos

- La escritura en caché sigue un 21% por encima: es el propio conjunto de reglas.
- Refactor que descuenta stock antes de leer un precio ausente, y manejo de `ß` (fallan a veces con y sin plugin).
- `scripts/ab.js` (443 líneas) aún mezcla ejecución de brazos, escritura de resultados y resumen.
- Graders de Bash, Java y PHP por calibrar; falta verificar que `claude plugin eval` copia los `fixture/`.
