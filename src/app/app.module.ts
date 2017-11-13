import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { DiagramEditorComponent } from './diagram-editor/diagram-editor.component';
import { ERDiagramEditorComponent } from './er-diagram-editor/er-diagram-editor.component';

@NgModule({
  declarations: [
    AppComponent,
    DiagramEditorComponent,
    ERDiagramEditorComponent
  ],
  imports: [
    BrowserModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
