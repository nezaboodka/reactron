// The below copyright notice and the license permission notice
// shall be included in all copies or substantial portions.
// Copyright (C) 2019-2021 Yury Chetyrko <ychetyrko@gmail.com>
// MIT License: https://raw.githubusercontent.com/nezaboodka/reactronic-front/master/LICENSE
// By contributing, you agree that your contributions will be
// automatically licensed under the license referred above.

import { reaction, nonreactive, Transaction, Reactronic, options } from 'reactronic'

// RefreshParent, Render, SuperRender

export const RefreshParent = Symbol('RefreshParent') as unknown as void
export type Render<E = unknown, O = void> = (element: E, options: O) => void
export type SuperRender<O = unknown, E = void> = (render: (options: O) => O, element: E) => void

// Manifest

export class Manifest<E = unknown, O = void> {
  constructor(
    readonly id: string,
    readonly args: unknown,
    readonly render: Render<E, O>,
    readonly superRender: SuperRender<O, E> | undefined,
    readonly rtti: Rtti<E, O>,
    readonly parent: Manifest,
    readonly parentForNativeDom: Manifest,
    readonly parentForReactions: Manifest,
    public instance?: Instance<E>) {
  }
  annex?: Manifest<E, O>

  get native(): E | undefined { return this.instance?.native }
}

// Rtti

export interface Rtti<E = unknown, O = void> { // Run-Time Type Info
  readonly name: string
  readonly sorting: boolean
  render?(m: Manifest<E, O>): void
  mount?(m: Manifest<E, O>, sibling?: Manifest): void
  reorder?(m: Manifest<E, O>, sibling?: Manifest): void
  unmount?(m: Manifest<E, O>, cause: Manifest): void
}

// manifest, render, renderChildrenNow, unmount
/* eslint-disable @typescript-eslint/no-non-null-assertion */

export function manifest<E = unknown, O = void>(
  id: string, args: unknown, render: Render<E, O>,
  superRender: SuperRender<O, E> | undefined,
  rtti: Rtti<E, O>, parent?: Manifest,
  parentForNativeDom?: Manifest, parentForReactions?: Manifest): Manifest<E, O> {

  const p = parent ?? gParent
  const p4nd = parentForNativeDom ?? gParentForNativeDom
  const p4r = parentForReactions ?? gParentForReactions
  const self = p.instance
  if (!self)
    throw new Error('element must be mounted before children')
  const m = new Manifest<any, any>(id, args, render, superRender, rtti, p, p4nd, p4r)
  if (self !== ROOT.instance) {
    if (self.updates === undefined)
      throw new Error('children are rendered already') // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    self.updates.push(m)
  }
  else { // render root immediately
    self.updates = [m]
    Transaction.run(renderChildrenNow)
  }
  return m
}

export function render(m: Manifest<any, any>): void {
  const self = m.instance
  if (!self)
    throw new Error('element must be mounted before rendering')
  const outer = gParent   // remember
  const outer4nd = gParentForNativeDom // remember
  const outer4r = gParentForReactions // remember
  try {
    gParent = gParentForNativeDom = gParentForReactions = m
    self.updates = []
    if (gTrace && gTraceMask.indexOf('r') >= 0 && new RegExp(gTrace, 'gi').test(getManifestTraceHint(m)))
      console.log(`t${Transaction.current.id}v${Transaction.current.timestamp}${'  '.repeat(Math.abs(m.instance!.level))}${getManifestTraceHint(m)}.render/${m.instance?.revision}${m.args !== RefreshParent ? `  <<  ${Reactronic.why(true)}` : ''}`)
    if (m.superRender)
      m.superRender(superRender, self.native)
    else
      m.render(self.native, undefined)
    renderChildrenNow() // ignored if rendered already
  }
  finally {
    gParentForReactions = outer4r // restore
    gParentForNativeDom = outer4nd // restore
    gParent = outer   // restore
  }
}

function superRender(options: unknown): unknown {
  const m = gParent
  const native = m.instance?.native
  if (!native)
    throw new Error('element must be mounted before rendering')
  m.render(native, options)
  return options
}

export function renderChildrenNow(): void {
  const m = gParent
  if (m.rtti.sorting)
    reconcileSortedChildren(m)
  else
    reconcileOrdinaryChildren(m)
}

export function unmount(m: Manifest<any, any>, cause: Manifest): void {
  const self = m.instance
  if (self) {
    for (const x of self.children)
      callUnmount(x, cause)
    self.native = undefined
  }
  m.instance = undefined
}

