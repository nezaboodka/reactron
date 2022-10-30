// The below copyright notice and the license permission notice
// shall be included in all copies or substantial portions.
// Copyright (C) 2019-2022 Nezaboodka Software <contact@nezaboodka.com>
// License: https://raw.githubusercontent.com/nezaboodka/verstak/master/LICENSE
// By contributing, you agree that your contributions will be
// automatically licensed under the license referred above.

import { VerstakNode, Render, Place, Reaction, Inline, VerstakOptions } from '../core/api'
import { Div, RxDiv } from './HtmlElements'

export interface ElasticSize {
  line: string | number
  min?: string // undefined means min-content
  max?: string
  growth?: number
}

export function Block<M = unknown, R = void>(name: string,
  options: VerstakOptions<Place> | undefined,
  renderer: Render<HTMLDivElement, M, Place, R>):
  VerstakNode<HTMLDivElement, M, Place, R> {
  return Div(name, options, renderer)
}

export function RxBlock<M = unknown, R = void>(name: string,
  options: VerstakOptions<Place> | undefined,
  renderer: Render<HTMLDivElement, M, Place, R>):
  VerstakNode<HTMLDivElement, M, Place, R> {
  return RxDiv(name, options, renderer)
}

export function Cluster<M = unknown, R = void>(name: string,
  options: VerstakOptions | undefined,
  renderer: Render<HTMLDivElement, M, void, R>):
  VerstakNode<HTMLDivElement, M, void, R> {
  return Inline(name, options, renderer)
}

export function RxCluster<M = unknown, R = void>(name: string,
  options: VerstakOptions | undefined,
  renderer: Render<HTMLDivElement, M, void, R>):
  VerstakNode<HTMLDivElement, M, void, R> {
  return Reaction(name, options, renderer)
}
