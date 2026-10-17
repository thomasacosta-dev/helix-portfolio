# HELIX Design System

## Thesis

HELIX is a helix of connected nodes. The page uses that form as a narrative device: systems, data and people begin as one object, then become editorial type, method states, proof and a direct conversation.

## Direction

Minimalist editorial structure with a hard operational grid. The page is dark-first, typographic and schematic. It uses a restrained set of editorial operation photographs, avoids bento cards, decorative gradients, chip eyebrows and multicolor panel rows. The dominant visual is the blue helix, not a card system.

## Type

- Display: Bricolage Grotesque Variable, self-hosted through `@fontsource-variable/bricolage-grotesque`.
- Text: DM Sans Variable, self-hosted through `@fontsource-variable/dm-sans`.
- Display uses tight tracking and short line lengths. Body copy stays readable and never falls back to a serif.

## Color

- Ground: `#0B0B0E`
- Primary ink: `#ECE8E1`
- Secondary ink: `#8D8B86`
- Brand cyan: `#00D4FF`
- Brand blue: `#0A84FF`
- Brand indigo: `#4A3AFF`
- Brand violet: `#A24BFF`

The brand gradient is reserved for the hero particle field and tiny interaction details. It is not used in text or section backgrounds.

## Composition

The hero is a focused viewport with a single message, one action and a GPU particle field that transitions from an unformed swarm into two branded helix ribbons. The header uses a quiet, spaced HELIX wordmark and a restrained fullscreen navigation surface. Capabilities use full-width editorial rows with a clear visual hierarchy instead of cards. Industries use a typographic marquee at a controlled scale. Method uses four tall states with a sticky reading position; each state names its operational output and the decision before the next step. On mobile, the states become a readable vertical sequence. Cases use a horizontal scroll shelf. Team and stack form one quiet information strip. Contact is a minimal dark close.

## Motion

- Preloader: 1.1s, skip available, transform and opacity only.
- Hero particles: a worker prepares swarm, helix and emblem positions; a Three.js `Points` shader handles the morph, per-particle delay, turbulence, cursor repulsion and scroll dispersion. Desktop uses up to 14,000 particles; mobile serves the static emblem fallback to protect TBT.
- Method: Lenis drives smooth scroll and ScrollTrigger updates the active step opacity, contrast and helix focus. No layout properties animate. The full method remains readable without JavaScript.
- Industry marquee: CSS transform animation, paused for fine-pointer hover and disabled for reduced motion.
- Controls: short color, transform and opacity feedback; no `transition: all`.

## Responsive And Accessibility

Desktop uses a two-column hero and horizontal case shelf. Mobile reorders the hero into copy then a reserved static emblem, stacks method states, and keeps case rows readable. The language selector updates real content in place. Controls are native buttons with visible focus. WebGL falls back to SVG when reduced motion, mobile performance policy or WebGL support prevents the scene.

## Evidence And Placeholders

No verified clients, metrics, testimonials, team names, production screenshots or case evidence were provided. Every such item is marked `[PLACEHOLDER]`. Editorial photos are temporary Unsplash references for layout density and should be replaced or approved before launch.
