import { PluginObj } from "@babel/core";
import * as AST from "@babel/types";

function isSpecialIdentifier(expression: AST.Expression | AST.LVal): expression is AST.Identifier {
    return expression.type === "Identifier" && expression.name.startsWith('$');
}

function getStateSetter(name: string): AST.Identifier {
    return AST.identifier(`__set_${name}`);
}

function getStateGetter(name: string): AST.Identifier {
    return AST.identifier(`__${name}`);
}

export default function (): PluginObj {
    return {
        visitor: {
            VariableDeclaration(path) {
                if (path.node.kind !== "let") {
                    path.skip();
                }
            },
            VariableDeclarator(path) {
                if (!isSpecialIdentifier(path.node.id)) {
                    return;
                }

                const name = path.node.id.name;

                path.replaceWith(
                    AST.variableDeclarator(
                        AST.arrayPattern([
                            getStateGetter(name),
                            getStateSetter(name)
                        ]),
                        AST.callExpression(
                            AST.memberExpression(AST.identifier("Lyder"), AST.identifier("useState")),
                            [path.node.init ?? AST.identifier("undefined")]
                        )
                    )
                );
            },
            Identifier(path) {
                if (!isSpecialIdentifier(path.node)) {
                    return;
                }

                path.replaceWith(getStateGetter(path.node.name));
            },
            AssignmentExpression(path) {
                if (!isSpecialIdentifier(path.node.left)) {
                    return;
                }

                const name = path.node.left.name;

                if (path.node.operator === "=") {
                    path.replaceWith(
                        AST.callExpression(getStateSetter(name), [path.node.right])
                    );
                } else {
                    path.replaceWith(
                        AST.callExpression(getStateSetter(name), [
                            AST.binaryExpression(path.node.operator[0] as any, getStateGetter(name), path.node.right)
                        ])
                    );
                }
            },
            UpdateExpression(path) {
                if (!isSpecialIdentifier(path.node.argument)) {
                    return;
                }

                const name = path.node.argument.name;

                path.replaceWith(
                    AST.callExpression(getStateSetter(name), [
                        AST.binaryExpression(path.node.operator[0] as any, getStateGetter(name), AST.numericLiteral(1))
                    ])
                );
            }
        },
    };
}