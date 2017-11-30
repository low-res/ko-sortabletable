define([
    "src/components/sortable-table/sortable-table",
    "low-res/ko-fielddefinitions/fieldsCollection",
], function (SortableTableComp, FieldsCollection) {

    describe("sortable tabel", function () {
        var SortableTable = SortableTableComp.viewModelClass;

        var fieldcollection = new FieldsCollection({
            fields:[
                {name:'field1', label:'mylabel1', valueAccessor:'field1' },
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

            t.sortBy(f);
            expect(t.visibleTabledata()[0]).toEqual(tabledata[2]);
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
        
        it('should show only row that contain the searchword', function () {
            var d = ko.observableArray([
                { field1:"xyz", field2:"xyz", field3:"xyz" },
                { field1:"xyz", field2:"aaa", field3:"xyz" },
                { field1:"aaa", field2:"xyz", field3:"xyz" }
            ]);
            console.log( fieldcollection );
            var t = new SortableTable({tabledata:d, fieldsCollection:columns});
            expect(t.visibleTabledata().length).toEqual(3);
            t.searchTerm('aaa');
            expect(t.visibleTabledata().length).toEqual(2);
        })

        it('should generate csv data from visible tabledata', function () {
            var t = new SortableTable({tabledata:tabledata, fieldsCollection:columns});
            var csvString = t._generateCSVString();
            var expectedString = "mylabel1,mylabel2,mylabel3\n1,2,3\n2,3,1\n3,1,2\n";

            expect(csvString).toEqual(expectedString)
        });

    })

});