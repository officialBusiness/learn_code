/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const ReactDebugCurrentFrame = {};

let currentExtraStackFrame = null;

export function setExtraStackFrame(stack) {

  currentExtraStackFrame = stack;
}


ReactDebugCurrentFrame.setExtraStackFrame = function(stack) {

  currentExtraStackFrame = stack;
};
// Stack implementation injected by the current renderer.
ReactDebugCurrentFrame.getCurrentStack = null;

ReactDebugCurrentFrame.getStackAddendum = function() {
  let stack = '';

  // Add an extra top frame while an element is being validated
  if (currentExtraStackFrame) {
    stack += currentExtraStackFrame;
  }

  // Delegate to the injected renderer-specific implementation
  const impl = ReactDebugCurrentFrame.getCurrentStack;
  if (impl) {
    stack += impl() || '';
  }

  return stack;
};


export default ReactDebugCurrentFrame;