const { hasValue, joinParams, extractExpect, constructDomExists } = require('./utils');

module.exports = [{
  name: 'expected-true-or-false',
  /* expect()
    .to.be.true,
    .to.be.false,
    .to.be.not.true,
    .to.be.not.false
  */
  matcher: function(expression, path, j) {
    return expression.property && ['true', 'false'].includes(expression.property.name);
  },
  transformer: function(expression, path, j) {
    var {
      assertArgumentSource,
      assertMessage,
      hasShouldNot
    } = extractExpect(path, j);

    var assertMethod = hasShouldNot ? 'notEqual': 'equal';
    var assertValue = expression.property.name === 'true';

    return `assert.${assertMethod}(${joinParams(assertArgumentSource, assertValue, assertMessage)});`;
  }
}, {
  name: 'expected-ok-or-empty-or-exists-or-present-or-undefined',
  /* expect()
    .to.be.ok,
    .to.be.not.ok,
    .to.be.empty,
    .to.be.not.empty,
    .to.be.exist,
    .to.not.be.exist,
    .to.be.present,
    .to.be.not.present,
    .to.be.undefined
  */
  matcher: function (expression) {
    return expression.property && ['ok', 'empty', 'exist', 'present', 'undefined'].includes(expression.property.name);
  },
  transformer: function (expression, path, j) {
    var {
      assertArgumentSource,
      assertArgument,
      assertMessage,
      hasShouldNot,
      hasSelector
    } = extractExpect(path, j);

    if(['empty', 'undefined'].includes(expression.property.name)) {
      hasShouldNot = !hasShouldNot;
    }

    if (hasSelector) {
      return constructDomExists(j, assertArgument, assertMessage, !hasShouldNot, 1);
    } else {
      var assertMethod = hasShouldNot ? 'notOk' : 'ok';
      return `assert.${assertMethod}(${joinParams(assertArgumentSource, assertMessage)});`;
    }
  }
}, {
   name: 'expected-null',
   /* expect(result)
      .to.be.null,
      .to.not.null
   */
   matcher: function(expression) {
     return (expression.property && expression.property.name === 'null');
   },
   transformer: function (expression, path, j) {
     var {
       assertArgumentSource,
       assertArgument,
       assertMessage,
       hasShouldNot,
       hasSelector
     } = extractExpect(path, j);

     if (hasSelector) {
       // not.be.null will be dom exists assertion hence hasShouldNot
       return constructDomExists(j, assertArgument, assertMessage, hasShouldNot, 1);
     } else {
       var assertMethod = hasShouldNot ? 'notEmpty': 'empty';
       return `assert.${assertMethod}(${joinParams(assertArgumentSource, assertMessage)});`;
     }
   }
}, {
  name: 'expected-equal',
  // expect(true).to.equal(true);
  // expect(1).to.not.equal(2);
  matcher: function(expression) {
    return (expression.callee && expression.callee.property.name === 'equal');
  },
  transformer: function (expression, path, j) {
    var { assertArgumentSource, hasShouldNot, assertMessage } = extractExpect(path, j);
    var expectedArgument = j(expression.arguments).toSource();

    var assertMethod = hasShouldNot ? 'notEqual': 'equal';

    return `assert.${assertMethod}(${joinParams(assertArgumentSource, expectedArgument, assertMessage)});`;
  }
}, {
  name: 'expected-length',
  // expect(findAll('[data-test-id=page-title]')).to.have.length(1);
  matcher: function(expression) {
    return (expression.callee && expression.callee.property.name === 'length');
  },
  transformer: function (expression, path, j) {
    var { assertArgument, assertMessage, hasSelector } = extractExpect(path, j);

    var existsParam = null;
    var lengthValue = expression.arguments[0].value;
    var domSelector = j(assertArgument.arguments).toSource();

    if (hasSelector) {
      return constructDomExists(j, assertArgument, assertMessage, (lengthValue > 0), lengthValue);
    } else {
      // NOTE need to handle the length method that is not used for findAll;
      return j(expression).toSource();
    }
  }
}, {
   name: 'expected-contains-or-includes-or-string',
   /* expect(result)
      .to.be.contains,
      .to.contain,
      .to.have.contain,
      .to.be.contain,
      .to.contains,
      .to.not.contain,
      .to.not.contains,
      .to.includes,
      .to.not.includes,
      .to.include,
      .to.not.include,
      .to.have.string,
      .to.not.have.string
   */
   matcher: function(expression) {
     let name = (expression.callee && expression.callee.property.name) || '';
     return name.includes('contain') || name.includes('include') || name === 'string';
   },
   transformer: function (expression, path, j) {
     var { assertArgumentSource, assertMessage, hasShouldNot } = extractExpect(path, j);
     var expectedArgument = j(expression.arguments).toSource();

     var assertMethod = hasShouldNot ? 'notIncludes' : 'includes';

     return `assert.${assertMethod}(${joinParams(assertArgumentSource, expectedArgument, assertMessage)});`;
   }
}];
