import { Arrayable, componentMap, createElement, createRoot, LyderElement, useState } from "../lyder";
import { queryByText } from '@testing-library/dom';
import '@testing-library/jest-dom';

beforeEach(() => componentMap.clear());

function renderRoot(root: Arrayable<LyderElement>): HTMLElement {
    const container = document.createElement("div")!;
    document.body.appendChild(container);
    createRoot(container).render(root);
    return container;
}

it("Creates root properly", () => {
    const root = renderRoot(createElement("p", null, "Test Text"));
    expect(queryByText(root, "Test Text")).toBeInTheDocument();
});

it("Inserts element at root correctly", () => {
    let state, setState;

    function App() {
        [state, setState] = useState(0);

        return Array(state).fill(0).map((_, i) => createElement("p", null, `Test Item ${i}`));
    }

    const root = renderRoot(createElement(App));
    expect(root).toBeEmptyDOMElement();
    setState!(1);
    expect(queryByText(root, "Test Item 0")).toBeInTheDocument();
    setState!(2);
    expect(queryByText(root, "Test Item 0")).toBeInTheDocument();
    expect(queryByText(root, "Test Item 1")).toBeInTheDocument();
    expect(Object.values(root.children)).toEqual([queryByText(root, "Test Item 0"), queryByText(root, "Test Item 1")]);
});

it("Inserts element in child correctly", () => {
    let state, setState;

    function App() {
        [state, setState] = useState(0);

        return createElement("div", null, Array(state).fill(0).map((_, i) => createElement("p", null, `Test Item ${i}`)));
    }

    const root = renderRoot(createElement(App));
    expect(root.children[0]).toBeEmptyDOMElement();
    setState!(1);
    expect(queryByText(root, "Test Item 0")).toBeInTheDocument();
    setState!(2);
    expect(queryByText(root, "Test Item 0")).toBeInTheDocument();
    expect(queryByText(root, "Test Item 1")).toBeInTheDocument();
    expect(Object.values(root.children[0].children)).toEqual([queryByText(root, "Test Item 0"), queryByText(root, "Test Item 1")]);
});

it("Inserts element in middle at root correctly", () => {
    let state, setState;

    function App() {
        [state, setState] = useState(["Test A", "Test C"]);

        return state.map(text => createElement("p", null, text));
    }

    const root = renderRoot(createElement(App));
    expect(Object.values(root.children)).toEqual([queryByText(root, "Test A"), queryByText(root, "Test C")]);
    setState!(["Test A", "Test B", "Test C"]);
    expect(Object.values(root.children)).toEqual([queryByText(root, "Test A"), queryByText(root, "Test B"), queryByText(root, "Test C")]);
});

it("Inserts element in middle in child correctly", () => {
    let state, setState;

    function App() {
        [state, setState] = useState(["Test A", "Test C"]);

        return createElement("div", null, state.map(text => createElement("p", null, text)));
    }

    const root = renderRoot(createElement(App));
    expect(Object.values(root.children[0].children)).toEqual([queryByText(root, "Test A"), queryByText(root, "Test C")]);
    setState!(["Test A", "Test B", "Test C"]);
    expect(Object.values(root.children[0].children)).toEqual([queryByText(root, "Test A"), queryByText(root, "Test B"), queryByText(root, "Test C")]);
});

it("Updates element text correctly", () => {
    let state: string, setState: (text: string) => void;

    function App() {
        [state, setState] = useState("Test Text");

        return createElement("div", null, createElement("p", null, state));
    }

    const root = renderRoot(createElement(App));
    expect(queryByText(root, "Test Text")).toBeInTheDocument();
    setState!("New Text");
    expect(queryByText(root, "New Text")).toBeInTheDocument();
});

it("Updates element props correctly", () => {
    let state: string, setState: (text: string) => void;

    function App() {
        [state, setState] = useState("http://localhost/#test");

        return createElement("div", null, createElement("a", { href: state }, "Test Text"));
    }

    const root = renderRoot(createElement(App));
    expect(queryByText(root, "Test Text")).toHaveProperty("href", "http://localhost/#test");
    setState!("http://localhost/#newHref");
    expect(queryByText(root, "Test Text")).toHaveProperty("href", "http://localhost/#newHref");
});

it("Deletes element at root correctly", () => {
    let state, setState;

    function App() {
        [state, setState] = useState(2);

        return Array(state).fill(0).map((_, i) => createElement("p", null, `Test Item ${i}`));
    }

    const root = renderRoot(createElement(App));
    expect(Object.values(root.children)).toEqual([queryByText(root, "Test Item 0"), queryByText(root, "Test Item 1")]);
    setState!(1);
    expect(Object.values(root.children)).toEqual([queryByText(root, "Test Item 0")]);
    setState!(0);
    expect(root).toBeEmptyDOMElement();
});

it("Deletes element in child correctly", () => {
    let state, setState;

    function App() {
        [state, setState] = useState(2);

        return createElement("div", null, Array(state).fill(0).map((_, i) => createElement("p", null, `Test Item ${i}`)));
    }

    const root = renderRoot(createElement(App));
    expect(Object.values(root.children[0].children)).toEqual([queryByText(root, "Test Item 0"), queryByText(root, "Test Item 1")]);
    setState!(1);
    expect(Object.values(root.children[0].children)).toEqual([queryByText(root, "Test Item 0")]);
    setState!(0);
    expect(root.children[0]).toBeEmptyDOMElement();
});