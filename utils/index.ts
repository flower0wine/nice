import generate from "@babel/generator";
import * as parser from "@babel/parser";
import traverse from "@babel/traverse";
import * as t from "@babel/types";

// 解析和修改代码的函数
export function parseAndModifyCode(code: string) {
  if (!code) {
    return "";
  }

  try {
    const ast = parser.parse(code, {
      sourceType: "unambiguous", // 自动检测模块类型
      plugins: [
        "jsx",
        "typescript",
        "decorators",
        "classProperties",
        "dynamicImport"
      ]
    });

    traverse(ast, {
      Import(path) {
        // 处理动态导入
        const parent = path.parentPath;
        if (parent.isCallExpression()) {
          parent.replaceWith(
            t.callExpression(t.identifier("Promise.resolve"), [
              t.objectExpression([])
            ])
          );
        }
      },

      // 处理函数声明
      FunctionDeclaration(path) {
        if (path.node.id && path.node.id.name === "detectDevTools") {
          // 获取函数体
          const body = path.node.body;
          if (t.isBlockStatement(body)) {
            // 在函数体开头插入 return 语句
            body.body.unshift(t.returnStatement());
          }
        }
      },

      // 处理函数表达式（包括箭头函数）
      FunctionExpression(path) {
        if (
          path.parent &&
          t.isVariableDeclarator(path.parent) &&
          t.isIdentifier(path.parent.id) &&
          path.parent.id.name === "detectDevTools"
        ) {
          const body = path.node.body;
          if (t.isBlockStatement(body)) {
            body.body.unshift(t.returnStatement());
          }
        }
      },

      DebuggerStatement(path) {
        path.remove();
      },

      CallExpression: {
        enter(path) {
          // 首先确保节点是有效的
          if (!path.node) {
            return;
          }

          // 检查 callee 是否存在
          const callee = path.node.callee;
          if (!callee) {
            return;
          }

          // 处理 setInterval
          if (t.isIdentifier(callee)) {
            if (callee.name === "setInterval") {
              const args = path.node.arguments;
              if (args && args.length > 0) {
                const functionArg = args[0];
                if (
                  t.isIdentifier(functionArg) &&
                  functionArg.name === "detectDevTools"
                ) {
                  path.remove();
                }
              }
            }
            return; // 如果是普通标识符，提前返回
          }

          // 处理 addEventListener
          if (t.isMemberExpression(callee)) {
            // 确保 property 存在且是标识符
            if (!callee.property || !t.isIdentifier(callee.property)) {
              return;
            }

            if (callee.property.name === "addEventListener") {
              const args = path.node.arguments;
              if (!args || args.length < 2) {
                return;
              }

              const [eventType, handler] = args;

              // 处理右键菜单事件
              if (
                t.isStringLiteral(eventType) &&
                eventType.value === "contextmenu"
              ) {
                if (
                  t.isFunctionExpression(handler) ||
                  t.isArrowFunctionExpression(handler)
                ) {
                  // 使用新的作用域遍历处理函数体
                  const handlerTraverse = {
                    CallExpression(handlerPath) {
                      const handlerCallee = handlerPath.node.callee;
                      if (
                        !handlerCallee ||
                        !t.isMemberExpression(handlerCallee)
                      ) {
                        return;
                      }

                      const property = handlerCallee.property;
                      if (!property || !t.isIdentifier(property)) {
                        return;
                      }

                      if (property.name === "preventDefault") {
                        handlerPath.remove();
                      }
                    }
                  };

                  traverse(handler, handlerTraverse, path.scope);
                }
              }

              // 处理键盘事件
              if (
                t.isStringLiteral(eventType) &&
                eventType.value === "keydown"
              ) {
                if (
                  t.isFunctionExpression(handler) ||
                  t.isArrowFunctionExpression(handler)
                ) {
                  // 使用新的作用域遍历处理函数体
                  const handlerTraverse = {
                    IfStatement(ifPath) {
                      const test = ifPath.node.test;
                      if (!test || !t.isBinaryExpression(test)) {
                        return;
                      }

                      const { left, right, operator } = test;
                      if (
                        !t.isMemberExpression(left) ||
                        !t.isNumericLiteral(right)
                      ) {
                        return;
                      }

                      const property = left.property;
                      if (!property || !t.isIdentifier(property)) {
                        return;
                      }

                      if (
                        property.name === "keyCode" &&
                        (operator === "===" || operator === "==") &&
                        (right.value === 123 || right.value === 73)
                      ) {
                        ifPath.remove();
                      }
                    }
                  };

                  traverse(handler, handlerTraverse, path.scope);
                }
              }
            }
          }
        }
      }
    });

    // 4. 生成代码时添加格式化选项
    const output = generate(ast, {
      retainLines: true,
      compact: false,
      comments: false
    });

    return output.code;
  } catch (error) {
    console.error("代码解析错误:", error);

    // 7. 降级处理：如果解析失败，使用简单的字符串替换
    return code.replace(/debugger;?/g, "");
  }
}
