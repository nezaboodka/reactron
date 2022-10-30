// The below copyright notice and the license permission notice
// shall be included in all copies or substantial portions.
// Copyright (C) 2019-2022 Nezaboodka Software <contact@nezaboodka.com>
// License: https://raw.githubusercontent.com/nezaboodka/verstak/master/LICENSE
// By contributing, you agree that your contributions will be
// automatically licensed under the license referred above.

import { Block, Render, BlockFactory, BlockOptions } from './Block'

export function Reaction<T = undefined, M = unknown, P = void, R = void>(
  name: string, options: BlockOptions<P> | undefined,
  renderer: Render<T, M, P, R>, factory?: BlockFactory<T>): Block<T, M, P, R> {
  return Block.claim(name, false, options, renderer, factory)
}

export function Inline<T = undefined, M = unknown, P = void, R = void>(
  name: string, options: BlockOptions<P> | undefined,
  renderer: Render<T, M, P, R>, factory?: BlockFactory<T>): Block<T, M, P, R> {
  return Block.claim(name, true, options, renderer, factory)
}
