/* */
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
        this.headerOptions      = params.headerOptions || [];
        this.trClassCalculators = params.trClassCalculators || [];
        this.tdClassCalculators = params.tdClassCalculators || [];
        this.no_tabledata_msg   = params.no_tabledata_msg || 'no_tabledata_msg';
        this.rows_per_page_msg  = params.rows_per_page_msg || 'rows_per_page_msg';
        this.customTableClass   = params.customTableClass || "";
        this.headline           = params.headline || "";
        this.forceRowClick      = params.forceRowClick || false; // explicitly execute first rowOption on row-click, if we have more than one option

        this.sortByField        = ko.observable();
        this.sortByDirection    = ko.observable("asc");

        this.searchable         = params.searchable && true;
        this.hasData            = ko.pureComputed( function () {
            var d = ko.utils.unwrapObservable(self.originalTabledata);
            return d.length > 0;
        });
        this.searchTerm         = ko.observable("");

        // pagination
        this.pagination         = params.pagination || false;
        this.rowsPerPage        = ko.observable( params.rowsPerPage || 0);
        this.rowsPerPageSelection=ko.observableArray( params.rowsPerPageSelection || [25, 50, 100, 250] );
        this.currentPageIdx     = ko.observable(0);
        this.numPages           = ko.pureComputed( function () {
            var otd = ko.utils.unwrapObservable(self.originalTabledata);
            var rpp = self.rowsPerPage();
            return rpp > 0 ? Math.ceil( otd.length / rpp ) : 1;
        });
        this.rowsPerPage.subscribe( function(v) {
            console.log( "rowsPerPage.subscribe", v, self.pagination );
            setTimeout( function () {
                self.selectPage( self.currentPageIdx() );
            }, 50 );
        });

        // csv export
        this.exportable         = params.exportable || false;
        this.columnDelimiter    = params.columnDelimiter || ";";
        this.columnWrapper      = params.columnWrapper != undefined ?  params.columnWrapper : "\"";
        this.rowDelimiter       = params.rowDelimiter || "\n";

        // the sorted and filtered result of the original table data
        this.sortedAndFilteredTabledata   = ko.pureComputed( function () {
            var t           = ko.utils.unwrapObservable(self.originalTabledata);
            var direction   = self.sortByDirection();
            var sortField   = self.sortByField();
            var searchterm  = self.searchTerm();

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

                // reset pagination on filtering
                self.currentPageIdx(0);
            }

            // sorting
            if( sortField ) {
                t = _.orderBy(t, function ( tableRow ) {
                    return sortField.getFieldValue( tableRow );
                }, direction );
            }

            return t;
        });

        // the actually visible rows of the filteredAndSorted rows
        this.visibleTabledata   = ko.pureComputed( function () {
            var t           = ko.utils.unwrapObservable(self.sortedAndFilteredTabledata);

            // pagination
            var rpp = self.rowsPerPage();
            if(self.pagination && rpp > 0 ) {
                var startIdx = self.currentPageIdx() * rpp;
                t = _.slice(t, startIdx, startIdx + rpp)
            }

            return t;
        });


        // make sure kopa filters are available
        if(!ko.filters.translate) kopa.init();

        this._gatherCssClassCalculatorsFromFields();
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
        var idx = ko.utils.unwrapObservable(index);
        var c = idx%2==0 ? "even " : "odd ";
        c += this.rowOptions.length == 0 ? "no-options " : this.rowOptions.length == 1 ? "single-option " : "multiple-options";
        c = _.reduce(this.trClassCalculators, function(classes, func) {
            var additionalClass = func(rowData, idx);
            return classes+" "+additionalClass;
        }, c);
        return c;
    }



    p.calculateTDcssClass = function (field, rowData) {
        var c = "";
        if(field.outputFormat) c += "format-"+field.outputFormat+" ";
        c = _.reduce(this.tdClassCalculators, function(classes, func) {
            var additionalClass = func(field, rowData);
            return classes+" "+additionalClass;
        }, c);
        return c;
    }



    /**
     * execute rowOption[0] on row click, if
     * we have only one rowOption
     */
    p.handleRowClick = function ( item ) {
        if( this.rowOptions.length > 0 && (this.rowOptions.length == 1 || this.forceRowClick) ) {
            var c = this.rowOptions[0].callback;
            c( item );
        }
    }

    
    p.nextPage = function() {
        var c = this.currentPageIdx();
        this.selectPage(c+1);
    }


    p.prevPage = function(){
        var c = this.currentPageIdx();
        this.selectPage(c-1);
    }


    p.selectPage = function (idx) {
        console.log( "selectPage", idx );
        if(idx >= 0 && idx < this.numPages() ) this.currentPageIdx(idx);
        else {
            if(idx < 0 ) this.currentPageIdx(0);
            if(idx >= this.numPages() ) this.currentPageIdx(this.numPages()-1);
        }


        console.log( "this.currentPageIdx", this.currentPageIdx() );
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
        var self            = this;
        var res             = "";
        var fields          = this.columnFields;
        var self            = this;
        var columnNames     = [];
        _.forEach( fields, function (field) {
            var l = window.kopa.translate(field.label);

            l = self.columnWrapper+self._stripHtml(l)+self.columnWrapper;
            columnNames.push( l );
        });

        res += columnNames.join(self.columnDelimiter);
        res += self.rowDelimiter;

        _.forEach( this.sortedAndFilteredTabledata(), function ( rowData ) {
            var rowValues = [];
            var tmpValue;
            _.forEach( fields, function (field) {
                tmpValue = self.columnWrapper+field.getFieldValueForExport( rowData )+self.columnWrapper;
                rowValues.push( tmpValue );
            });
            res += rowValues.join(self.columnDelimiter);
            res += self.rowDelimiter;
        });
        return res;
    }


    p._stripHtml = function ( html ) {
        var div = document.createElement("div");
        div.innerHTML = html;
        var text = div.textContent || div.innerText || "";
        return text;
    }


    /**
     * css class calculators for rows and tds can be provided in fielddefinitions.
     * So we scan for those settings and add the appropriate functions to our
     * calculators collections
     * @private
     */
    p._gatherCssClassCalculatorsFromFields = function () {
        var self = this;
        _.forEach(this.columnFields, function (field) {
            if( field.trClassCalculator ) self.trClassCalculators.push(field.trClassCalculator);
            if( field.tdClassCalculator ) self.tdClassCalculators.push(field.tdClassCalculator);
        })
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