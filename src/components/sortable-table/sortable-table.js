define([
    'knockout',
    'lodash',
    'low-res/ko-punches-additions',
    'cure53/DOMPurify',
    './sortable-table.html!text',
    './sortable-table.css!css'
], function (ko, _, kopa, DOMPurify, templateMarkup) {

    var p = SortableTableWidget.prototype;

    function SortableTableWidget(params) {

        if( !params.tabledata || !params.fieldsCollection ) throw(new Error("You MUST profide at lease a value for tabledata and a value for fieldsCollection!"));
        var self = this;
        this.originalTabledata  = params.tabledata;
        this.columnFields       = params.fieldsCollection;
        this.rowOptions         = params.rowOptions || [];
        this.trClassCalculators = params.trClassCalculators || [];
        this.tdClassCalculators = params.tdClassCalculators || [];
        this.no_tabledata_msg   = params.no_tabledata_msg || 'no_tabledata_msg';
        this.customTableClass   = params.customTableClass || "";
        this.widgetHeadline     = params.headline || "";

        this.sortByField        = ko.observable();
        this.sortByDirection    = ko.observable("asc");

        this.searchable         = params.searchable || true;
        this.searchTerm         = ko.observable("");

        this.exportable         = params.exportable || false;

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
                        // console.log( isIncluded, tmpField );
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

        // make sure kopa filters are available
        if(!ko.filters.translate) kopa.init();
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



    p.exportAsCsv = function () {
        var filename = "data.csv";
        var csvString = this._generateCSVString();
        var blob = new Blob([csvString], { type:   'text/csv' } );

        if (window.navigator && window.navigator.msSaveOrOpenBlob) { // for IE
            window.navigator.msSaveOrOpenBlob(blob, filename);
        } else {
            var link = document.createElement('a');
            document.body.appendChild(link);
            link.href = window.URL.createObjectURL(blob);
            console.log( blob, link );
            link.download = filename;
            link.click();
            document.body.removeChild(link);
        }
    }
    
    
    p.calculateTRcssClass = function (rowData, index) {
        var c = ko.utils.unwrapObservable(index)%2==0 ? "even " : "odd ";
        _.reduce(this.trClassCalculators, function(classes, func) {
            var additionalClass = func(rowData, index)
            return classes+" "+additionalClass;
        }, c);
        return c;
    }


    p.calculateTDcssClass = function (field, rowData) {
        var c = "";
        _.reduce(this.tdClassCalculators, function(classes, func) {
            var additionalClass = func(field, rowData)
            return classes+" "+additionalClass;
        }, c);
        return c;
    }


    /**
     * execute rowOption[0] on row click, if
     * we have only one rowOption
     */
    p.handleRowClick = function ( item ) {
        if(this.rowOptions.length == 1) {
            var c = this.rowOptions[0].callback;
            c( item );
        }
    }

    /******************
     *  PRIVATE METHODS
     ******************/

    p._toggleSortDirection = function() {
        this.sortByDirection( this.sortByDirection() == "asc" ? "desc" : "asc" );
    }


    p._getFormatedFieldValue = function (field, rowData) {
        var formatedValue   = field.getFormatedFieldValue( rowData );
        var sanitizedValue  = DOMPurify.sanitize( formatedValue );
        return sanitizedValue;
    }


    p._generateCSVString = function () {
        var res             = "";
        var fields          = this.columnFields;
        var self            = this;
        var columnDelimiter = ",";
        var rowDelimiter    = "\n";
        var columnNames     = [];
        _.forEach( fields, function (field) {
            var l = window.kopa.translate(field.label);
            columnNames.push( l );
        });
        console.log( columnNames );
        res += columnNames.join(columnDelimiter);
        res += rowDelimiter;

        _.forEach( this.visibleTabledata(), function ( rowData ) {
            var rowValues = [];
            _.forEach( fields, function (field) {
                rowValues.push( self._getFormatedFieldValue( field, rowData ) );
            });
            res += rowValues.join(columnDelimiter);
            res += rowDelimiter;
        });
        return res;
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