export function useAnotherParentForNativeDom<E>(m: Manifest<E>, render: Render<E>): void {
  const native = m.instance?.native
  if (native) {
    const outer = gParentForNativeDom
    try {
      gParentForNativeDom = m
      render(native)
    }
    finally {
      gParentForNativeDom = outer
    }
  }
}

export function useAnotherParentForReactions<E>(m: Manifest<E>, render: Render<E>): void {
  const native = m.instance?.native
  if (native) {
    const outer = gParentForReactions
    try {
      gParentForReactions = m
      render(native)
    }
    finally {
      gParentForReactions = outer
    }
  }
}

// selfInstance, revision, trace, forAll

export function selfInstance<T>(): { model?: T } {
  const self = gParent.instance
  if (!self)
    throw new Error('instance function can be called only inside rendering function')
  return self as { model?: T }
}

export function selfInstanceInternal<E>(): Instance<E> {
  const self = gParent.instance
  if (!self)
    throw new Error('getMountedInstance function can be called only inside rendering function')
  return self
}

export function selfRevision(): number {
  return gParent.instance?.revision ?? 0
}

export function trace(enabled: boolean, mask: string, regexp: string): void {
  gTrace = enabled ? regexp : undefined
  gTraceMask = mask
}

export function forAll<E>(action: (e: E) => void): void {
  forEachChildRecursively(ROOT, action)
}

// Internal

const EMPTY: Array<Manifest> = []
Object.freeze(EMPTY)

class Instance<E = unknown, O = void> {
  readonly level: number
  revision: number = 0
  native?: E = undefined
  model?: unknown = undefined
  updates: Array<Manifest> | undefined = undefined
  children: ReadonlyArray<Manifest> = EMPTY
  mountedNephews: ReadonlyArray<Manifest> = EMPTY
  reactedNephews: ReadonlyArray<Manifest> = EMPTY
  resizing?: ResizeObserver = undefined

  constructor(level: number) {
    this.level = level
  }

  @reaction @options({ sensitiveArgs: true }) // @noSideEffects(true)
  render(m: Manifest<E, O>): void {
    renderInline(this, m)
    Reactronic.configureCurrentMethod({ order: this.level })
  }
}

function renderInline<E, O>(instance: Instance<E, O>, m: Manifest<E, O>): void {
  instance.revision++
  m.rtti.render ? m.rtti.render(m) : render(m)
}

function callRender(m: Manifest): void {
  const self = m.instance!
  if (m.args === RefreshParent) // inline elements are always rendered
    renderInline(self, m)
  else // rendering of reactive elements is cached to avoid redundant calls
    nonreactive(self.render, m)
}

function callMount(m: Manifest, sibling?: Manifest): Instance {
  // TODO: Make the code below exception-safe
  const rtti = m.rtti
  const self = m.instance = new Instance(m.parent.instance!.level + 1)
  if (rtti.mount)
    rtti.mount(m, sibling)
  else
    self.native = m.parentForNativeDom.instance?.native // default mount
  if (m.args !== RefreshParent)
    Reactronic.setTraceHint(self, Reactronic.isTraceEnabled ? getManifestTraceHint(m) : m.id)
  if (gTrace && gTraceMask.indexOf('m') >= 0 && new RegExp(gTrace, 'gi').test(getManifestTraceHint(m)))
    console.log(`t${Transaction.current.id}v${Transaction.current.timestamp}${'  '.repeat(Math.abs(m.instance!.level))}${getManifestTraceHint(m)}.mounted`)
  return self
}

function callUnmount(m: Manifest, cause: Manifest): void {
  if (gTrace && gTraceMask.indexOf('u') >= 0 && new RegExp(gTrace, 'gi').test(getManifestTraceHint(m)))
    console.log(`t${Transaction.current.id}v${Transaction.current.timestamp}${'  '.repeat(Math.abs(m.instance!.level))}${getManifestTraceHint(m)}.unmounting`)
  if (m.args !== RefreshParent) // TODO: Consider creating one transaction for all un-mounts
    Transaction.runAs({ standalone: true }, () => Reactronic.dispose(m.instance))
  const rtti = m.rtti
  if (rtti.unmount)
    rtti.unmount(m, cause)
  else
    unmount(m, cause) // default unmount
}

