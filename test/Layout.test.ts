﻿// The below copyright notice and the license permission notice
// shall be included in all copies or substantial portions.
// Copyright (C) 2019-2022 Nezaboodka Software <contact@nezaboodka.com>
// License: https://raw.githubusercontent.com/nezaboodka/verstak/master/LICENSE
// By contributing, you agree that your contributions will be
// automatically licensed under the license referred above.

import test from "ava"
import { BlockArea } from "../source/core/Interfaces"
import { parseBlockArea, emitBlockArea } from "../source/core/Utils"

function parse(text: string): BlockArea {
  const result: BlockArea = { x1: 0, y1: 0, x2: 0, y2: 0 }
  parseBlockArea(text, result)
  return result
}

function emit(value: BlockArea): string {
  return emitBlockArea(value)
}

test("BlockArea", t => {
  // Parse
  t.deepEqual(parse(""), { x1: 0, y1: 0, x2: 0, y2: 0 })
  t.deepEqual(parse(" "), { x1: 0, y1: 0, x2: 0, y2: 0 })
  t.deepEqual(parse("B2"), { x1: 2, y1: 2, x2: 0, y2: 0 })
  t.deepEqual(parse("B2:C3"), { x1: 2, y1: 2, x2: 3, y2: 3 })
  t.deepEqual(parse("B2:(A1)"), { x1: 2, y1: 2, x2: -1, y2: -1 })
  t.deepEqual(parse("B2:(C3)"), { x1: 2, y1: 2, x2: -3, y2: -3 })
  t.deepEqual(parse("B2:C(3)"), { x1: 2, y1: 2, x2: 3, y2: -3 })
  t.deepEqual(parse("B2:(C)3"), { x1: 2, y1: 2, x2: -3, y2: 3 })
  t.deepEqual(parse("(A1):B(3)"), { x1: -1, y1: -1, x2: 2, y2: -3 })
  t.deepEqual(parse("(A1)"), { x1: -1, y1: -1, x2: 0, y2: 0 })
  t.deepEqual(parse("B(2)"), { x1: 2, y1: -2, x2: 0, y2: 0 })
  t.deepEqual(parse("(B)2"), { x1: -2, y1: 2, x2: 0, y2: 0 })
  t.deepEqual(parse("(A1):B2"), { x1: -1, y1: -1, x2: 2, y2: 2 })
  t.deepEqual(parse("B2 : C3"), { x1: 2, y1: 2, x2: 3, y2: 3 })
  t.deepEqual(parse("( A1 ) : B2"), { x1: -1, y1: -1, x2: 2, y2: 2 })
  // Emit
  t.deepEqual(emit({ x1: 0, y1: 0, x2: 0, y2: 0 }), "")
  t.deepEqual(emit({ x1: 2, y1: 2, x2: 0, y2: 0 }), "B2")
  t.deepEqual(emit({ x1: 2, y1: 2, x2: 3, y2: 3 }), "B2:C3")
  t.deepEqual(emit({ x1: 2, y1: 2, x2: -1, y2: -1 }), "B2:(A1)")
  t.deepEqual(emit({ x1: 2, y1: 2, x2: -3, y2: -3 }), "B2:(C3)")
  t.deepEqual(emit({ x1: 2, y1: 2, x2: 3, y2: -3 }), "B2:C(3)")
  t.deepEqual(emit({ x1: 2, y1: 2, x2: -3, y2: 3 }), "B2:(C)3")
  t.deepEqual(emit({ x1: -1, y1: -1, x2: 2, y2: -3 }), "(A1):B(3)")
  t.deepEqual(emit({ x1: -1, y1: -1, x2: 0, y2: 0 }), "(A1)")
  t.deepEqual(emit({ x1: 2, y1: -2, x2: 0, y2: 0 }), "B(2)")
  t.deepEqual(emit({ x1: -2, y1: 2, x2: 0, y2: 0 }), "(B)2")
  t.deepEqual(emit({ x1: -1, y1: -1, x2: 2, y2: 2 }), "(A1):B2")
})
