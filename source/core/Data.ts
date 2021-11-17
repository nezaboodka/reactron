// The below copyright notice and the license permission notice
// shall be included in all copies or substantial portions.
// Copyright (C) 2019-2021 Yury Chetyrko <ychetyrko@gmail.com>
// MIT License: https://raw.githubusercontent.com/nezaboodka/reactronic-front/master/LICENSE
// By contributing, you agree that your contributions will be
// automatically licensed under the license referred above.

export type Render<E = unknown, O = void> = (element: E, options: O) => void
export type SuperRender<O = unknown, E = void> = (render: (options: O) => O, element: E) => void
export const RefreshParent = Symbol('RefreshParent') as unknown as void

export interface Rtti<E = unknown, O = void> {
  readonly name: string
  readonly unordered: boolean
  initialize?(ni: NodeInfo<E, O>): void
  place?(ni: NodeInfo<E, O>, sibling?: NodeInfo): void
  render?(ni: NodeInfo<E, O>): void
  finalize?(ni: NodeInfo<E, O>, cause: NodeInfo): void
}

export interface AbstractInstance<E = unknown, O = void> {
  readonly level: number
  revision: number
  native?: E
  model?: unknown
  buffer: Array<NodeInfo<any, any>> | undefined
  children: ReadonlyArray<NodeInfo<any, any>>
  nephews: ReadonlyArray<NodeInfo<any, any>>
  resizing?: ResizeObserver

  render(ni: NodeInfo<E, O>): void
}

export class NodeInfo<E = unknown, O = void> {
  old?: NodeInfo<E, O> = undefined
  get native(): E | undefined { return this.instance?.native }

  constructor(
    readonly id: string,
    readonly args: unknown,
    readonly render: Render<E, O>,
    readonly superRender: SuperRender<O, E> | undefined,
    readonly rtti: Rtti<E, O>,
    readonly parent: NodeInfo,
    readonly renderingParent: NodeInfo,
    readonly reactivityParent: NodeInfo,
    public instance?: AbstractInstance<E, O>) {
  }
}