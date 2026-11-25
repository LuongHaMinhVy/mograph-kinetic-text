# Task: Upgrade Motion Design Intelligence

## Context

The current Remotion-generated video has a recognizable visual style but lacks professional motion design quality.

The output currently exhibits:
- Repetitive scene composition.
- Limited motion variation.
- Weak typography hierarchy.
- Insufficient multi-layer interaction.
- Static or nearly static decorative elements.
- Predictable animation timing.
- Transitions that rely too heavily on repeated diagonal shapes.

## Objective

Improve the existing motion design system rather than simply adding more visual effects.

The target is experimental editorial motion graphics and kinetic typography, based on the provided reference video.

## Required Improvements

### 1. Dynamic Composition
- Create different visual compositions for different scenes.
- Vary typography scale, alignment, orientation and density.
- Use negative space intentionally.
- Avoid repeating the same layout across consecutive scenes.

### 2. Motion Direction
- Implement anticipation, overshoot and follow-through where appropriate.
- Introduce secondary motion.
- Coordinate foreground, background and decorative layers.
- Avoid applying identical easing to every element.

### 3. Typography
- Implement character-level and word-level animation.
- Improve visual hierarchy.
- Use masking, clipping and staggered reveals.
- Prevent accidental text collisions and clipping.

### 4. Motion Timing
- Introduce dynamic pacing.
- Combine fast transitions with deliberate holds.
- Use different velocity profiles depending on the visual action.
- Synchronize important motion accents with musical beats when applicable.

### 5. Scene Transitions
- Develop multiple transition patterns.
- Connect scenes through spatial movement, typography and shape interactions.
- Avoid relying on a single diagonal stripe transition.

### 6. Evaluation
Build a preview evaluation process that checks:
- Motion smoothness.
- Composition variation.
- Typography readability.
- Visual hierarchy.
- Layer interaction.
- Timing and rhythm.
- Unintended clipping and overlap.

## Implementation Constraints

- Continue using Remotion.
- Reuse existing project architecture where appropriate.
- Do not introduce unnecessary dependencies.
- Keep animation logic reusable and configurable.
- Use frame-based deterministic animation.
- Preserve the existing rendering workflow.

## Deliverables

1. Audit the existing Remotion implementation.
2. Identify the actual causes of repetitive and stiff motion.
3. Design the improved Motion Design Skill architecture.
4. Implement the highest-priority improvements.
5. Render a comparison preview.
6. Document reusable motion patterns and their parameters.

Do not merely increase animation complexity. Prioritize intentional composition, motion quality and visual storytelling.