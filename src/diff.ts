import { LyderElement, componentMap, LyderKey, Arrayable, renderFunctionComponent } from "./lyder";
import { isFunctionComponent, isFragment, isDomElement, wrapArray, getComponentName } from "./utils";

export function renderDiff(root: LyderElement<string>, old?: LyderElement | null, current?: LyderElement | null) {
    if (old == null && current == null) {
        return;
    }

    if (old == null) {
        insertElement(root, current!);
        return;
    }

    if (current == null) {
        detachElement(old);
        return;
    }

    if (areElementsSame(old, current)) {
        if (isFunctionComponent(current)) {
            current.symbol = old.symbol;
            current.domParent = old.domParent;
            const oldTree = wrapArray(componentMap.get(current.symbol!)!.cache);
            const currentTree = wrapArray(renderFunctionComponent(root, current));
            matchElements(oldTree, currentTree).forEach(([o, c]) => renderDiff(root, o, c));
        } else if (isFragment(current)) {
            if (!current.props.internal && current.props.children!.some(c => c.key == null)) {
                console.error("All elements in a list should have a unique key prop assigned to them. Not assigning a key prop can lead to unexpected behaviour and degraded performance.");
            }

            matchElements(old.props.children!, current.props.children!).forEach(([o, c]) => renderDiff(root, o, c));
        } else {
            current.domRef = old.domRef!;

            if (current.props.children) {
                copyPropertiesToHtmlElement(current as LyderElement<string>, current.domRef as HTMLElement);
                matchElements(old.props.children!, current.props.children).forEach(([o, c]) => renderDiff(current as LyderElement<string>, o, c));
            } else if (old.props.value !== current.props.value) {
                current.domRef.nodeValue = current.props.value;
            }
        }
    } else {
        detachElement(old);
        insertElement(root, current);
    }
}

function detachElement(element: LyderElement) {
    if (isFunctionComponent(element)) {
        const data = componentMap.get(element.symbol!)!.cache;
        wrapArray(data).forEach(e => detachElement(e));
    } else if (isFragment(element)) {
        element.props.children!.forEach((c: LyderElement) => detachElement(c));
    } else {
        element.domRef!.parentElement?.removeChild(element.domRef!);
    }
}

function matchElements(old: LyderElement[], current: LyderElement[]): [LyderElement?, LyderElement?][] {
    const unmatched = [...old];
    const result: [LyderElement?, LyderElement?][] = [];

    const keys = current.filter(c => c.key != null).length;
    if (keys !== 0 && keys !== current.length) {
        console.error("All elements in a list should have a unique key prop assigned to them. Assigning keys to only some elements in a list can lead to unexpected behaviour.");
    }

    const keysSeen: LyderKey[] = [];
    current.forEach(c => {
        if (c.key != null) {
            if (keysSeen.includes(c.key)) {
                console.error(`All elements in a list should have a unique key prop assigned to them. Found duplicate key '${c.key}' on ${getComponentName(c)} element.`);
            }
            keysSeen.push(c.key);

            const match = unmatched.findIndex(o => o.key === c.key);
            if (match !== -1) {
                result.push([unmatched.splice(match, 1)[0], c]);
            } else {
                result.push([undefined, c]);
            }
        } else {
            result.push([unmatched.shift(), c]);
        }
    });

    result.push(...unmatched.map(o => [o] as [LyderElement]));
    return result;
}

function insertElement(root: LyderElement<string>, element: LyderElement) {
    const rootDom = root.domRef as HTMLElement;

    if (rootDom.childNodes.length === 0) {
        wrapArray(toHtmlNode(root, element)).forEach(e => rootDom.appendChild(e));
        return;
    }

    const children = typeof root.props.children === "symbol" ? wrapArray(componentMap.get(root.props.children)?.cache) : root.props.children!;
    const elementsBefore = children.slice(0, children.findIndex(c => containsComponentInCache(c, element)));
    let index = elementsBefore.map(c => getComponentCachedSize(c)).reduce((a, b) => a + b, 0);
    wrapArray(toHtmlNode(root, element)).forEach(e => insertElementAtIndex(rootDom, e, index++));
}

function areElementsSame(a: LyderElement, b: LyderElement): boolean {
    return a.type === b.type;
}

function insertElementAtIndex(parent: HTMLElement, child: Node, index: number) {
    if (index > parent.childNodes.length) {
        throw Error("Invalid index.");
    } else if (index === parent.childNodes.length) {
        parent.appendChild(child)
    } else {
        parent.insertBefore(child, parent.childNodes[index])
    }
}

function getComponentCachedSize(element: LyderElement): number {
    if (isFunctionComponent(element)) {
        return wrapArray(componentMap.get(element.symbol!)!.cache).map(c => getComponentCachedSize(c)).reduce((a, b) => a + b, 0);
    } else if (isFragment(element)) {
        return element.props.children!.map(c => getComponentCachedSize(c)).reduce((a, b) => a + b, 0);
    }

    return 1;
}

function containsComponentInCache(container: LyderElement, element: LyderElement): boolean {
    if (container === element) {
        return true;
    }

    if (isFunctionComponent(container)) {
        return wrapArray(componentMap.get(container.symbol!)!.cache).some(c => containsComponentInCache(c, element));
    } else if (isFragment(container) || isDomElement(container)) {
        return container.props.children!.some(c => containsComponentInCache(c, element));
    }

    return false;
}

function copyPropertiesToHtmlElement(element: LyderElement<string>, domElement: HTMLElement) {
    Object.keys(element.props).filter(k => k !== "children" && (domElement as any)[k] !== element.props[k]).forEach(k => (domElement as any)[k] = element.props[k]);
}

function toHtmlNode(root: LyderElement<string>, element: LyderElement): Arrayable<Node> {
    if (isFunctionComponent(element)) {
        return wrapArray(renderFunctionComponent(root, element)).flatMap(e => toHtmlNode(root, e));
    }

    if (isDomElement(element)) {
        const domElement = document.createElement(element.type);
        copyPropertiesToHtmlElement(element, domElement);
        element.domRef = domElement;
        domElement.replaceChildren(...element.props.children!.flatMap(c => toHtmlNode(element, c)));
        return domElement;
    }

    if (isFragment(element)) {
        return element.props.children!.flatMap(c => toHtmlNode(root, c));
    }

    const domNode = document.createTextNode(element.props.value);
    element.domRef = domNode;
    return domNode;
}