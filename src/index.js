define([
    "knockout",
    "./sortable-table/sortable-table"
], function ( ko, tableComp ) {

    if( !ko.isRegistered("ko-sortabletable") ) ko.register("ko-sortabletable", tableComp);

});