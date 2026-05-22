const { Visitor } = require('@swc/core/Visitor');

class InjectEntityTransformer extends Visitor {
  visitTsType(n) {
    return n;
  }

  visitCallExpression(n) {
    // Check if we call method on object
    if (n.callee && n.callee.type === 'MemberExpression') {
      const obj = n.callee.object;
      const prop = n.callee.property;

      // if we call method on object Database and method is get
      if (
        obj.type === 'Identifier' &&
        obj.value === 'Database' &&
        prop.type === 'Identifier' &&
        prop.value === 'get'
      ) {
        // Check if we call method with generic type (e.g. <User>)
        if (
          n.typeArguments &&
          n.typeArguments.params &&
          n.typeArguments.params.length > 0
        ) {
          const typeParam = n.typeArguments.params[0];

          if (
            typeParam.type === 'TsTypeReference' &&
            typeParam.typeName.type === 'Identifier'
          ) {
            // If argument is not in parentheses yet, we will pass it there
            if (!n.arguments || n.arguments.length === 0) {
              // We repeat the existing Identifier node from typeName.
              // This ensures that it contains all required attributes (e.g. span),
              // and the SWC compiler doesn't crash on a missing field during serialization to Rust.
              n.arguments = [
                {
                  expression: typeParam.typeName,
                },
              ];
            }
          }
        }
      }
    }
    return super.visitCallExpression(n);
  }
}

module.exports = (program) => {
  const transformer = new InjectEntityTransformer();
  return transformer.visitProgram(program);
};
