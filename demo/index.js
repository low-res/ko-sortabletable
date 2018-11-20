define( [
    'knockout',
    'low-res/ko-fielddefinitions/fieldsCollection',
    'low-res/ko-sortabletable'
], function ( ko, FieldsCollection ) {

    this.fields = new FieldsCollection({
        fields:[
            {name: 'col1', label: 'col1 label',valueAccessor: 'col1'},
            {name: 'col2', label: 'col2 label',valueAccessor: 'col2'}
        ],
        collections:[
            {name:'overview', fields:['col2', 'col1']}
        ]
    });

    this.columns = this.fields.getCollectionFields('overview');

    this.tabledata = [
        {col1: 1, col2: "Zxyz"},
        {col1: 2, col2: "Xxyz"},
        {col1: 3, col2: "Yxyz"},
        {col1: 4, col2: "Wxyz"},
        {col1: 5, col2: "Vxyz"},
        {col1: 6, col2: "Uxyz"},
        {col1: 7, col2: "Zxyz"},
        {col1: 8, col2: "Xxyz"},
        {col1: 9, col2: "Yxyz"},
        {col1: 10, col2: "Wxyz"},
        {col1: 11, col2: "Vxyz"},
        {col1: 12, col2: "Zxyz"},
        {col1: 13, col2: "Yxyz"},
        {col1: 14, col2: "Wxyz"},
        {col1: 15, col2: "Vxyz"}
    ];

    var numrows = 10000;
    for(var i = 0; i < numrows; i++) {
        this.tabledata.push(
            {col1: i, col2: Math.random().toString(36).substring(2, 15) }
        );
    }

    console.log( "start" );
    ko.applyBindings(  );

} );
