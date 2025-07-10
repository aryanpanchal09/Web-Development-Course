/* const products = []; */
const fs = require('fs');
const path = require('path');

module.exports = class Product {
  constructor(t) {
    this.title = t;
  }

  save() {
    /* products.push(this); */
    const p = path.join(
      path.dirname(process.mainModule.filename),
      'data',
      'products.json'
    );
  }

  static fetchAll() {
    return products;
  }
};
