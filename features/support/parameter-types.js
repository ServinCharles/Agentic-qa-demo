const { defineParameterType } = require('@wdio/cucumber-framework');

// {amount}: a pound amount as written in the feature files, e.g. "£45,000" or "£1,800.50", as a number (45000, 1800.5).
// Built-in {float},{int} would split "£45,000" at the comma and lose the zeros ("000" -> 0).
defineParameterType({
  name: 'amount',
  regexp: /£\d{1,3}(?:,\d{3})*(?:\.\d{2})?/,
  transformer: text => Number(text.replace(/[£,]/g, ''))
});
