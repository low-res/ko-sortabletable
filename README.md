# ko-sortabletable
a knockout-component for showing tables that are sort- and filterable

## Params

Allowed params for this component are:

#### required

    tabledata - array or observableArray of objects that should be displayed
    fieldsCollection - array of fielddefinitions that are applicable to the given tabledata
        

#### optional

    rowOptions - array of actions that should be available per row. every action is wrapped in an JS object in this form: 
                {title:"edit", icon:"fa fa-pencil", callback:_.bind(this.editEntity, this)}
    headerOptions - see rowOptions. But this would create buttons above the table and ist for tablewide actions
    no_tabledata_msg - translateable messagelabel for empty tabeldata. default: 'no_tabledata_msg';
    customTableClass - custm css class for widget wrapper for easier styling. default:"";
    headline - optinal, translateable headline-label for the widget. default:""
    searchable - boolean flag to indicate the table is seachable. default:true
    exportable - boolean flag to indicate the visible tabledata is exportable as csv. default:false
    trClassCalculators - array of functions that return css classes that should be asigned to table rows. Given Functions are called with two parameters (rowData, index)
    tdClassCalculators - array of functions that return css classes that should be asigned to table cells. Given Functions are called with two parameters (rowData, index)

## start demo

Start local http Server (https://github.com/indexzero/http-server)

    http-server ./ -p 9876
    
> http://127.0.0.1:9876/demo/    