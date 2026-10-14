const template = `oninput="this.value = this.value.replace(/[^0-9+()\\s-]/g, '')"`;
console.log('Template output:', template);
const testStr = '(617) abc555-xyz0199!!';
console.log('Result:', testStr.replace(/[^0-9+()\s-]/g, ''));

const nameTemplate = `oninput="this.value = this.value.replace(/[^a-zA-Z\\s.'-]/g, '')"`;
console.log('Name template output:', nameTemplate);
const nameTest = 'Margaret123 & Robert456 Vance!!!';
console.log('Name result:', nameTest.replace(/[^a-zA-Z\s.'-]/g, ''));
