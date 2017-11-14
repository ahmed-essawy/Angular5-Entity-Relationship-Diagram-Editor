import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  tables = [
    {
      key: "Products",
      fields: [
        { name: "ProductID", dataType: "String" },
        { name: "ProductName", dataType: "String" },
        { name: "SupplierID", dataType: "String" }
      ],
      loc: "100 100"
    },
    {
      key: "Suppliers",
      fields: [
        { name: "SupplierID", dataType: "String", },
        { name: "CompanyName", dataType: "String" },
        { name: "ContactName", dataType: "String" },
        { name: "Address", dataType: "String" }
      ],
      loc: "500 100"
    }
  ];

  relations = [
    { from: "Products", to: "Suppliers" }
  ];

  nodeSelected(node) {
    console.log(node);
  }
}
