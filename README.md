# ko-sortabletable
a knockout-component for showing tables that are sort- and filterable

## Params

Allowed params for this component are:

#### required

    tabledata - array or observableArray of objects that should be displayed
    fieldsCollection - array of fielddefinitions that are applicable to the given tabledata
        

#### optional

    rowOptions - array of actions that should be available per row. each action is wrapped in an JS object in this form: 
                {title:"edit", icon:"fa fa-pencil", callback:_.bind(this.editEntity, this)}
    multiRowActions - array of actions that should be available for a selection of multiple rows. each action is wrapped in an JS object in this form: 
                {title:"edit", icon:"fa fa-pencil", callback:_.bind(this.editEntity, this)}
    headerOptions - see rowOptions. But this would create buttons above the table and ist for tablewide actions
    no_tabledata_msg - translateable messagelabel for empty tabeldata. default: 'no_tabledata_msg';
    customTableClass - custm css class for widget wrapper for easier styling. default:"";
    headline - optinal, translateable headline-label for the widget. default:""
    searchable - boolean flag to indicate the table is seachable. default:true
    exportable - boolean flag to indicate the visible tabledata is exportable as csv. default:false
    trClassCalculators - array of functions that return css classes that should be asigned to table rows. Given Functions are called with two parameters (rowData, index)
    tdClassCalculators - array of functions that return css classes that should be asigned to table cells. Given Functions are called with two parameters (rowData, index)
    id - a unique id for the tabel (needs to be the same every time the table is shown to the user). If this is set, the current tablesettings (order, filter, pagination) are stored on local storage on dispose and restored when the table become visible again
     

## start demo

Start local http Server (https://github.com/indexzero/http-server)

    http-server ./ -p 56789
    
> http://127.0.0.1:56789/demo/    