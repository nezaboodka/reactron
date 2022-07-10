// The below copyright notice and the license permission notice
// shall be included in all copies or substantial portions.
// Copyright (C) 2019-2022 Yury Chetyrko <ychetyrko@gmail.com>
// MIT License: https://raw.githubusercontent.com/nezaboodka/reactronic-dom/master/LICENSE
// By contributing, you agree that your contributions will be
// automatically licensed under the license referred above.

export type GetKey<T = unknown> = (item: T) => string | undefined

export interface MergerApi<T> {
  readonly count: number
  actual(): Generator<MergerItem<T>>
  removed(keep?: boolean): Generator<MergerItem<T>>
  isAdded(item: MergerItem<T>): boolean
  isMoved(item: MergerItem<T>): boolean
  isRemoved(item: MergerItem<T>): boolean
  isActual(item: MergerItem<T>): boolean
  readonly isMerging: boolean
  beginMerge(): void
  tryMergeAsExisting(key: string): MergerItem<T> | undefined
  mergeAsNew(self: T): MergerItem<T>
  endMerge(keepRemoved?: boolean): void
}

export interface MergerItem<T> {
  readonly self: T
  next?: MergerItem<T>
  prev?: MergerItem<T>
}

export class Merger<T> implements MergerApi<T> {
  readonly getKey: GetKey<T>
  readonly strict: boolean
  private map = new Map<string | undefined, MergerItemImpl<T>>()
  private cycle: number = ~0
  private strictNext?: MergerItemImpl<T> = undefined
  private firstActual?: MergerItemImpl<T> = undefined
  private lastActual?: MergerItemImpl<T> = undefined
  private actualCount: number = 0
  private firstOld?: MergerItemImpl<T> = undefined
  private oldCount: number = 0

  constructor(getKey: GetKey<T>, strict: boolean) {
    this.getKey = getKey
    this.strict = strict
  }

  get isMerging(): boolean {
    return this.cycle > 0
  }

  get count(): number {
    return this.actualCount
  }

  actual(): Generator<MergerItem<T>> {
    return createIterator(this.firstActual)
  }

  removed(keep?: boolean): Generator<MergerItem<T>> {
    const result = createIterator(this.firstOld)
    if (keep === undefined || !keep) {
      this.firstOld = undefined
      this.oldCount = 0
    }
    return result
  }

  isAdded(item: MergerItem<T>): boolean {
    const t = item as MergerItemImpl<T>
    let cycle = this.cycle
    if (cycle < 0)
      cycle = ~cycle
    return t.status === ~cycle && t.cycle > 0
  }

  isMoved(item: MergerItem<T>): boolean {
    const t = item as MergerItemImpl<T>
    let cycle = this.cycle
    if (cycle < 0)
      cycle = ~cycle
    return t.status === cycle && t.cycle > 0
  }

  isRemoved(item: MergerItem<T>): boolean {
    const t = item as MergerItemImpl<T>
    const cycle = this.cycle
    return cycle > 0 ? t.cycle < cycle : t.cycle < cycle - 1
  }

  isActual(item: MergerItem<T>): boolean {
    const t = item as MergerItemImpl<T>
    return t.cycle === this.cycle
  }

  beginMerge(): void {
    if (this.isMerging)
      throw new Error('merge is not reentrant')
    this.cycle = ~this.cycle + 1
    this.firstOld = this.firstActual
    this.oldCount = this.actualCount
    this.strictNext = this.firstOld
    this.firstActual = this.lastActual = undefined
    this.actualCount = 0
  }

  endMerge(keepRemoved?: boolean): void {
    if (!this.isMerging)
      throw new Error('merge is ended already')
    this.cycle = ~this.cycle
    const mergedCount = this.actualCount
    if (mergedCount > 0) {
      const getKey = this.getKey
      if (mergedCount > this.oldCount) { // it should be faster to delete vanished items
        const map = this.map
        let item = this.firstOld
        while (item !== undefined) {
          map.delete(getKey(item.self))
          item = item.next
        }
      }
      else { // it should be faster to recreate map using merging items
        const map = this.map = new Map<string | undefined, MergerItemImpl<T>>()
        let item = this.firstActual
        while (item !== undefined) {
          map.set(getKey(item.self), item)
          item = item.next
        }
      }
    }
    else // just create new empty map
      this.map = new Map<string | undefined, MergerItemImpl<T>>()
    if (keepRemoved === undefined || !keepRemoved) {
      this.firstOld = undefined
      this.oldCount = 0
    }
  }

  tryMergeAsExisting(key: string): MergerItem<T> | undefined {
    const cycle = this.cycle
    let item = this.strictNext
    let k = item ? this.getKey(item.self) : undefined
    if (k !== key) {
      item = this.map.get(key)
      k = item ? this.getKey(item.self) : undefined
    }
    if (item && k !== undefined) {
      if (item.cycle === cycle)
        throw new Error(`duplicate item id: ${key}`)
      item.cycle = cycle
      if (this.strict && item !== this.strictNext)
        item.status = cycle // IsAdded=false, IsMoved=true
      this.strictNext = item.next
      // Exclude from old sequence
      if (item.prev !== undefined)
        item.prev.next = item.next
      if (item.next !== undefined)
        item.next.prev = item.prev
      if (item === this.firstOld)
        this.firstOld = item.next
      this.oldCount--
      // Include into merged sequence
      const last = this.lastActual
      item.prev = last
      item.next = undefined
      if (last)
        this.lastActual = last.next = item
      else
        this.firstActual = this.lastActual = item
      this.actualCount++
    }
    return item
  }

  mergeAsNew(self: T): MergerItem<T> {
    const item = new MergerItemImpl<T>(self, this.cycle)
    this.map.set(this.getKey(self), item)
    this.strictNext = undefined
    const last = this.lastActual
    if (last) {
      item.prev = last
      this.lastActual = last.next = item
    }
    else
      this.firstActual = this.lastActual = item
    this.actualCount++
    return item
  }

  markAsMoved(item: MergerItem<T>): void {
    const t = item as MergerItemImpl<T>
    if (t.cycle > 0) // if not removed, > is intentional
      t.status = t.cycle
  }

  static createMergerItem<T>(self: T): MergerItem<T> {
    return new MergerItemImpl(self, 0)
  }
}

class MergerItemImpl<T> implements MergerItem<T> {
  readonly self: T
  cycle: number
  status: number
  next?: MergerItemImpl<T> = undefined
  prev?: MergerItemImpl<T> = undefined

  constructor(self: T, cycle: number) {
    this.self = self
    this.cycle = cycle
    this.status = ~cycle // IsAdded=true
  }
}

function *createIterator<T>(first: MergerItem<T> | undefined): Generator<MergerItem<T>> {
  while (first !== undefined) {
    const next = first.next
    yield first
    first = next
  }
}
