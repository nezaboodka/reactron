// The below copyright notice and the license permission notice
// shall be included in all copies or substantial portions.
// Copyright (C) 2019-2021 Yury Chetyrko <ychetyrko@gmail.com>
// MIT License: https://raw.githubusercontent.com/nezaboodka/reactronic-front-web/master/LICENSE
// By contributing, you agree that your contributions will be
// automatically licensed under the license referred above.

import { transaction, trace, TraceLevel, unobservable } from 'reactronic'
import { Sensors, grabCustomInfos } from '../core'
import { SymCustomInfo } from './WebApiExt'

export class WebSensors extends Sensors {
  @unobservable currentEvent: Event | undefined = undefined
  element?: HTMLElement | null

  constructor() {
    super()
    this.element = undefined
  }

  preventDefault(): void {
    if (this.currentEvent !== undefined)
      this.currentEvent.preventDefault()
  }

  stopPropagation(): void {
    if (this.currentEvent !== undefined)
      this.currentEvent.stopPropagation()
  }

  @transaction
  listen(element: HTMLElement | undefined, enabled: boolean = true): void {
    const existing = this.element
    if (element !== existing) {
      if (existing) {
        existing.removeEventListener('focusin', this.onFocusIn, true)
        existing.removeEventListener('focusout', this.onFocusOut, true)
        existing.removeEventListener('pointermove', this.onPointerMove, false)
        existing.removeEventListener('pointerdown', this.onPointerDown, false)
        existing.removeEventListener('pointerup', this.onPointerUp, false)
        existing.removeEventListener('lostpointercapture', this.onLostPointerCapture, false)
        existing.removeEventListener('dblclick', this.onDblClick, false)
        existing.removeEventListener('touchstart', this.onTouchStart, false)
        existing.removeEventListener('touchend', this.onTouchEnd, false)
        existing.removeEventListener('wheel', this.onWheel, false)
        existing.removeEventListener('keydown', this.onKeyDown, true)
        existing.removeEventListener('keyup', this.onKeyUp, true)
      }
      this.element = element
      if (element && enabled) {
        element.addEventListener('focusin', this.onFocusIn, true)
        element.addEventListener('focusout', this.onFocusOut, true)
        element.addEventListener('pointerover', this.onPointerOver, false)
        element.addEventListener('pointermove', this.onPointerMove, false)
        element.addEventListener('pointerdown', this.onPointerDown, false)
        element.addEventListener('pointerup', this.onPointerUp, false)
        element.addEventListener('lostpointercapture', this.onLostPointerCapture, false)
        element.addEventListener('dblclick', this.onDblClick, false)
        element.addEventListener('touchstart', this.onTouchStart, false)
        element.addEventListener('touchend', this.onTouchEnd, false)
        element.addEventListener('wheel', this.onWheel, false)
        element.addEventListener('keydown', this.onKeyDown, true)
        element.addEventListener('keyup', this.onKeyUp, true)
      }
    }
  }

  @transaction @trace(TraceLevel.Suppress)
  resetFocus(): void {
    const ei = this.element?.customInfo?.focus
    this.trackFocus(ei ? [ei] : [], true)
    this.element?.focus()
  }

  @transaction @trace(TraceLevel.Suppress)
  onFocusIn(e: FocusEvent): void {
    const path = e.composedPath()
    this.currentEvent = e
    this.doFocusIn(
      grabCustomInfos(path, SymCustomInfo, 'focus', 'focusImportance', this.focus.customInfos))
  }

  @transaction @trace(TraceLevel.Suppress)
  onFocusOut(e: FocusEvent): void {
    const path = e.composedPath()
    this.currentEvent = e
    this.doFocusOut(
      grabCustomInfos(path, SymCustomInfo, 'focus', 'focusImportance', this.focus.customInfos))
  }

  @transaction @trace(TraceLevel.Suppress)
  onPointerOver(e: PointerEvent): void {
    const path = e.composedPath()
    this.currentEvent = e
    this.doPointerOver(
      grabCustomInfos(path, SymCustomInfo, 'pointer', 'pointerImportance', this.pointer.customInfos),
      grabCustomInfos(path, SymCustomInfo, 'hover', 'hoverImportance', this.hover.customInfos),
      e.clientX, e.clientY)
  }

