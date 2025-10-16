// Show the UI.
figma.showUI(__html__);

// Set the size of the plugin window.
figma.ui.resize(300, 450);

// As described in "Pillar 1: Constraint-Based Layout Engine" from the design doc,
// we need to capture the layout rules for each element. This interface defines
// the structure for storing that data.
interface NodeLayoutData {
  id: string;
  name: string;
  type: SceneNode['type'];
  x: number;
  y: number;
  parentName: string;
  // Standard constraints (Top, Left, Scale, etc.)
  constraints: Constraints | null;
  // Auto Layout properties, if applicable.
  autoLayout: {
    layoutMode?: 'NONE' | 'HORIZONTAL' | 'VERTICAL' | 'GRID';
    layoutAlign?: 'MIN' | 'CENTER' | 'MAX' | 'STRETCH' | 'INHERIT';
    layoutGrow?: number;
  } | null;
}

// Function to recursively traverse the node tree and collect layout information.
function traverse(node: SceneNode, data: NodeLayoutData[]): NodeLayoutData[] {
  if (node.parent) {
    const layoutData: NodeLayoutData = {
      id: node.id,
      name: node.name,
      type: node.type,
      x: node.x,
      y: node.y,
      parentName: node.parent.name,
      // This captures the basic Figma constraints (how an object is pinned to its parent).
      constraints: 'constraints' in node ? node.constraints : null,
      // Check for Auto Layout properties, which are powerful for responsive design.
      autoLayout: 'layoutMode' in node.parent ? {
        layoutMode: node.parent.layoutMode,
        layoutAlign: 'layoutAlign' in node ? node.layoutAlign : undefined,
        layoutGrow: 'layoutGrow' in node ? node.layoutGrow : undefined,
      } : null,
    };
    data.push(layoutData);
  }

  // Check if the node has children and recurse.
  if ("children" in node) {
    for (const child of node.children) {
      traverse(child, data);
    }
  }
  return data;
}

// Listen for messages from the UI.
figma.ui.onmessage = msg => {
  if (msg.type === 'traverse-frame') {
    // We start by checking the user's current selection on the Figma canvas.
    const selection = figma.currentPage.selection;

    // We require the user to select exactly one frame to begin the process.
    if (selection.length === 1 && selection[0].type === "FRAME") {
      // If the selection is valid, we start the traversal from the selected frame.
      const traversalData = traverse(selection[0], []);
      figma.ui.postMessage({ type: 'traversal-result', data: traversalData });
    } else {
      // If the selection is not a single frame, notify the user.
      figma.notify("Please select a single frame to process.");
    }
  }
};
