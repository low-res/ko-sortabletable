define([
    "knockout",
    "./components/sortable-table/sortable-table"
], function ( ko, tableComp ) {

    if( !ko.components.isRegistered("ko-sortabletable") ) ko.components.register("ko-sortabletable", tableComp);

});