  @transaction @trace(TraceLevel.Suppress)
  onPointerMove(e: PointerEvent): void {
    const path = e.composedPath()
    this.currentEvent = e
    this.doPointerMove(
      grabCustomInfos(path, SymCustomInfo, 'pointer', 'pointerImportance', this.pointer.customInfos),
      e.pointerId, e.clientX, e.clientY)
  }

  @transaction @trace(TraceLevel.Suppress)
  onPointerDown(e: PointerEvent): void {
    const path = e.composedPath()
    this.currentEvent = e
    this.doPointerDown(
      grabCustomInfos(path, SymCustomInfo, 'pointer', 'pointerImportance', this.pointer.customInfos),
      grabCustomInfos(path, SymCustomInfo, 'focus', 'focusImportance', this.focus.customInfos),
      e.pointerId, e.buttons, e.clientX, e.clientY)
  }

  @transaction @trace(TraceLevel.Suppress)
  onPointerUp(e: PointerEvent): void {
    const path = e.composedPath()
    this.currentEvent = e
    this.doPointerUp(
      grabCustomInfos(path, SymCustomInfo, 'pointer', 'pointerImportance', this.pointer.customInfos),
      grabCustomInfos(path, SymCustomInfo, 'focus', 'focusImportance', this.focus.customInfos),
      e.pointerId, e.buttons, e.clientX, e.clientY)
  }

  @transaction @trace(TraceLevel.Suppress)
  onLostPointerCapture(e: PointerEvent): void {
    const path = e.composedPath()
    this.currentEvent = e
    this.doPointerCancel(
      grabCustomInfos(path, SymCustomInfo, 'pointer', 'pointerImportance', this.pointer.customInfos),
      grabCustomInfos(path, SymCustomInfo, 'focus', 'focusImportance', this.focus.customInfos),
      e.pointerId, e.buttons, e.clientX, e.clientY)
  }

  @transaction @trace(TraceLevel.Suppress)
  onDblClick(e: MouseEvent): void {
    const path = e.composedPath()
    this.currentEvent = e
    this.doDblClick(
      grabCustomInfos(path, SymCustomInfo, 'pointer', 'pointerImportance', this.pointer.customInfos),
      grabCustomInfos(path, SymCustomInfo, 'focus', 'focusImportance', this.focus.customInfos),
      e.buttons, e.clientX, e.clientY)
  }

  @transaction @trace(TraceLevel.Suppress)
  onTouchStart(e: Event): void {
    const path = e.composedPath()
    this.currentEvent = e
    this.doTouchStart(
      grabCustomInfos(path, SymCustomInfo, 'pointer', 'pointerImportance', this.pointer.customInfos),
      grabCustomInfos(path, SymCustomInfo, 'focus', 'focusImportance', this.focus.customInfos))
  }

  @transaction @trace(TraceLevel.Suppress)
  onTouchEnd(e: Event): void {
    const path = e.composedPath()
    this.currentEvent = e
    this.doTouchEnd(
      grabCustomInfos(path, SymCustomInfo, 'pointer', 'pointerImportance', this.pointer.customInfos))
  }

  @transaction @trace(TraceLevel.Suppress)
  onWheel(e: WheelEvent): void {
    const path = e.composedPath()
    this.currentEvent = e
    this.doWheel(
      grabCustomInfos(path, SymCustomInfo, 'scroll', 'scrollImportance', this.scroll.customInfos),
      grabCustomInfos(path, SymCustomInfo, 'focus', 'focusImportance', this.focus.customInfos),
      e.deltaX, e.deltaY, e.clientX, e.clientY)
  }

  @transaction @trace(TraceLevel.Suppress)
  onKeyDown(e: KeyboardEvent): void {
    const path = e.composedPath()
    this.currentEvent = e
    this.doKeyDown(
      grabCustomInfos(path, SymCustomInfo, 'keyboard', 'keyboardImportance', this.keyboard.customInfos), e.key)
  }

  @transaction @trace(TraceLevel.Suppress)
  onKeyUp(e: KeyboardEvent): void {
    const path = e.composedPath()
    this.currentEvent = e
    this.doKeyUp(
      grabCustomInfos(path, SymCustomInfo, 'keyboard', 'keyboardImportance', this.keyboard.customInfos), e.key)
  }

  protected setPointerCapture(pointerId: number): boolean {
    this.element?.setPointerCapture(pointerId)
    return this.element instanceof HTMLElement
  }

  protected releasePointerCapture(pointerId: number): boolean {
    this.element?.releasePointerCapture(pointerId)
    return false
  }
}
