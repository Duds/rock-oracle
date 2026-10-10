# A minimum text size below WCAG's floor, as a deliberate aesthetic choice

The interface is built on 5–7px text (21 declarations at `5px`, 12 at `6px`,
10 at `7px`), because the Press Start 2P pixel-font aesthetic from `DESIGN.md`
does not hold together at larger sizes. We are keeping it, with two
conditions: small text is confined to decorative and secondary chrome, and the
interface must remain usable at 200% zoom and at a 320px viewport.

This is a knowing trade-off against comfort, not an accessibility pass. WCAG
sets no minimum font size, so 5px is not a formal failure; the practical
complaint is that it is hard to read, particularly on a phone. A future reader
should not "fix" this by bumping the sizes without revisiting the aesthetic
decision first.

## Consequences

- Passing the hardening checklist does not mean the interface is comfortable at
  its smallest sizes.
- If a user complaint or an audit makes the reading effort the priority, the fix
  is a design decision, not a lint rule.
