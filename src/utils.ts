import { LyderElement, FunctionComponent, Arrayable, FRAGMENT_SYMBOL } from "./lyder";

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