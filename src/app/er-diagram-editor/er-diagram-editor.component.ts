import { Component, OnInit, ViewChild, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import * as go from 'gojs';

@Component({
  selector: 'app-er-diagram',
  template: '<div #diagramDiv class="diagramDiv"></div>',
  styles: ['.diagramDiv,.paletteDiv{border:1px solid #000;display:inline-block;vertical-align:top;height:400px}.diagramsPanel{width:100%;white-space:nowrap}.diagramDiv{width:80%}.paletteDiv{width:19%}']
})
export class ERDiagramEditorComponent implements OnInit {
  private diagram: go.Diagram = new go.Diagram();

  @ViewChild('diagramDiv')
  private diagramRef: ElementRef;

  @Input()
  get tables(): Object[] { return this.diagram.model.nodeDataArray; }
  set tables(val: Object[]) { this.diagram.model.nodeDataArray = val ? val : []; }

  @Input()
  set relations(val: Object[]) { (this.diagram.model as go.GraphLinksModel).linkDataArray = val ? val : []; }

  @Input() dataTypes: String[];

  @Output()
  nodeSelected = new EventEmitter<go.Node | null>();

  constructor() {
    this.dataTypes = [];
    const $ = go.GraphObject.make;
    this.diagram = new go.Diagram();
    this.diagram.initialContentAlignment = go.Spot.Center;
    this.diagram.undoManager.isEnabled = true;
    this.diagram.addDiagramListener("ChangedSelection", e => {
      const node = e.diagram.selection.first();
      this.nodeSelected.emit(node instanceof go.Node ? node.data : null);
    });
    // This template is a Panel that is used to represent each item in a Panel.itemArray.
    // The Panel is data bound to the item object.
    var fieldTemplate =
      $(go.Panel, "TableRow",  // this Panel is a row in the containing Table
        new go.Binding("portId", "name"),  // this Panel is a "port"
        {
          background: "transparent",  // so this port's background can be picked by the mouse
          fromSpot: go.Spot.LeftRightSides,  // links only go from the right side to the left side
          toSpot: go.Spot.LeftRightSides,
          // allow drawing links from or to this port:
          fromLinkable: true, toLinkable: true
        },
        { // allow the user to select items -- the background color indicates whether "selected"
          //?? maybe this should be more sophisticated than simple toggling of selection
          click: function (e, item) {
            // assume "transparent" means not "selected", for items
            var oldskips = item.diagram.skipsUndoManager;
            item.diagram.skipsUndoManager = true;
            if (item.background === "transparent") {
              item.background = "dodgerblue";
            } else {
              item.background = "transparent";
            }
            item.diagram.skipsUndoManager = oldskips;
          }
        },
        $(go.TextBlock,
          {
            margin: new go.Margin(0, 2), column: 1, font: "bold 13px sans-serif",
            editable: true, isMultiline: false,
            // and disallow drawing links from or to this text:
            fromLinkable: false, toLinkable: false
          },
          new go.Binding("text", "name").makeTwoWay()),
        $(go.TextBlock,
          {
            margin: new go.Margin(0, 2), column: 2, font: "13px sans-serif",
            editable: true, isMultiline: false
          },
          new go.Binding("text", "dataType").makeTwoWay())
      );
    // This template represents a whole "record".
    this.diagram.nodeTemplate =
      $(go.Node, "Auto", {
        isShadowed: true,
        shadowColor: "#C5C1AA"
      },
        new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
        // this rectangular shape surrounds the content of the node
        $(go.Shape,
          { fill: "#EEEEEE" }),
        // the content consists of a header and a list of items
        $(go.Panel, "Vertical", { stretch: go.GraphObject.Fill },
          // this is the header for the whole node
          $(go.Panel, "Auto",
            { stretch: go.GraphObject.Horizontal },  // as wide as the whole node
            $(go.Shape,
              { fill: "#1570A6", stroke: null }),
            $(go.TextBlock,
              {
                alignment: go.Spot.Center,
                margin: 3,
                stroke: "white",
                textAlign: "center",
                font: "bold 12pt sans-serif",
                editable: true, isMultiline: false
              },
              new go.Binding("text", "key").makeTwoWay())),
          // this Panel holds a Panel for each item object in the itemArray;
          // each item Panel is defined by the itemTemplate to be a TableRow in this Table
          $(go.Panel, "Table",
            {
              name: "TABLE",
              padding: 2,
              minSize: new go.Size(100, 10),
              defaultStretch: go.GraphObject.Horizontal,
              stretch: go.GraphObject.Fill,
              itemTemplate: fieldTemplate
            },
            new go.Binding("itemArray", "fields")
          )  // end Table Panel of items
        )  // end Vertical Panel
      );  // end Node
    this.diagram.linkTemplate =
      $(go.Link,
        { toShortLength: 4 },  // let user reconnect links
        $(go.Shape, { strokeWidth: 1.5 }),
        $(go.Shape, { toArrow: "Standard", stroke: null })
      );
    this.diagram.model =
      $(go.GraphLinksModel,
        {
          nodeDataArray: this.tables || [],
          linkDataArray: this.relations || []
        });


    // also define a context menu for the diagram's background
    this.diagram.contextMenu =
      $(go.Adornment, "Vertical",
        $("ContextMenuButton",
          $(go.TextBlock, "Undo"),
          { click: function (e, obj) { e.diagram.commandHandler.undo(); } },
          new go.Binding("visible", "", function (o) {
            return o.diagram.commandHandler.canUndo();
          }).ofObject()),
        $("ContextMenuButton",
          $(go.TextBlock, "Redo"),
          { click: function (e, obj) { e.diagram.commandHandler.redo(); } },
          new go.Binding("visible", "", function (o) {
            return o.diagram.commandHandler.canRedo();
          }).ofObject()),
        // no binding, always visible button:
        $("ContextMenuButton",
          $(go.TextBlock, "New Node"),
          {
            click: function (e, obj) {
              e.diagram.startTransaction('new node');
              e.diagram.model.addNodeData({ key: "entity", fields: [{ name: "item", dataType: "String" }], loc: "0 0" });
              e.diagram.commitTransaction('new node');
            }
          })
      );

    // this is a bit inefficient, but should be OK for normal-sized graphs with reasonable numbers of items per node
    var findAllSelectedItems = () => {
      var items = [];
      for (var nit = this.diagram.nodes; nit.next();) {
        var node = nit.value;
        var table = node.findObject("TABLE");
        if (table) {
          for (var iit = table['elements']; iit.next();) {
            var itempanel = iit.value;
            if (itempanel.background !== "transparent") items.push(itempanel);
          }
        }
      }
      return items;
    }
    // Override the standard CommandHandler deleteSelection behavior.
    // If there are any selected items, delete them instead of deleting any selected nodes or links.
    this.diagram.commandHandler.canDeleteSelection = () => {
      // true if there are any selected deletable nodes or links,
      // or if there are any selected items within nodes
      return go.CommandHandler.prototype.canDeleteSelection.call(this.diagram.commandHandler) ||
        findAllSelectedItems().length > 0;
    };
    this.diagram.commandHandler.deleteSelection = () => {
      var items = findAllSelectedItems();
      if (items.length > 0) {  // if there are any selected items, delete them
        this.diagram.startTransaction("delete items");
        for (var i = 0; i < items.length; i++) {
          var panel = items[i];
          var nodedata = panel.part.data;
          var itemarray = nodedata.fields;
          var itemdata = panel.data;
          var itemindex = itemarray.indexOf(itemdata);
          this.diagram.model.removeArrayItem(itemarray, itemindex);
        }
        this.diagram.commitTransaction("delete items");
      } else {  // otherwise just delete nodes and/or links, as usual
        go.CommandHandler.prototype.deleteSelection.call(this.diagram.commandHandler);
      }
    };

  }

  ngOnInit() {
    this.diagram.div = this.diagramRef.nativeElement;
  }
}
