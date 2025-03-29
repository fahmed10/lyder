import { renderDiff } from "./diff";
import { getComponentName, isFunctionComponent, wrapArray } from "./utils";

export type Arrayable<T> = T | T[];
export type FunctionComponent = (props: any) => LyderRenderable;
export type LyderRenderable = Arrayable<LyderElement> | string | number | bigint | boolean | null | undefined;
export type LyderKey = string | number | bigint | null | undefined;

export interface LyderElement<T = string | Symbol | FunctionComponent> {
    type: T;
    props: { children?: LyderElement[], internal?: boolean, value?: any, [name: string]: any };
    key?: LyderKey;
    domRef?: Node;
    domParent?: LyderElement<string>;
    symbol?: Symbol;
}

interface FunctionComponentData {
    instance: LyderElement<FunctionComponent>;
    state: any[];
    cache?: Arrayable<LyderElement> | null;
    hooksCalled?: number;
}

let currentStateIndex = -1;
let hooksCalled = 0;
let componentStateChanged = false;
let componentRerenders = 0;
let renderingComponent: Symbol | null = null;
export const componentMap: Map<Symbol, FunctionComponentData> = new Map();
const MAX_COMPONENT_RERENDERS = 10;
export const NODE_SYMBOL = Symbol("lyder.node");
export const FRAGMENT_SYMBOL = Symbol("lyder.fragment");
export const Fragment = ({ children, key }: { children?: LyderElement[], key?: LyderKey }) => wrapFragment(children, key, false);

export function createRoot(container: HTMLElement) {
    if (!container) {
        throw Error("Container passed to createRoot is null.");
    }

    return { render: (root: LyderElement) => render(container, root) };
}

function render(container: HTMLElement, root: LyderElement) {
    let children = null;

    if (isFunctionComponent(root)) {
        children = initializeFunctionalComponent(root) as any;
        root.symbol = children;
    }

    renderDiff({ type: container.tagName, props: { children }, domRef: container }, null, root);
}

export function createElement(type: string | FunctionComponent, props: any = null, ...children: LyderRenderable[]): LyderElement {
    if (typeof type === "string") {
        type = type.toUpperCase();
    } else if (typeof type !== "function") {
        throw Error(`Invalid component type passed to createElement. Component types must be a string or function, but got '${(type as any).toString()}' instead.`);
    }

    while (children.length === 1 && Array.isArray(children[0])) {
        children = children[0];
    }

    props ??= {};
    const key = props.key;
    delete props.key;
    props.children = children.map(c => nodeToElement(c));

    return { type, props, key };
}

export function useState<T>(defaultValue?: T): [T, (value: T) => void] {
    hooksCalled++;
    currentStateIndex++;
    // Capture current state index to use in state setter closure.
    const capturedStateIndex = currentStateIndex;
    const component = componentMap.get(getRenderingComponent())!;
    component.state[currentStateIndex] ??= defaultValue;

    return [component.state[currentStateIndex], (value: T) => {
        if (Object.is(component.state[capturedStateIndex], value)) {
            return;
        }

        component.state[capturedStateIndex] = value;

        if (renderingComponent) {
            if (component.instance.symbol !== renderingComponent) {
                console.error("While rendering, state setter functions can only be called from the component they belong to.");
                return;
            }

            componentStateChanged = true;
            return;
        }

        const cache = wrapElements(component.cache);
        const result = wrapElements(renderFunctionComponent(component.instance.domParent!, component.instance));
        renderDiff(component.instance.domParent!, cache, result);
    }];
}

function wrapElements(value?: Arrayable<LyderElement> | null): LyderElement | null | undefined {
    return Array.isArray(value) ? wrapFragment(value) : value;
}

function wrapFragment(value: Arrayable<LyderElement> | null | undefined, key?: LyderKey, internal: boolean = true): LyderElement<typeof FRAGMENT_SYMBOL> {
    return { type: FRAGMENT_SYMBOL, props: { children: wrapArray(value), internal }, key };
}

function nodeToElement(node: LyderRenderable) {
    if (typeof node === "boolean") {
        return null;
    }

    if (typeof node === "object" || node == null) {
        return node;
    }

    return { type: NODE_SYMBOL, props: { value: node.toString() } };
}

function getRenderingComponent(): Symbol {
    if (!renderingComponent) {
        throw Error("Invalid hook call. Hooks can only be called inside of functional components.");
    }

    return renderingComponent;
}

export function renderFunctionComponent(domParent: LyderElement<string>, component: LyderElement<FunctionComponent>): Arrayable<LyderElement> {
    component.domParent = domParent;
    renderingComponent = component.symbol ?? null;

    if (!componentMap.has(renderingComponent!)) {
        component.symbol = initializeFunctionalComponent(component);
        renderingComponent = component.symbol;
    }

    const componentData = componentMap.get(renderingComponent!)!;
    componentRerenders = 0;
    let element;

    do {
        componentStateChanged = false;
        hooksCalled = 0;
        currentStateIndex = -1;
        element = nodeToElement(component.type(component.props));
        componentRerenders++;

        if (componentData.hooksCalled !== undefined && hooksCalled != componentData.hooksCalled) {
            console.error(`The number of hooks called by component ${getComponentName(component)} has changed between renders.`);
        }

        componentData.hooksCalled = hooksCalled;

        if (componentRerenders > MAX_COMPONENT_RERENDERS) {
            console.error("You are calling a state setter function on every render, causing an infinite loop. Setting state while rendering should only be done conditionally.");
            break;
        }
    } while (componentStateChanged);

    renderingComponent = null;
    componentData.cache = element;
    return element ?? [];
}

function initializeFunctionalComponent(component: LyderElement<FunctionComponent>): Symbol {
    const symbol = Symbol(`<${component.type.name}>`);
    componentMap.set(symbol, { instance: component, state: [] });
    return symbol;
}