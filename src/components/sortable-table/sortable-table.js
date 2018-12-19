/* */
define([
    './sortable-table-model',
    './sortable-table-view.html!text',
    './sortable-table-style.css!css'
], function (vieModel, templateMarkup) {

    var p = SortableTableWidget.prototype;


    function SortableTableWidget( params ) { }


    return {
        viewModel: {
            createViewModel: function( params, elementInfo ) {
                var instance = new vieModel( params );
                return instance;
            }
        },
        template: templateMarkup,
        synchronous: true,
        component:'sortable-table',
        viewModelClass: vieModel
    };

});