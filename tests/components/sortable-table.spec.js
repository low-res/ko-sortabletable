define([
    "low-res/ko-punches-additions",
    "src/components/sortable-table/sortable-table",
    "low-res/ko-fielddefinitions/fieldsCollection",
    "low-res/ko-fielddefinitions/field",
], function (kopa, SortableTableComp, FieldsCollection, Field) {

    describe("sortable tabel", function () {

        kopa.addCustomFormat('htmloutput', function( v, loc ) {
            return "<p>"+v+"</p>";
        });

        kopa.addCustomFormat('exportoutput', function( v, loc ) {
            return v;
        });

        var SortableTable = SortableTableComp.viewModelClass;

        var fieldcollection = new FieldsCollection({
            fields:[
                {name:'field1', label:'mylabel1', valueAccessor:'field1', outputFormat:'htmloutput' },
                {name:'field2', label:'mylabel2', valueAccessor:'field2'},
                {name:'field3', label:'mylabel3', valueAccessor:'field3'}
            ],
            collections: [
                {name:'overview', fields:['field1','field2','field3']}
            ]
        });

        var tabledata = [
            { field1:1, field2:2, field3:3 },
            { field1:2, field2:3, field3:1 },
            { field1:3, field2:1, field3:2 }
        ];
        var columns = fieldcollection.getCollectionFields('overview');

        it('should be constructable', function () {
            var t = new SortableTable({tabledata:tabledata, fieldsCollection:columns});
            expect(t).toEqual(jasmine.any(SortableTable));
        });

        it('should be sortable by a given field', function () {
            var t = new SortableTable({tabledata:tabledata, fieldsCollection:columns});
            var f = fieldcollection.getField("field2");
            expect(t.visibleTabledata()[0]).toEqual(tabledata[0]);

            t.sortBy( f );
            expect(t.visibleTabledata()[0]).toEqual(tabledata[2]);
        });

        it('should be possible to pass sortparameters', function(){
            var f = fieldcollection.getField("field2");
            var t = new SortableTable({tabledata:tabledata, fieldsCollection:columns, sorting:[ {field:f, direction:'asc'} ]});
            expect(t.visibleTabledata()[0]).toEqual( tabledata[2] );
        });

        it('should change the sortdirection if sortBy is called with the same field twice', function () {
            var t = new SortableTable({tabledata:tabledata, fieldsCollection:columns});
            var f = fieldcollection.getField("field2");
            expect(t.visibleTabledata()[0]).toEqual(tabledata[0]);

            t.sortBy(f);
            expect(t.visibleTabledata()[0]).toEqual(tabledata[2]);
            t.sortBy(f);
            expect(t.visibleTabledata()[0]).toEqual(tabledata[1]);
        });

        it('should handle multiple sortFields', function(){
            var t = new SortableTable({tabledata:tabledata, fieldsCollection:columns});
            var f1 = fieldcollection.getField("field1");
            var f2 = fieldcollection.getField("field2");

            expect( t.sortByFields() ).toEqual( [] );

            t.sortBy(f1);

            expect( t.sortByFields().length ).toEqual( 1 );
            expect( t.sortByFields()[0].field ).toEqual( f1 );
            expect( t.sortByFields()[0].direction ).toEqual( "asc" );

            t.sortBy(f1);

            expect( t.sortByFields()[0].direction ).toEqual( "desc" );

            t.sortBy(f2, {shiftKey:true});

            expect( t.sortByFields().length ).toEqual( 2 );
            expect( t.sortByFields()[0].field ).toEqual( f2 );
            expect( t.sortByFields()[0].direction ).toEqual( "asc" );

            t.sortBy(f2, {shiftKey:true});

            expect( t.sortByFields()[0].direction ).toEqual( "desc" );

            t.sortBy(f2);

            expect( t.sortByFields().length ).toEqual( 1 );
            expect( t.sortByFields()[0].field ).toEqual( f2 );
        });

        it('should sort table by multiple sortfields', function(){
            var tabledata = [
                { field1:1, field2:"b", field3:1 },
                { field1:1, field2:"a", field3:3 },
                { field1:2, field2:"c", field3:2 }
            ];

            var t = new SortableTable({tabledata:tabledata, fieldsCollection:columns});
            var f1 = fieldcollection.getField("field1");
            var f2 = fieldcollection.getField("field2");
            var f3 = fieldcollection.getField("field3");

            t.sortBy( f1 );
            expect(t.visibleTabledata()[0]).toEqual(tabledata[0]);

            t.sortBy( f1 );
            expect(t.visibleTabledata()[0]).toEqual(tabledata[2]);

            t.sortBy( f2, {shiftKey:true} );
            expect(t.visibleTabledata()[0]).toEqual(tabledata[1]);
            expect(t.visibleTabledata()[1]).toEqual(tabledata[0]);
            expect(t.visibleTabledata()[2]).toEqual(tabledata[2]);

            t.sortBy( f2, {shiftKey:true} );
            expect(t.visibleTabledata()[0]).toEqual(tabledata[2]);
            expect(t.visibleTabledata()[1]).toEqual(tabledata[0]);
            expect(t.visibleTabledata()[2]).toEqual(tabledata[1]);
        });

        it('should work with observableArray as tabledata and reflect changes to the original table data', function () {
           var d = ko.observableArray([
                { field1:1, field2:2, field3:3 },
                { field1:2, field2:3, field3:1 },
                { field1:3, field2:1, field3:2 }
            ]);
            var t = new SortableTable({tabledata:d, fieldsCollection:columns});
            expect(t.visibleTabledata().length).toEqual(3);

            d.push({ field1:4, field2:4, field3:4 });
            expect(t.visibleTabledata().length).toEqual(4);
        });
        
        it('should show only rows that contain the searchword', function () {
            var d = ko.observableArray([
                { field1:"xyz", field2:"xyz", field3:"xyz" },
                { field1:"xyz", field2:"aaa", field3:"xyz" },
                { field1:"aaa", field2:"xyz", field3:"xyz" }
            ]);
            var t = new SortableTable({tabledata:d, fieldsCollection:columns});
            expect(t.visibleTabledata().length).toEqual(3);
            t.searchTerm('aaa');
            expect(t.visibleTabledata().length).toEqual(2);
        });

        it('should be possible to pass searchword', function() {
            var d = ko.observableArray([
                { field1:"xyz", field2:"xyz", field3:"xyz" },
                { field1:"xyz", field2:"aaa", field3:"xyz" },
                { field1:"aaa", field2:"xyz", field3:"xyz" }
            ]);
            var t = new SortableTable({tabledata:d, fieldsCollection:columns, searchterm:'aaa'});
            expect(t.visibleTabledata().length).toEqual(2);
        });

        it('should generate csv data from visible tabledata', function () {
            var t = new SortableTable({tabledata:tabledata, fieldsCollection:columns, columnDelimiter:",", columnWrapper:""});
            var csvString = t._generateCSVString();
            var expectedString = "mylabel1,mylabel2,mylabel3\n<p>1</p>,2,3\n<p>2</p>,3,1\n<p>3</p>,1,2\n";

            expect(csvString).toEqual(expectedString)
        });

        it('should generate csv data and use exportFormat if set', function () {
            var fieldcollection2 = new FieldsCollection({
                fields:[
                    {name:'field1', label:'mylabel1', valueAccessor:'field1', exportFormat:"", outputFormat:'htmloutput' },
                    {name:'field2', label:'mylabel2', valueAccessor:'field2'},
                    {name:'field3', label:'mylabel3', valueAccessor:'field3'}
                ],
                collections: [
                    {name:'overview', fields:['field1','field2','field3']}
                ]
            });


            var columns2 = fieldcollection2.getCollectionFields('overview');

            var t = new SortableTable({tabledata:tabledata, fieldsCollection:columns2, columnDelimiter:",", columnWrapper:"\""});
            var csvString = t._generateCSVString();
            var expectedString = '"mylabel1","mylabel2","mylabel3"\n"1","2","3"\n"2","3","1"\n"3","1","2"\n';

            expect(csvString).toEqual(expectedString)
        });

        it('should paginate tablerows and show only a fixed number of rows per page', function(){
            var d = ko.observableArray([
                { field1:"xyz", field2:"xyz", field3:"xyz" },
                { field1:"xyz", field2:"aaa", field3:"xyz" },
                { field1:"aaa", field2:"xyz", field3:"xyz" },
                { field1:"xyz", field2:"xyz", field3:"xyz" },
                { field1:"xyz", field2:"aaa", field3:"xyz" },
                { field1:"aaa", field2:"xyz", field3:"xyz" },
                { field1:"xyz", field2:"xyz", field3:"xyz" },
                { field1:"xyz", field2:"aaa", field3:"xyz" },
                { field1:"aaa", field2:"xyz", field3:"xyz" },
                { field1:"aaa", field2:"xyz", field3:"xyz" },
                { field1:"aaa", field2:"xyz", field3:"xyz" },
                { field1:"aaa", field2:"xyz", field3:"xyz" }
            ]);
            var t = new SortableTable({tabledata:d, fieldsCollection:columns, pagination:true, rowsPerPage:5});
            expect(t.visibleTabledata().length).toEqual(5);
            expect(t.numPages()).toEqual(3);
            expect(t.currentPageIdx()).toEqual(0);
        });

        it('should be able to step through pages', function(){
            var d = ko.observableArray([
                { field1:"xyz", field2:"xyz", field3:"xyz" },
                { field1:"xyz", field2:"aaa", field3:"xyz" },
                { field1:"aaa", field2:"xyz", field3:"xyz" },
                { field1:"xyz", field2:"xyz", field3:"xyz" },
                { field1:"xyz", field2:"aaa", field3:"xyz" },
                { field1:"aaa", field2:"xyz", field3:"xyz" },
                { field1:"xyz", field2:"xyz", field3:"xyz" },
                { field1:"xyz", field2:"aaa", field3:"xyz" },
                { field1:"aaa", field2:"xyz", field3:"xyz" },
                { field1:"aaa", field2:"xyz", field3:"xyz" },
                { field1:"aaa", field2:"xyz", field3:"xyz" },
                { field1:"aaa", field2:"xyz", field3:"xyz" }
            ]);
            var t = new SortableTable({tabledata:d, fieldsCollection:columns, pagination:true, rowsPerPage:5});
            expect(t.visibleTabledata().length).toEqual(5);
            t.nextPage();
            expect(t.currentPageIdx()).toEqual(1);
            t.nextPage();
            expect(t.currentPageIdx()).toEqual(2);
            t.nextPage();
            expect(t.currentPageIdx()).toEqual(2);
            t.prevPage();
            expect(t.currentPageIdx()).toEqual(1);
            t.selectPage(0);
            expect(t.currentPageIdx()).toEqual(0);
        });

        it('should serialize tablesettings', function(){
            var t = new SortableTable({tabledata:tabledata, fieldsCollection:columns, id:'myTable'});
            t.searchTerm("abc");
            t.sortByFields([]);
            t.rowsPerPage(100);
            t.currentPageIdx(0);

            var expected = {
                searchTerm:t.searchTerm(),
                sortByFields: t.sortByFields(),
                rowsPerPage: t.rowsPerPage(),
                currentPageIdx: t.currentPageIdx()
            };

            expected = JSON.stringify(expected);

            var serialized = t._serializeSettings();

            expect(serialized).toEqual(expected);
        });

        it('should store the table settings on dispose', function(){
            var t = new SortableTable({tabledata:tabledata, fieldsCollection:columns, id:'myTable'});
            t.searchTerm("abc");

            var f = fieldcollection.getField("field2");
            t.sortBy( f );

            var settings = t._serializeSettings();
            t.dispose();
            var s = window.localStorage.getItem( t.getSettingsId() );
            expect(s).not.toBeNull();

            expect(settings).toEqual(s);

            window.localStorage.removeItem( t.getSettingsId() );

        });

        it('should recover the tablesettings on creation', function() {
            var storedString = '{"searchTerm":"xyz","sortByFields":[{"field":{"name":"field2","label":"mylabel2","valueAccessor":"field2","validation":""},"direction":"asc"}],"rowsPerPage":0,"currentPageIdx":0}';
            window.localStorage.setItem("sortabletable-myTable", storedString);

            var t = new SortableTable({tabledata:tabledata, fieldsCollection:columns, id:'myTable'});

            expect(t.searchTerm()).toEqual('xyz');

            window.localStorage.removeItem( t.getSettingsId() );
        });

        it('should recreated Field-Objects for sortfields when recovering settings', function() {
            var storedString = '{"searchTerm":"xyz","sortByFields":[{"field":{"name":"field2","label":"mylabel2","valueAccessor":"field2","validation":""},"direction":"asc"}],"rowsPerPage":0,"currentPageIdx":0}';
            window.localStorage.setItem("sortabletable-myTable", storedString);

            var t = new SortableTable({tabledata:tabledata, fieldsCollection:columns, id:'myTable'});

            var sortbyprop = t.sortByFields()[0];
            expect(sortbyprop.field instanceof Field).toBeTruthy();

            window.localStorage.removeItem( t.getSettingsId() );
        });

        it('should be possible to select multiple rows', function() {

            var multiRowActions = [
                {title:"", icon:"", callback: function(){} }
            ];
            var t = new SortableTable({tabledata:tabledata, fieldsCollection:columns, multiRowActions:multiRowActions});
            
            expect(t.selectedRows()).toBeDefined();
            expect(t.selectedRows().length).toEqual(0);

        });

        it('should calculate if rowoptions are shown or not ', function() {
            var rowOptions1 = [
                {title:"", icon:"", callback: function(){} }
            ];

            var rowOptions2 = [
                {title:"", icon:"", callback: function(){} },
                {title:"", icon:"", callback: function(){} }
            ];

            var t1 = new SortableTable({tabledata:tabledata, fieldsCollection:columns, rowOptions:rowOptions1, forceRowClick:true});
            expect(t1.showRowOptions()).toBeFalsy();

            var t2 = new SortableTable({tabledata:tabledata, fieldsCollection:columns, rowOptions:rowOptions1, forceRowClick:false});
            expect(t2.showRowOptions()).toBeTruthy();

            var t3 = new SortableTable({tabledata:tabledata, fieldsCollection:columns, rowOptions:rowOptions2, forceRowClick:true});
            expect(t3.showRowOptions()).toBeTruthy();

            var t4 = new SortableTable({tabledata:tabledata, fieldsCollection:columns, rowOptions:rowOptions2, forceRowClick:false});
            expect(t4.showRowOptions()).toBeTruthy();

        });

        it('should calculate if multiActions are shown or not', function(){
            var multiRowActions = [
                {title:"", icon:"", callback: function(){} }
            ];
            var t1 = new SortableTable({tabledata:tabledata, fieldsCollection:columns, multiRowActions:multiRowActions});
            expect(t1.showMultirowActions()).toBeTruthy();

            var t2 = new SortableTable({tabledata:tabledata, fieldsCollection:columns, multiRowActions:[]});
            expect(t2.showMultirowActions()).toBeFalsy();
        });

    })

});