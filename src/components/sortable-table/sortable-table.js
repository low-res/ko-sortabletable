define([
    'knockout',
    'lodash',
    './sortable-table.html!text',
    './sortable-table.css!css'
], function (ko, _, templateMarkup) {

    var p = SortableTableWidget.prototype;

    function SortableTableWidget(params) {
        if( !params.tabledata || !params.fieldsCollection ) throw(new Error("You MUST profide at lease a value for tabledata and a value for fieldsCollection!"));
        var self = this;
        this.originalTabledata  = params.tabledata;
        this.columnFields       = params.fieldsCollection;
        this.rowOptions         = params.rowOptions || [];
        this.no_tabledata_msg   = params.no_tabledata_msg || 'no_tabledata_msg';

        this.sortByField        = ko.observable();
        this.sortByDirection    = ko.observable("asc");

        this.searchable         = params.searchable || true;
        this.searchTerm         = ko.observable("");
        this.isSearchOpen       = ko.observable(false);
        this.searchFocus        = ko.observable(false);


        this.visibleTabledata   = ko.pureComputed( function () {
            var t           = ko.utils.unwrapObservable(self.originalTabledata);
            var direction   = self.sortByDirection();
            var sortField   = self.sortByField();
            var searchterm  = self.searchTerm();

            // sorting
            if( sortField ) {
                t = _.orderBy(t, function ( tableRow ) {
                    return sortField.getFieldValue( tableRow );
                }, direction );
            }

            // filtering
            if(searchterm.length > 2) {
                t = _.filter(t, function ( tableRow ) {
                    var fields = ko.utils.unwrapObservable(self.columnFields)
                    var isSearchtermIncluded = _.reduce( fields, function (isIncluded, tmpField) {
                        console.log( isIncluded, tmpField );
                        var val = tmpField.getFormatedFieldValue( tableRow ) || "";
                        var unformated = tmpField.getFieldValue( tableRow ) || "";
                        var contained = val.toString().toLocaleLowerCase().indexOf(searchterm.toLocaleLowerCase()) > -1;
                        if(!contained) contained = unformated.toString().toLocaleLowerCase().indexOf(searchterm.toLocaleLowerCase()) > -1;
                        return isIncluded || contained;
                    }, false );
                    return isSearchtermIncluded;
                });
            }

            return t;
        })
    }



    /******************
     *  PUBLIC API
     ******************/

    /**
     * sortBy
     * sort the visible tabledata by given field
     * @param field
     */
    p.sortBy = function( field ) {
        var self = this;

        if( this.sortByField() != field ) this.sortByField(field);
        else this._toggleSortDirection();
    }



    /**
     * calculateColumnHeaderCssClass
     * returns apropriate css class for sortable tableheaders
     * @param propertyName
     * @returns {string}
     */
    p.calculateColumnHeaderCssClass = function( field ) {
        var cssClass = "sorting";
        if( this.sortByField() == field ) {
            cssClass = "sorting_"+this.sortByDirection();
        }
        return cssClass;
    }


    p.toggleSearchfield = function() {
        var open = this.isSearchOpen();
        if(open) this.searchTerm("");
        else this.searchFocus(true);
        this.isSearchOpen(!open);
    }

    /******************
     *  PRIVATE METHODS
     ******************/

    p._toggleSortDirection = function() {
        this.sortByDirection( this.sortByDirection() == "asc" ? "desc" : "asc" );
    }



    p.dispose = function () {
        console.log( "-- dispose SortableTableWidget --" );
    };



    return {
        viewModel: {
            createViewModel: function( params, elementInfo ) {
                var instance = new SortableTableWidget( params );
                return instance;
            }
        },
        template: templateMarkup,
        synchronous: true,
        component:'sortable-table',
        viewModelClass: SortableTableWidget
    };
});