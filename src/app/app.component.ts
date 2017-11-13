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
        { name: "ProductID", dataType: "String", color: "#F7B84B", figure: "Ellipse" },
        { name: "ProductName", dataType: "String", color: "#F25022", figure: "Ellipse" },
        { name: "SupplierID", dataType: "String", color: "#00BCF2" }
      ],
      loc: "100 100"
    },
    {
      key: "Suppliers",
      fields: [
        { name: "SupplierID", dataType: "String", color: "#FFB900", figure: "Diamond" },
        { name: "CompanyName", dataType: "String", color: "#F25022", figure: "Rectangle" },
        { name: "ContactName", dataType: "String", color: "#7FBA00", figure: "Diamond" },
        { name: "Address", dataType: "String", color: "#00BCF2", figure: "Rectangle" }
      ],
      loc: "500 100"
    }
  ];

  relations = [
    { from: "Products", fromPort: "SupplierID", to: "Suppliers", toPort: "SupplierID" }
  ];

  nodeSelected(node) {
    console.log(node);
  }
}