function reconcileOrdinaryChildren(m: Manifest): void {
  const self = m.instance
  if (self !== undefined && self.updates !== undefined) {
    const updates = self.updates
    const children = updates.slice().sort(compareManifests)
    self.updates = undefined
    // Unmount or resolve existing
    let sibling: Manifest | undefined = undefined
    let i = 0, j = 0
    while (i < self.children.length) {
      const existing = self.children[i]
      let x = children[j]
      const diff = x !== undefined ? compareManifests(x, existing) : 1
      if (diff <= 0) {
        if (sibling !== undefined && x.id === sibling.id)
          throw new Error(`duplicate id '${sibling.id}' inside '${m.id}'`)
        if (diff === 0) {
          x.instance = existing.instance // reuse existing instance for re-rendering
          if (x.args !== RefreshParent && argsAreEqual(x.args, existing.args))
            x = x.annex = children[j] = existing // skip re-rendering and preserve existing manifest
          i++, j++
        }
        else // diff < 0
          j++ // mount/reorder is performed below
        sibling = x
      }
      else // diff > 0
        callUnmount(existing, existing), i++
    }
    // Mount and render
    sibling = undefined
    for (let x of updates) {
      const existing = x.annex
      x = existing ?? x
      const mounted = x.instance ?? callMount(x, sibling)
      if (mounted.revision > 0) {
        if (x.rtti.reorder)
          x.rtti.reorder(x, sibling)
      }
      x !== existing && callRender(x)
      sibling = x
    }
    self.children = children
  }
}

function reconcileSortedChildren(m: Manifest): void {
  const self = m.instance
  if (self !== undefined && self.updates !== undefined) {
    const updates = self.updates.sort(compareManifests)
    self.updates = undefined
    let sibling: Manifest | undefined = undefined
    let i = 0, j = 0
    while (i < self.children.length || j < updates.length) {
      const existing = self.children[i]
      let x = updates[j]
      const diff = compareNullable(x, existing, compareManifests)
      if (diff <= 0) {
        if (sibling !== undefined && x.id === sibling.id)
          throw new Error(`duplicate id '${sibling.id}' inside '${m.id}'`)
        if (diff === 0) { // diff === 0
          x.instance = existing.instance // reuse existing instance for re-rendering
          if (x.args !== RefreshParent && argsAreEqual(x.args, existing.args))
            x = updates[j] = existing // skip re-rendering and preserve existing manifest
          i++, j++
        }
        else // diff < 0
          callMount(x, sibling), j++
        x !== existing && callRender(x)
        sibling = x
      }
      else // diff > 0
        callUnmount(existing, existing), i++
    }
    self.children = updates
  }
}

function compareManifests(m1: Manifest, m2: Manifest): number {
  return m1.id.localeCompare(m2.id)
}

function compareNullable<T>(a: T | undefined, b: T | undefined, comparer: (a: T, b: T) => number): number {
  let diff: number
  if (b !== undefined)
    diff = a !== undefined ? comparer(a, b) : 1
  else
    diff = a !== undefined ? -1 : 0
  return diff
}

function argsAreEqual(a1: any, a2: any): boolean {
  let result = a1 === a2
  if (!result) {
    if (Array.isArray(a1)) {
      result = Array.isArray(a2) &&
        a1.length === a2.length &&
        a1.every((t, i) => t === a2[i])
    }
    else if (a1 === Object(a1) && a2 === Object(a2)) {
      for (const p in a1) {
        result = a1[p] === a2[p]
        if (!result)
          break
      }
    }
  }
  return result
}

function getManifestTraceHint(m: Manifest): string {
  return `${m.rtti.name}:${m.id}`
}

function forEachChildRecursively(m: Manifest, action: (e: any) => void): void {
  const self = m.instance
  if (self) {
    const native = self.native
    native && action(native)
    self.children.forEach(x => forEachChildRecursively(x, action))
  }
}

const ROOT = new Manifest<any, any>(
  'root',                           // id
  RefreshParent,                    // state
  () => { /* nop */ },              // render
  undefined,                        // override
  { name: 'root', sorting: false }, // rtti
  {} as Manifest,                   // parent (lifecycle)
  {} as Manifest,                   // native parent
  {} as Manifest,                   // reactivity parent
  new Instance(0),                  // instance
)
// Initialize
const ROOT_AS_ANY = ROOT as any
ROOT_AS_ANY['parent'] = ROOT
ROOT_AS_ANY['parentForNativeDom'] = ROOT
ROOT_AS_ANY['parentForReactions'] = ROOT

let gParent: Manifest<any, any> = ROOT
let gParentForNativeDom: Manifest<any, any> = ROOT
let gParentForReactions: Manifest<any, any> = ROOT
let gTrace: string | undefined = undefined
let gTraceMask: string = 'r'
