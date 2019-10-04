/* */
define([
    'knockout',
    'lodash',
    'low-res/ko-punches-additions',
    'low-res/ko-fielddefinitions/field',
    'cure53/DOMPurify',
], function (ko, _, kopa, Field, DOMPurify ) {

    var p = SortableTableWidgetViewModel.prototype;


    function SortableTableWidgetViewModel(params) {
        console.log( "new SortableTableWidgetViewModel", params );

        if( !params.tabledata || !params.fieldsCollection ) throw(new Error("You MUST profide at lease a value for tabledata and a value for fieldsCollection!"));

        var self                = this;
        this.id                 = params.id || null;
        this.originalTabledata  = params.tabledata;
        this.columnFields       = params.fieldsCollection;
        this.headerOptions      = params.headerOptions || [];
        this.trClassCalculators = params.trClassCalculators || [];
        this.tdClassCalculators = params.tdClassCalculators || [];
        this.no_tabledata_msg   = params.no_tabledata_msg || 'no_tabledata_msg';
        this.rows_per_page_msg  = params.rows_per_page_msg || 'rows_per_page_msg';
        this.customTableClass   = params.customTableClass || "";
        this.headline           = params.headline || "";
        this.hasData            = ko.pureComputed( function () {
            var d = ko.utils.unwrapObservable(self.originalTabledata);
            return d.length > 0;
        });

        // ordering
        this.sortByFields       = ko.observableArray( params.sorting || [] );
        this.sortable           = _.isBoolean(params.sortable) ? params.sortable : true;

        // search
        this.searchable         = params.searchable && true;
        this.searchTerm         = ko.observable( params.searchterm || "" );

        // pagination
        this.pagination         = params.pagination || false;
        this.rowsPerPage        = ko.observable( params.rowsPerPage || 0);
        this.rowsPerPageSelection=ko.observableArray( params.rowsPerPageSelection || [25, 50, 100, 250] );
        this.currentPageIdx     = ko.observable(0);
        this.numPages           = ko.pureComputed( function () {
            var otd = ko.utils.unwrapObservable(self.sortedAndFilteredTabledata);
            var l = otd ? otd.length : 0;
            var rpp = self.rowsPerPage();
            return rpp > 0 ? Math.ceil( l / rpp ) : 0;
        });
        this.rowsPerPage.subscribe( function(v) {
            console.log( "rowsPerPage.subscribe", v, self.pagination );
            setTimeout( function () {
                self.selectPage( self.currentPageIdx() );
            }, 50 );
        });

        // multiselect and rowoptions
        this.rowOptions         = params.rowOptions || [];
        this.multiRowActions    = params.multiRowActions || [];
        this.selectedmultirowAction = ko.observable(null);
        this.forceRowClick      = params.forceRowClick || false; // explicitly execute first rowOption on row-click, if we have more than one option
        this.selectedRows       = ko.observableArray([])
        this.showRowOptions     = ko.pureComputed( function() {
            var res = (self.forceRowClick && self.rowOptions.length > 1) || (!self.forceRowClick && self.rowOptions.length > 0)
            return res;
        } );
        this.showMultirowActions = ko.pureComputed( function() {
            var res = self.multiRowActions.length > 0;
            return res;
        });

        // csv export
        this.exportable         = params.exportable || false;
        this.columnDelimiter    = params.columnDelimiter || ";";
        this.columnWrapper      = params.columnWrapper != undefined ?  params.columnWrapper : "\"";
        this.rowDelimiter       = params.rowDelimiter || "\n";

        // the actually visible rows of the filteredAndSorted rows
        this.visibleTabledata   = ko.pureComputed( _.bind(self._calculateVisibleTabledata, self) );

        // the sorted and filtered result of the original table data
        this.sortedAndFilteredTabledata   = ko.pureComputed( _.bind( self._calculateSortedAndFilteredTabledata, self) );

        // make sure kopa filters are available
        if(!ko.filters.translate) kopa.init();

        // the attributes of table settings that are stored on dispose and recoverd if table comes back in
        this.serializeableAttributes = ["searchTerm","sortByFields","rowsPerPage","currentPageIdx"]

        this._gatherCssClassCalculatorsFromFields();
        this._recoverSettings();
    }


    /******************
     *  PUBLIC API
     ******************/

    /**
     * sortBy
     * sort the visible tabledata by given field
     * @param field
     */
    p.sortBy = function( field, event ) {
        if( !this.sortable ) return;

        var self = this;
        var o           = {field:field, direction:'asc'};
        var sortFields  = this.sortByFields();
        var found       = _.find(sortFields, ['field', field]);

        if( event && event.shiftKey ) {
            if(!found) sortFields.unshift(o);
        } else {
            // clear all sortfields and add only the new ones
            if(!found) {
                sortFields = [o];
            } else {
                sortFields = [found];
            }
        }

        if( found ) {
            this._toggleSortDirection( found );
        }
        this.sortByFields(sortFields);
        this.sortByFields.valueHasMutated();
    }


    /**
     * execute rowOption[0] on row click, if
     * we have only one rowOption
     */
    p.handleRowClick = function ( rowData, event ) {
        if( (this.rowOptions.length == 1 || this.forceRowClick) ) {
            var c = this.rowOptions[0].callback;
            c( rowData );
        }
    }


    p.handleRowSelection = function( rowData ) {
        if( this.showMultirowActions() ) {
            var sr = this.selectedRows();
            if( !_.find( sr, rowData ) ) {
                sr.push(rowData);
            } else {
                _.remove( sr, rowData );
            }
            this.selectedRows( sr );
        }
    }


    p.toggleSelectAll = function(){
        var sr = this.selectedRows();
        if( sr.length > 0 ) {
            sr = [];
        } else {
            var all = this.visibleTabledata();
            _.map(all, function(row){
                sr.push(row)
            })
        }
        this.selectedRows(sr);
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
        if(idx >= 0 && idx < this.numPages() ) this.currentPageIdx(idx);
        else {
            if(idx < 0 ) this.currentPageIdx(0);
            if(idx >= this.numPages() ) this.currentPageIdx(this.numPages()-1);
        }
    }


    p.getSettingsId = function(){
        if( this.id ) {
            return "sortabletable-"+this.id;
        }
        return null;
    }


    p.clearSearch = function () {
        this.searchTerm("");
    }


    p.executeMultirowAction = function () {
        var self = this;
        var data = this.selectedRows();
        var action = this.selectedmultirowAction();
        if( data.length > 0 && action && action.callback  ) {
            var p = action.callback( data );

            // if callback returns a promisse, clear/keep the selection
            // after resolving/revoking the promisse. Otherwise clear selection directly
            if( p && _.isFunction(p.then) ) {
                p.then( function () {
                    self.selectedRows([]);
                }, function () {
                    console.log( "something went wrong with multiedit" );
                });
            } else {
                this.selectedRows([]);
            }
        }
    }


    /**
     * calculateColumnHeaderCssClass
     * returns apropriate css class for sortable tableheaders
     * @param propertyName
     * @returns {string}
     */
    p.calculateColumnHeaderCssClass = function( field ) {
        if(!this.sortable) return "";

        var cssClass = "sorting";
        var sortByFields = this.sortByFields();
        var found  = _.find(sortByFields, ['field', field]);
        if( found ) {
            cssClass = "sorting_"+found.direction;
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
        c += this.showMultirowActions() ? " selectable " : "";
        c += this.rowOptions.length == 1 || this.forceRowClick ? " clickable " : "";
        c = _.reduce(this.trClassCalculators, function(classes, func) {
            var additionalClass = func(rowData, idx);
            return classes+" "+additionalClass;
        }, c);

        if( _.find( this.selectedRows(), rowData ) ) {
            c += " selected ";
        }

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




    /******************
     *  PRIVATE METHODS
     ******************/


    p._calculateSortedAndFilteredTabledata = function() {

        var self        = this;
        var t           = ko.utils.unwrapObservable(this.originalTabledata);

        // filtering
        if(this.searchTerm().length > 2) {
            t = self._filterTableRows( t );

            // reset pagination on filtering
            this.currentPageIdx(0);
        }

        // sorting
        if( this.sortByFields().length > 0 ) {
            t = self._sortTableRows( t );
        }

        return t;
    }


    p._filterTableRows = function( tableRows ) {
        var self = this;
        var searchterm  = this.searchTerm();

        return _.filter(tableRows, function ( tableRow ) {
            var fields = ko.utils.unwrapObservable( self.columnFields )

            var isSearchtermIncluded = _.reduce( fields, function (isIncluded, tmpField) {
                var val         = tmpField.getFormatedFieldValue( tableRow ) || "";
                var unformated  = tmpField.getFieldValue( tableRow ) || "";
                var contained   = val.toString().toLocaleLowerCase().indexOf(searchterm.toLocaleLowerCase()) > -1;
                if(!contained) contained = unformated.toString().toLocaleLowerCase().indexOf(searchterm.toLocaleLowerCase()) > -1;
                return isIncluded || contained;
            }, false );

            return isSearchtermIncluded;
        });

    }


    p._sortTableRows = function( tableRows ) {
        var sortFields  = this.sortByFields();

        // an array containing all iteratees for the orderBy Function
        var sortFunctions = _.map(sortFields, function( tmpField ) {
            var sortField = tmpField.field;
            var f = function ( tmpField, tableRow ) {

                return tmpField.field.getFieldValue( tableRow );
            };
            return _.bind(f, this, tmpField);
        });

        // an array containing all directions for the orderBy function
        var sortDirections = _.map(sortFields, function(tmpField) {
            return tmpField.direction;
        });

        var o = _.orderBy(tableRows, sortFunctions, sortDirections );

        return o;
    }


    p._calculateVisibleTabledata = function() {
        var t           = ko.utils.unwrapObservable( this.sortedAndFilteredTabledata );

        // pagination
        var rpp = this.rowsPerPage();
        if(this.pagination && rpp > 0  ) {
            var startIdx = this.currentPageIdx() * rpp;
            if(startIdx < 1) startIdx = 0;
            t = _.slice(t, startIdx, startIdx + rpp)
        }

        return t;
    }


    p._toggleSortDirection = function( field ) {
        if(field) field.direction = field.direction == "asc" ? "desc" : "asc";
        console.log( "_toggleSortDirection", field );
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


    p._serializeSettings = function() {
        var result = {};
        var self = this;
        _.forEach(this.serializeableAttributes, function(attrName) {
            result[attrName] = ko.utils.unwrapObservable( self[attrName] );
        });

        return JSON.stringify(result);
    }


    p._recoverSettings = function() {
        var self        = this;
        var settingsId  = this.getSettingsId();
        var storedSettings = JSON.parse( window.localStorage.getItem(settingsId) );
        if( settingsId && storedSettings ) {
            _.forEach(this.serializeableAttributes, function(attrName) {
                var tmpValue = storedSettings[attrName];
                if(tmpValue) {
                    switch( attrName ) {
                        case "currentPageIdx":
                            self.selectPage( tmpValue );
                            break;

                        case "sortByFields":
                            // recreate Field-Objects
                            tmpValue = _.map(tmpValue, function (tmpfield) {
                                var f = _.find( self.columnFields, {name: tmpfield.field.name} );
                                return { field: f, direction:tmpfield.direction};
                            });
                            self.sortByFields(tmpValue);
                            break;

                        default:
                            self[attrName](tmpValue);
                    }
                }

            });
        }
    }


    p.dispose = function () {
        console.log( "-- dispose SortableTableWidget --" );
        if( this.getSettingsId() ) window.localStorage.setItem(this.getSettingsId(), this._serializeSettings() );
    };


    return SortableTableWidgetViewModel;

});