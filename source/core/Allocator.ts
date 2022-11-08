// The below copyright notice and the license permission notice
// shall be included in all copies or substantial portions.
// Copyright (C) 2019-2022 Nezaboodka Software <contact@nezaboodka.com>
// License: https://raw.githubusercontent.com/nezaboodka/verstak/master/LICENSE
// By contributing, you agree that your contributions will be
// automatically licensed under the license referred above.

import { CellRange, parseCellRange } from "./CellRange"

export enum Alignment {
  Fit = 0,

  TopLeft,     TopCenter,      TopRight,
  MiddleLeft, MiddleCenter, MiddleRight,
  BottomLeft, BottomCenter, BottomRight,

  FitButLeft, FitButCenter, FitButRight,
  FitButTop,
  FitButMiddle,
  FitButBottom,
}

export interface ElasticSize {
  cells?: number                // 1 (grid layout only)
  min?: string                  // min-content
  max?: string                  // min-content
  growth?: number               // 0
}

export interface TrackSize extends ElasticSize {
  track?: string | number       // <current>
}

export interface Bounds {
  place?: string            // ""
  // Width
  widthSpan?: number        // 1 (grid layout only)
  widthMin?: string         // min-content
  widthMax?: string         // min-content
  widthGrow?: number        // 0
  widthOverlap?: boolean    // false
  // Height
  heightSpan?: number       // 1 (grid layout only)
  heightMin?: string        // min-content
  heightMax?: string        // min-content
  heightGrow?: number       // 0
  heightOverlap?: boolean   // false
  // Alignment
  alignment?: Alignment     // MiddleLeft
  boxAlignment?: Alignment  // Fit
  // Flow
  lineBegin?: boolean       // false
  wrap?: boolean            // false
}

export interface Place {
  exact: CellRange | undefined
  wMin: string
  wMax: string
  wGrow: number
  hMin: string
  hMax: string
  hGrow: number
  alignment: Alignment
  boxAlignment: Alignment
}

export class Allocator {
  reset(): void {
    // do nothing
  }

  allocate(bounds: Bounds | undefined): Place | undefined {
    return !bounds ? undefined : {
      exact: undefined,
      wMin: "", wMax: "", wGrow: bounds.widthGrow ?? 0,
      hMin: "", hMax: "", hGrow: bounds.heightGrow ?? 0,
      alignment: bounds.alignment ?? Alignment.TopLeft,
      boxAlignment: bounds.boxAlignment ?? Alignment.Fit,
    }
  }
}

export class GridBasedAllocator implements Allocator {
  private maxColumnCount: number = 0
  private maxRowCount: number = 0
  private actualColumnCount: number = 0
  private actualRowCount: number = 0
  private columnCursor: number = 0
  private rowCursor: number = 0
  private newRowCursor: number = 0

  reset(): void {
    this.maxColumnCount = 0
    this.maxRowCount = 0
    this.actualColumnCount = 0
    this.actualRowCount = 0
    this.columnCursor = 0
    this.rowCursor = 0
    this.newRowCursor = 0
  }

  allocate(bounds: Bounds | undefined): Place | undefined {
    const result: Place = {
      exact: undefined,
      wMin: "", wMax: "", wGrow: 0,
      hMin: "", hMax: "", hGrow: 0,
      alignment: Alignment.TopLeft, boxAlignment: Alignment.Fit,
    }
    const maxColumnCount = this.maxColumnCount !== 0 ? this.maxColumnCount : this.actualColumnCount
    const maxRowCount = this.maxRowCount !== 0 ? this.maxRowCount : this.actualRowCount
    if (bounds?.place) { // absolute positioning
      result.exact = parseCellRange(bounds.place, { x1: 0, y1: 0, x2: 0, y2: 0 })
      absolutizeCellRange(result.exact,
        this.columnCursor + 1, this.rowCursor + 1,
        maxColumnCount, maxRowCount, result.exact)
    }
    else { // relative positioning
      const cr = result.exact = { x1: 0, y1: 0, x2: 0, y2: 0 }
      if (bounds?.lineBegin) {
        this.columnCursor = 0
        this.rowCursor = this.newRowCursor
      }
      // Horizontal
      let w = bounds?.widthSpan ?? 1
      if (w === 0)
        w = maxColumnCount
      if (w >= 0) {
        cr.x1 = this.columnCursor + 1
        cr.x2 = absolutizePosition(cr.x1 + w, 0, maxColumnCount)
        if (!bounds?.widthOverlap)
          this.columnCursor = cr.x2
      }
      else {
        cr.x1 = Math.max(this.columnCursor + w, 1)
        cr.x2 = this.columnCursor
      }
      // Vertical
      let h = bounds?.heightSpan ?? 1
      if (h === 0)
        h = maxRowCount
      if (h >= 0) {
        cr.y1 = this.rowCursor + 1
        cr.y2 = absolutizePosition(cr.y1 + h, 0, maxRowCount)
        if (!bounds?.heightOverlap && cr.y2 > this.newRowCursor)
          this.newRowCursor = cr.y2
      }
      else {
        cr.y1 = Math.max(this.rowCursor + h, 1)
        cr.y2 = this.rowCursor
      }
    }
    return result
  }
}

function absolutizeCellRange(area: CellRange,
  cursorX: number, cursorY: number,
  maxWidth: number, maxHeight: number,
  result: CellRange): CellRange {
  // X1, X2
  const x1 = absolutizePosition(area.x1, cursorX, maxWidth)
  const x2 = absolutizePosition(area.x2, cursorX, maxWidth)
  if (x1 <= x2)
    result.x1 = x1, result.x2 = x2
  else
    result.x1 = x2, result.x2 = x1
  // Y1, Y2
  const y1 = absolutizePosition(area.y1, cursorY, maxHeight)
  const y2 = absolutizePosition(area.y2, cursorY, maxHeight)
  if (y1 <= y2)
    result.y1 = y1, result.y2 = y2
  else
    result.y1 = y2, result.y2 = y1
  return result
}

function absolutizePosition(pos: number, cursor: number, max: number): number {
  if (pos === 0)
    pos = cursor
  else if (pos < 0)
    pos = Math.max(max + pos, 1)
  else
    pos = Math.min(pos, max)
  return pos
}

export function equalPlaces(a: Place | undefined, b: Place | undefined): boolean {
  let result: boolean
  if (a) {
    if (b) {
      result = a.wGrow == b.wGrow
    }
    else
      result = false
  }
  else if (b)
    result = false
  else
    result = true
  return result
}
