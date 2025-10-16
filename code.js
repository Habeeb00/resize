"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// Show the UI.
figma.showUI(__html__);
// Set the size of the plugin window.
figma.ui.resize(300, 650);
// Function to recursively traverse the node tree and collect layout information.
function traverse(node, data) {
    if (node.parent) {
        const layoutData = {
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
// Renamed from applyLegacyResize. This is now the primary function for transforming nodes.
function applyProportionalResize(node, scaleX, scaleY, log, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const oldX = Math.round(node.x);
        const oldY = Math.round(node.y);
        const newX = node.x * scaleX;
        const newY = node.y * scaleY;
        if ('resize' in node) {
            const oldWidth = Math.round(node.width);
            const oldHeight = Math.round(node.height);
            const newWidth = node.width * scaleX;
            const newHeight = node.height * scaleY;
            node.resize(newWidth, newHeight);
            log.push(`Resized '${node.name}' from ${oldWidth}x${oldHeight} to ${Math.round(newWidth)}x${Math.round(newHeight)}`);
        }
        if (options.useAdaptiveText && node.type === 'TEXT') {
            if (node.fontName !== figma.mixed) {
                yield figma.loadFontAsync(node.fontName);
                const fontScale = Math.min(scaleX, scaleY);
                if (node.fontSize !== figma.mixed) {
                    const oldFontSize = node.fontSize;
                    const newFontSize = Math.round(node.fontSize * fontScale);
                    node.fontSize = newFontSize;
                    log.push(`Resized font in '${node.name}' from ${Math.round(oldFontSize)}pt to ${newFontSize}pt`);
                }
            }
        }
        if (options.useContentAwareImages && 'fills' in node && Array.isArray(node.fills)) {
            const newFills = JSON.parse(JSON.stringify(node.fills));
            let fillsModified = false;
            for (const fill of newFills) {
                if (fill.type === 'IMAGE' && fill.imageHash) {
                    // To properly scale the image, we need its original dimensions.
                    const image = figma.getImageByHash(fill.imageHash);
                    if (image) {
                        const { width: imgWidth, height: imgHeight } = yield image.getSizeAsync();
                        // Determine the scale needed to make the image cover the node's new size.
                        const nodeRatio = node.width / node.height;
                        const imgRatio = imgWidth / imgHeight;
                        let imgScale;
                        if (nodeRatio > imgRatio) {
                            // Node is wider than the image, so scale to match width.
                            imgScale = node.width / imgWidth;
                        }
                        else {
                            // Node is taller than the image, so scale to match height.
                            imgScale = node.height / imgHeight;
                        }
                        // The new transform will scale the image and then center it.
                        const newTransform = [
                            [imgScale, 0, (node.width - imgWidth * imgScale) / 2],
                            [0, imgScale, (node.height - imgHeight * imgScale) / 2],
                        ];
                        fill.scaleMode = 'FILL'; // Ensure the fill mode is correct
                        fill.imageTransform = newTransform;
                        fillsModified = true;
                        log.push(`Applied content-aware crop to image in '${node.name}'.`);
                    }
                }
            }
            if (fillsModified) {
                node.fills = newFills;
            }
        }
        // New Heuristic: Adjust stroke weight on scaled vector nodes.
        if (options.useAdaptiveStrokes && 'strokeWeight' in node && typeof node.strokeWeight === 'number' && node.strokeWeight > 0) {
            if (node.type === 'VECTOR' || node.type === 'RECTANGLE' || node.type === 'ELLIPSE' || node.type === 'POLYGON' || node.type === 'STAR' || node.type === 'LINE') {
                const avgScale = (scaleX + scaleY) / 2;
                if (avgScale > 1) { // Only apply when scaling up.
                    const maxStrokeWeight = 5; // A reasonable cap to prevent overly thick lines.
                    if (node.strokeWeight > maxStrokeWeight) {
                        const oldStrokeWeight = node.strokeWeight;
                        node.strokeWeight = maxStrokeWeight;
                        log.push(`Capped stroke on '${node.name}' from ${oldStrokeWeight.toFixed(1)}px to ${node.strokeWeight}px.`);
                    }
                }
            }
        }
        // Clamp final position to stay within parent boundaries.
        let finalX = newX;
        let finalY = newY;
        if (node.parent && 'width' in node.parent && 'width' in node) {
            const parentWidth = node.parent.width;
            const parentHeight = node.parent.height;
            // The final X cannot be less than 0.
            // It also cannot be greater than the parent's width minus the node's own width.
            finalX = Math.max(0, Math.min(newX, parentWidth - node.width));
            finalY = Math.max(0, Math.min(newY, parentHeight - node.height));
        }
        node.x = finalX;
        node.y = finalY;
        log.push(`Moved '${node.name}' from (${oldX}, ${oldY}) to (${Math.round(finalX)}, ${Math.round(finalY)})`);
    });
}
// Renamed from resizeChildrenLegacy. This is now the only recursive resize function.
function resizeRecursively(node, scaleX, scaleY, log, options) {
    return __awaiter(this, void 0, void 0, function* () {
        if ("children" in node) {
            for (const child of node.children) {
                yield applyProportionalResize(child, scaleX, scaleY, log, options);
                yield resizeRecursively(child, scaleX, scaleY, log, options);
            }
        }
    });
}
// Listen for messages from the UI.
figma.ui.onmessage = (msg) => __awaiter(void 0, void 0, void 0, function* () {
    if (msg.type === 'traverse-frame') {
        // We start by checking the user's current selection on the Figma canvas.
        const selection = figma.currentPage.selection;
        // We require the user to select exactly one frame to begin the process.
        if (selection.length === 1 && selection[0].type === "FRAME") {
            // If the selection is valid, we start the traversal from the selected frame.
            const traversalData = traverse(selection[0], []);
            figma.ui.postMessage({ type: 'traversal-result', data: traversalData });
        }
        else {
            // If the selection is not a single frame, notify the user.
            figma.notify("Please select a single frame to process.");
        }
    }
    if (msg.type === 'resize-frame') {
        const selection = figma.currentPage.selection;
        if (selection.length === 1 && selection[0].type === "FRAME") {
            const originalFrame = selection[0];
            const newFrame = originalFrame.clone();
            newFrame.x = originalFrame.x + originalFrame.width + 100;
            const { width: newWidth, height: newHeight, useAdaptiveText, useContentAwareImages, useAdaptiveStrokes } = msg;
            const resizeOptions = { useAdaptiveText, useContentAwareImages, useAdaptiveStrokes };
            const scaleX = newWidth / originalFrame.width;
            const scaleY = newHeight / originalFrame.height;
            const resizeLog = [];
            resizeLog.push(`Cloned '${originalFrame.name}' to '${newFrame.name}'.`);
            resizeLog.push(`Resizing from ${Math.round(originalFrame.width)}x${Math.round(originalFrame.height)} to ${newWidth}x${newHeight}.`);
            // Simplified logic: always use the reliable, recursive resizing strategy.
            resizeLog.push('Using proportional resize for all elements.');
            newFrame.resize(newWidth, newHeight);
            yield resizeRecursively(newFrame, scaleX, scaleY, resizeLog, resizeOptions);
            figma.ui.postMessage({ type: 'resize-log', data: resizeLog });
            figma.notify('Frame resized successfully.');
        }
        else {
            figma.notify("Please select a single frame to resize.");
        }
    }
});
