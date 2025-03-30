import { LyderElement, FunctionComponent, Arrayable, FRAGMENT_SYMBOL, LyderRenderable, LyderKey } from "./lyder";

export function isFunctionComponent(component: LyderElement): component is LyderElement<FunctionComponent> {
    return typeof component.type === "function";
}

export function isFragment(component: LyderElement): component is LyderElement<typeof FRAGMENT_SYMBOL> {
    return component.type === FRAGMENT_SYMBOL;
}

export function isDomElement(component: LyderElement): component is LyderElement<string> {
    return typeof component.type === "string";
}

export function wrapArray<T>(value?: Arrayable<T> | null): T[] {
    value ??= [];
    return Array.isArray(value) ? value : [value];
}

export function wrapElements(value?: Arrayable<LyderElement> | null): LyderElement | null | undefined {
    return Array.isArray(value) ? wrapFragment(value) : value;
}

export function wrapFragment(value: Arrayable<LyderElement> | null | undefined, key?: LyderKey, internal: boolean = true): LyderElement<typeof FRAGMENT_SYMBOL> {
    return { type: FRAGMENT_SYMBOL, props: { children: wrapArray(value), internal }, key };
}

export function isLyderElement(value: LyderRenderable): value is LyderElement {
    return value != null && typeof value === "object" && value.hasOwnProperty("type");
}

export function getComponentName(element: LyderElement): string {
    if (isFunctionComponent(element)) {
        return `<${element.type.name}>`;
    } else if (isFragment(element)) {
        return "<Fragment>";
    } else if (isDomElement(element)) {
        return `<${element.type}>`;
    }

    return "#text";
}