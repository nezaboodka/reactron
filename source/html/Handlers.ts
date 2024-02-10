// The below copyright notice and the license permission notice
// shall be included in all copies or substantial portions.
// Copyright (C) 2019-2024 Nezaboodka Software <contact@nezaboodka.com>
// License: https://raw.githubusercontent.com/nezaboodka/verstak/master/LICENSE
// By contributing, you agree that your contributions will be
// automatically licensed under the license referred above.

import { Mode, ToggleRef, unobs } from "reactronic"
import { SyntheticElement } from "./Elements.js"
import { FocusModel } from "./sensors/FocusSensor.js"
import { ResizedElement } from "./sensors/ResizeSensor.js"

export function OnClick(target: HTMLElement, action: (() => void) | ToggleRef | undefined, key?: string): void {
  if (action !== undefined) {
    SyntheticElement({
      key,
      mode: Mode.independentUpdate,
      triggers: { target/* , action */ },
      update() {
        const pointer = target.sensors.pointer
        if (pointer.clicked) {
          if (action instanceof Function) {
            unobs(() => action())
          }
          else if (action instanceof ToggleRef) {
            unobs(() => action.toggle())
          }
        }
      },
    })
  }
}

export function OnResize(target: HTMLElement, action: ((element: ResizedElement) => void) | undefined, key?: string): void {
  if (action) {
    SyntheticElement({
      key,
      mode: Mode.independentUpdate,
      triggers: { target/* , action */ },
      update() {
        const resize = target.sensors.resize
        resize.resizedElements.forEach(x => {
          action(x)
        })
      },
    })
  }
}

export function OnFocus(
  target: HTMLElement, model: FocusModel,
  switchEditMode: ((model?: FocusModel) => void) | undefined = undefined,
  key?: string): void {
  SyntheticElement({
    key,
    mode: Mode.independentUpdate,
    triggers: { target, model },
    initialize(b) {
      b.node.configureReactronic({ throttling: 0 })
    },
    update() {
      if (switchEditMode !== undefined) {
        switchEditMode(model)
      }
      else {
        model.isEditMode ? target.focus() : target.blur()
        // console.log(`${model.isEditMode ? '🟢' : '🔴'} RxFocuser [${name}]: ${model.isEditMode ? 'focus()' : 'blur()'}`)
      }
    },
  })
}