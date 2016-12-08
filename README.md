# Light Table
A light weight, responsive JS table framework. Meant to work in cooperation with server requests to add rows.

## Implementation
include all of the required files
```
<script src="./LightTable.js"></script>
<link rel="stylesheet" href="./css/LightTableStyle.css" />
<link rel="stylesheet" href="./font-awesome-4.7.0/css/font-awesome.min.css" />
```

### create a new instance of the table
```
let table = new LightTable({
  target: '',
  columns: [],
  infiniteScroll: () => {},
  sort: (column, direction) => {}
});
```

- `target` is the id of the container that the table will exist inside of.

- `columns` is an array of objects describing columns. They are described as such:
  * `{ title: '', sort: '', closed: '', className: '', id: '' }`
    - `title` is the string to be displayed, and the reference when adding rows or sorting.
    - `sort` takes strings `asc` and `desc`, describing the column as ascending and descending respectively.
      * This does not sort the contents of the table. This changes the visual queues of sorting
      * Sorting is expected to be handle in the `sort()` function passed to `new LightTable()`
    - `closed` is a boolean describing if the column is hidden on initial load.
    - `className` is a string to be added as a class to the header of the column.
    - `id` is a string to be set as the id of the header of the column.

- `infiniteScroll` is a function to be ran once the container is scrolled to the bottom of the table

- `sort` is a function to be ran when the sort button is clicked on a column header. It will have the paramters `column`, which is the title in the object describing the column, and `direction` which will be the string `asc` or `desc`

### add rows to the table
```
let rows = [];

table.addRows(rows);
```

`addRows()` expects an array of objects describing rows

a row object may look like:
```
{
  'Name': { value: 'Elijah', className: 'color-red' },
  'Age': { value: 20, id: 'elijah-age' }
}
```
The first keys ('Name' and 'Age') correspond to column titles. The related object describes the cell under that column.

- `value` will be the string displayed in the cell
- `className` is a string to be added as a class to the cell
- `id` is a string to be set as the id of the cell


### remove all rows
`table.clearRows()` will remove all rows from the table.

### export table
`table.exportTable(type, name, innderHTMLParse)`

- `type` expects a string: 'csv', 'excel' or 'pdf'. PDF export requires pdfMake.js to be included.
- `name` expects a string that will be the name of the file
- `innerHTMLParse` expects a function that will be ran on each cell, though this is not required. This function is passed a parameter of the innerHTML of each cell, and the output is what is put in the exported file.
