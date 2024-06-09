// /**
//  * Copyright (c) Facebook, Inc. and its affiliates.
//  *
//  * This source code is licensed under the MIT license found in the
//  * LICENSE file in the root directory of this source tree.
//  *
//  * @flow
//  */

// import type {AnyNativeEvent} from '../PluginModuleType';
// import type {DOMEventName} from '../DOMEventNames';
// import type {DispatchQueue} from '../DOMPluginEventSystem';
// import type {EventSystemFlags} from '../EventSystemFlags';

import { registerDirectEvent } from '../EventRegistry.js';
import { isReplayingEvent } from '../CurrentReplayingEvent.js';
import {
  SyntheticMouseEvent,
  SyntheticPointerEvent
} from '../SyntheticEvent.js';
import {
  getClosestInstanceFromNode,
  getNodeFromInstance,
  isContainerMarkedAsRoot,
} from '../../client/ReactDOMComponentTree.js';
import { accumulateEnterLeaveTwoPhaseListeners } from '../DOMPluginEventSystem.js';
// import type {KnownReactSyntheticEvent} from '../ReactSyntheticEventType';

import {
  HostComponent,
  // HostText
} from '../../../react-reconciler/ReactWorkTags.js';
import { getNearestMountedFiber } from '../../../react-reconciler/ReactFiberTreeReflection.js';

function registerEvents() {
  registerDirectEvent('onMouseEnter', ['mouseout', 'mouseover']);
  registerDirectEvent('onMouseLeave', ['mouseout', 'mouseover']);
  registerDirectEvent('onPointerEnter', ['pointerout', 'pointerover']);
  registerDirectEvent('onPointerLeave', ['pointerout', 'pointerover']);
}

// /**
//  * For almost every interaction we care about, there will be both a top-level
//  * `mouseover` and `mouseout` event that occurs. Only use `mouseout` so that
//  * we do not extract duplicate events. However, moving the mouse into the
//  * browser from outside will not fire a `mouseout` event. In this case, we use
//  * the `mouseover` top-level event.
//  */
function extractEvents(
  dispatchQueue,
  domEventName,
  targetInst,
  nativeEvent,
  nativeEventTarget,
  eventSystemFlags,
  targetContainer,
) {
  const isOverEvent =
    domEventName === 'mouseover' || domEventName === 'pointerover';
  const isOutEvent =
    domEventName === 'mouseout' || domEventName === 'pointerout';

  if (isOverEvent && !isReplayingEvent(nativeEvent)) {
    // If this is an over event with a target, we might have already dispatched
    // the event in the out event of the other target. If this is replayed,
    // then it's because we couldn't dispatch against this target previously
    // so we have to do it now instead.
    const related =
      nativeEvent.relatedTarget || nativeEvent.fromElement;
    if (related) {
      // If the related node is managed by React, we can assume that we have
      // already dispatched the corresponding events during its mouseout.
      if (
        getClosestInstanceFromNode(related) ||
        isContainerMarkedAsRoot(related)
      ) {
        return;
      }
    }
  }

  if (!isOutEvent && !isOverEvent) {
    // Must not be a mouse or pointer in or out - ignoring.
    return;
  }

  let win;
  // TODO: why is this nullable in the types but we read from it?
  if (nativeEventTarget.window === nativeEventTarget) {
    // `nativeEventTarget` is probably a window object.
    win = nativeEventTarget;
  } else {
    // TODO: Figure out why `ownerDocument` is sometimes undefined in IE8.
    const doc = nativeEventTarget.ownerDocument;
    if (doc) {
      win = doc.defaultView || doc.parentWindow;
    } else {
      win = window;
    }
  }

  let from;
  let to;
  if (isOutEvent) {
    const related = nativeEvent.relatedTarget || nativeEvent.toElement;
    from = targetInst;
    to = related ? getClosestInstanceFromNode(related) : null;
    if (to !== null) {
      const nearestMounted = getNearestMountedFiber(to);
      if (
        to !== nearestMounted ||
        (to.tag !== HostComponent && to.tag !== HostText)
      ) {
        to = null;
      }
    }
  } else {
    // Moving to a node from outside the window.
    from = null;
    to = targetInst;
  }

  if (from === to) {
    // Nothing pertains to our managed components.
    return;
  }

  let SyntheticEventCtor = SyntheticMouseEvent;
  let leaveEventType = 'onMouseLeave';
  let enterEventType = 'onMouseEnter';
  let eventTypePrefix = 'mouse';
  if (domEventName === 'pointerout' || domEventName === 'pointerover') {
    SyntheticEventCtor = SyntheticPointerEvent;
    leaveEventType = 'onPointerLeave';
    enterEventType = 'onPointerEnter';
    eventTypePrefix = 'pointer';
  }

  const fromNode = from == null ? win : getNodeFromInstance(from);
  const toNode = to == null ? win : getNodeFromInstance(to);

  const leave = new SyntheticEventCtor(
    leaveEventType,
    eventTypePrefix + 'leave',
    from,
    nativeEvent,
    nativeEventTarget,
  );
  leave.target = fromNode;
  leave.relatedTarget = toNode;

  let enter = null;

  // We should only process this nativeEvent if we are processing
  // the first ancestor. Next time, we will ignore the event.
  const nativeTargetInst = getClosestInstanceFromNode( nativeEventTarget );
  if (nativeTargetInst === targetInst) {
    const enterEvent = new SyntheticEventCtor(
      enterEventType,
      eventTypePrefix + 'enter',
      to,
      nativeEvent,
      nativeEventTarget,
    );
    enterEvent.target = toNode;
    enterEvent.relatedTarget = fromNode;
    enter = enterEvent;
  }

  accumulateEnterLeaveTwoPhaseListeners(dispatchQueue, leave, enter, from, to);
}

export {registerEvents, extractEvents};
