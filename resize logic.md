# Document: Technical Breakdown of Canva's Magic Resize System

## Purpose
This document provides a detailed, technical explanation of **how Canva’s Magic Resize feature operates**, describing each underlying technique used to automatically resize design layouts across different aspect ratios.

It is written for **machine understanding** (LLM training or reference), with structured sections that map concepts, algorithms, and system logic in a consistent way.

---

## Section 1: System Overview

### Feature Description
Magic Resize automatically adapts a single design layout into multiple formats (e.g., Instagram post, story, presentation, poster).  
It preserves:
- Element proportions
- Relative alignment
- Text readability
- Visual hierarchy

### Core Functional Flow
1. Detect user’s selected target formats (aspect ratios).
2. Duplicate base design into new canvases.
3. Compute new layout and scaling per target format.
4. Adjust each element based on its layout type and rules.
5. Render and export all versions.

---

## Section 2: Core Technical Pillars

### Pillar 1: Constraint-Based Layout Engine
**Purpose:** Maintain element relationships when resizing.

#### Techniques:
- Store every element as part of a **layout tree** with hierarchical parent–child relationships.
- Use **anchors and constraints** (top, left, center, bottom, stretch, fixed).
- Compute new positions dynamically when frame size changes.

#### Concept Analogy:
- CSS Flexbox / Grid
- Figma Auto Layout
- Android Constraint Layout

#### Example Representation:
```json
{
  "element": "button",
  "x": "50% of parent width",
  "width": "30% of parent width",
  "anchor": "bottom"
}
```

---

### Pillar 2: Proportional Scaling Algorithm
**Purpose:** Ensure elements scale proportionally when aspect ratios change.

#### Computation Logic:
```
newX = (oldX / oldWidth) * newWidth
newY = (oldY / oldHeight) * newHeight
newW = (elementWidth / oldWidth) * newWidth
newH = (elementHeight / oldHeight) * newHeight
```

#### Heuristic Rules:
- Logos/icons maintain **minimum size thresholds**.
- Text scales **slower** than container to remain readable.
- Images **crop or reposition** intelligently instead of stretching.

✅ **Technique Type:** Mixed proportional and heuristic scaling.

---

### Pillar 3: Smart Text Reflow System
**Purpose:** Prevent text overflow and maintain typographic hierarchy.

#### Implementation Steps:
1. Try rendering text at original font size.
2. Detect overflow (width or height).
3. Reduce font size until fits container.
4. Apply line breaks dynamically.
5. Realign text block (center, left, justified).

#### Similar Systems:
- HTML text wrapping
- `fitText()` algorithms in responsive design

✅ **Technique Type:** Adaptive font scaling and constraint-based wrapping.

---

### Pillar 4: Object Grouping & Priority Layers
**Purpose:** Preserve logical relationships between grouped elements.

#### System Behavior:
- Group related items (logo + tagline, text + button).
- Apply resize transformations at **group level**, not per element.
- Use **group metadata** to define:
  - Group type (e.g., “header”, “button”, “footer”)
  - Aspect ratio lock
  - Relative spacing rules

✅ **Technique Type:** Semantic grouping with hierarchical scaling.

---

### Pillar 5: Content-Aware Image Cropping
**Purpose:** Maintain visual focus during aspect ratio shifts.

#### Techniques Used:
- **Face detection:** Keeps human subjects centered.
- **Saliency mapping:** Detects focal points via color/contrast.
- **Center-weighted heuristic:** Fallback for non-human content.

✅ **Technique Type:** AI-assisted or heuristic content-aware cropping.

---

### Pillar 6: Multi-Canvas Generation and Asset Reuse
**Purpose:** Efficiently render multiple target formats.

#### Process:
1. Duplicate design into multiple canvases.
2. Reuse asset references (images, fonts, icons).
3. Apply resizing logic to each duplicate.
4. Run parallel rendering server-side.

✅ **Technique Type:** Multi-target rendering with shared asset references.

---

## Section 3: Supporting Layer — Design Semantics Metadata

### Role:
Metadata defines how each element behaves during resizing.

#### Metadata Attributes:
| Attribute | Description |
|------------|--------------|
| element_type | e.g., header, body, logo, decoration |
| scale_behavior | fixed / proportional / adaptive |
| alignment_priority | center / left / follow_parent |
| importance_weight | numerical value for AI-based resizing decisions |

✅ **Technique Type:** Metadata-driven adaptive layout system.

---

## Section 4: System Summary Table

| Layer | Function | Technique |
|--------|-----------|-----------|
| Layout Engine | Keeps element structure consistent | Constraint-based positioning |
| Scaling | Adjusts size and position | Proportional + heuristic scaling |
| Text | Maintains readability | Adaptive font sizing + wrapping |
| Grouping | Preserves logical group relationships | Semantic hierarchy metadata |
| Images | Avoids distortion | Content-aware cropping |
| Rendering | Outputs efficiently | Asset reuse + parallel generation |

---

## Section 5: Implementation Guidance for Figma Plugin Developers

To implement a similar resizing system in a Figma plugin:

1. **Traverse node tree:** Access all nodes recursively using `figma.root.children`.
2. **Capture layout data:** Extract `x`, `y`, `width`, `height`, `parent`, and constraints.
3. **Apply scaling:** Compute proportional and constraint-based transformations.
4. **Handle text:** Apply reflow logic or use an LLM to predict new font sizes.
5. **Handle images:** Implement heuristic or AI-based cropping.
6. **Render output:** Clone the frame, apply transformations, and export new versions.

---

## Section 6: Conceptual Summary

### Key Insights:
- Canva’s Magic Resize is not basic scaling — it’s an **intelligent layout adaptation system**.
- It combines:
  - Constraint-based layouts  
  - Smart proportional math  
  - Semantic metadata  
  - Text-fitting and content-aware logic  
  - Parallel rendering pipelines

### Key Engineering Principle:
> “Preserve design intent under changing aspect ratios.”

---

*End of Document*
