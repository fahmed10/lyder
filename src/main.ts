import { createElement, createRoot, Fragment, LyderElement, LyderKey, LyderRenderable, useState } from "./lyder";

export default { createRoot, createElement, useState, Fragment };
export { createRoot, createElement, useState, Fragment } from "./lyder";
export type { LyderElement, LyderKey, LyderRenderable } from "./lyder";

declare global {
    namespace Lyder {
        namespace JSX {
            export interface IntrinsicAttributes {
                key?: LyderKey;
                [key: string]: any;
            }

            export interface IntrinsicElements {
                [key: string]: any;
            }

            export type Element = LyderRenderable;
            export type ElementClass = LyderElement;

            export interface ElementAttributesProperty {
                props: any;
            }

            export interface ElementChildrenAttribute {
                children: any;
            }
        }
    }
}