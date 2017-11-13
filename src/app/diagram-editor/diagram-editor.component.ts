import { Component, OnInit, ViewChild, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import * as go from 'gojs';

@Component({
  selector: 'app-diagram-editor',
  templateUrl: './diagram-editor.component.html',
  styleUrls: ['./diagram-editor.component.css']
})
export class DiagramEditorComponent implements OnInit {
  private diagram: go.Diagram = new go.Diagram();

  @ViewChild('diagramDiv')
  private diagramRef: ElementRef;

  @Input()
  get tables(): Object[] { return this.diagram.model.nodeDataArray; }
  set tables(val: Object[]) { this.diagram.model.nodeDataArray = val; }

  @Input()
  set relations(val: Object[]) { this.diagram.model = new go.GraphLinksModel(this.diagram.model.nodeDataArray, val); }

  @Input() dataTypes: String[];

  @Output()
  nodeSelected = new EventEmitter<go.Node | null>();

  constructor() {
    this.dataTypes = [];
    const $ = go.GraphObject.make;
    this.diagram = new go.Diagram();
    this.diagram.initialContentAlignment = go.Spot.Center;
    this.diagram.allowDrop = true;  // necessary for dragging from Palette
    this.diagram.undoManager.isEnabled = true;
    this.diagram.addDiagramListener("ChangedSelection", e => {
      const node = e.diagram.selection.first();
      this.nodeSelected.emit(node instanceof go.Node ? node.data : null);
    });
    // the template for each attribute in a node's array of item data
    var itemTempl =
      $(go.Panel, "Horizontal",
        // $("Button", $(go.TextBlock, "x",
        //   { verticalAlignment: go.Spot.Center, textAlign: "center", font: "10px sans-serif", margin: 0 }),
        //   {
        //     desiredSize: new go.Size(15, 15), margin: new go.Margin(5, 5, 5, 0),
        //     click: function (e, obj) {
        //       e.diagram.startTransaction('delete col');
        //       e.diagram.model.removeArrayItem(e.diagram.selection.first().data.items, obj.part);
        //       e.diagram.commitTransaction('delete col');
        //     }
        //   }
        // ),
        $(go.TextBlock,
          {
            stroke: "#333333", margin: new go.Margin(5, 5, 5, 0),
            font: "bold 14px sans-serif",
            editable: true, isMultiline: false
          },
          new go.Binding("text", "name").makeTwoWay()),
        $(go.TextBlock,
          {
            stroke: "#000", margin: new go.Margin(5, 5, 5, 0),
            font: "12px sans-serif",
            editable: true, isMultiline: false
          },
          new go.Binding("text", "dataType").makeTwoWay())
      );

    this.diagram.nodeTemplate =
      $(go.Node, "Auto",  // the whole node panel,
        {
          selectionAdorned: true,
          resizable: true,
          layoutConditions: go.Part.LayoutStandard & ~go.Part.LayoutNodeSized,
          fromSpot: go.Spot.AllSides,
          toSpot: go.Spot.AllSides,
          isShadowed: true,
          shadowColor: "#C5C1AA",
          contextMenu:
          $(go.Adornment, "Vertical",
            $("ContextMenuButton", $(go.TextBlock, "Delete Node"),
              {
                click: function (e, obj) {
                  e.diagram.startTransaction('delete node');
                  e.diagram.remove(e.diagram.selection.first());
                  e.diagram.commitTransaction('delete node');
                }
              }),
            $("ContextMenuButton", $(go.TextBlock, "New Column"),
              {
                click: function (e, obj) {
                  e.diagram.startTransaction('new column');
                  e.diagram.model.addArrayItem(e.diagram.selection.first().data.fields, { name: "ProductID", dataType: "String", color: "#F7B84B", figure: "Ellipse" });
                  e.diagram.commitTransaction('new column');
                }
              })
          )
        },
        // whenever the PanelExpanderButton changes the visible property of the "LIST" panel,
        // clear out any desiredSize set by the ResizingTool.
        new go.Binding("desiredSize", "visible", function (v) { return new go.Size(NaN, NaN); }).ofObject("LIST"),
        // define the node's outer shape, which will surround the Table
        $(go.Shape, "Rectangle",
          {
            fill: "lightgray", stroke: "#756875", strokeWidth: 3,
            portId: "", cursor: "pointer",
            // allow many kinds of links
            fromLinkable: true, toLinkable: true,
            fromLinkableSelfNode: true, toLinkableSelfNode: true,
            fromLinkableDuplicates: true, toLinkableDuplicates: true
          }),
        $(go.Panel, "Table",
          { margin: 8, stretch: go.GraphObject.Fill },
          $(go.RowColumnDefinition, { row: 0, sizing: go.RowColumnDefinition.None }),
          // the table header
          $(go.TextBlock,
            {
              row: 0,
              alignment: go.Spot.Center,
              stretch: go.GraphObject.Horizontal,
              minSize: new go.Size(150, 30),
              verticalAlignment: go.Spot.Center, textAlign: "center",
              font: "bold 16px sans-serif",
              background: "#eee",
              editable: true, isMultiline: false
            },
            new go.Binding("text", "key").makeTwoWay()),
          // the collapse/expand button
          $("PanelExpanderButton", "LIST",  // the name of the element whose visibility this button toggles
            { row: 0, alignment: go.Spot.TopRight }),
          // the list of Panels, each showing an attribute
          $(go.Panel, "Vertical",
            {
              name: "LIST",
              row: 1,
              padding: 3,
              alignment: go.Spot.TopLeft,
              defaultAlignment: go.Spot.Left,
              stretch: go.GraphObject.Horizontal,
              itemTemplate: itemTempl
            },
            new go.Binding("itemArray", "items"))
        )  // end Table Panel
      );  // end Node


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
              e.diagram.model.addNodeData({ key: "entity", items: [{ name: "item1", iskey: false, dataType: "String" }] });
              e.diagram.commitTransaction('new node');
            }
          })
      );
    this.diagram.linkTemplate =
      $(go.Link,  // the whole link panel
        {
          selectionAdorned: true,
          layerName: "Foreground",
          reshapable: true,
          routing: go.Link.AvoidsNodes,
          corner: 5,
          curve: go.Link.JumpOver,
          relinkableFrom: true,
          relinkableTo: true
        },
        $(go.Shape,  // the link shape
          { stroke: "#303B45", strokeWidth: 2.5 }),
        $(go.TextBlock,  // the "from" label
          {
            textAlign: "center",
            font: "bold 14px sans-serif",
            stroke: "#1967B3",
            segmentIndex: 0,
            segmentOffset: new go.Point(NaN, NaN),
            segmentOrientation: go.Link.OrientUpright
          },
          new go.Binding("text", "text")),
        $(go.TextBlock,  // the "to" label
          {
            textAlign: "center",
            font: "bold 14px sans-serif",
            stroke: "#1967B3",
            segmentIndex: -1,
            segmentOffset: new go.Point(NaN, NaN),
            segmentOrientation: go.Link.OrientUpright
          },
          new go.Binding("text", "toText"))
      );
  }

  ngOnInit() {
    this.diagram.div = this.diagramRef.nativeElement;
  }
}
