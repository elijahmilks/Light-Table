class LightTable {
	constructor(descriptor) {
		this.target = descriptor.target; // id of target to build table on
		this.columns = descriptor.columns; // array of column objects
		// this.fixedColumn = descriptor.fixedColumn; // name of original fixed column // NOT IMPLEMENTED YET
		this.infiniteScroll = descriptor.infiniteScroll; // function to run on scroll to bottom of table // THIS DESCRIPTION WILL CHANGE ONCE LAZY LOADING IS IMPLEMENTED
		this.sort = descriptor.sort; // function to run on sort

		this.rowCount = 0;
		this.dragged = null;

		this.createTable();
	}

	// function to render table header and body
	createTable() {
		let tableContainer = document.createElement('div');
		tableContainer.id = 'LT-Container';
		document.getElementById(this.target).appendChild(tableContainer);

		let table = document.createElement('table');
		table.id = 'LT';
		tableContainer.appendChild(table);

		let thead = document.createElement('thead');
		thead.id = 'LT-head';
		table.appendChild(thead);

		let theadRow = document.createElement('tr');
		thead.appendChild(theadRow);

		for (let i = 0; i < this.columns.length; i++) {
			let column = this.columns[i];

			let sortButton = this.getSortButton(column); // get sort button based on if column is sorted
			let closeButton = this.getCloseButton(column); // get close button
			let textNode = document.createTextNode(column.title);

			let th = theadRow.appendChild(document.createElement('th'));
			th.className = 'LTh droppable column-' + i;
			th.setAttribute('draggable', true);

			if (column.id) th.id = column.id;
			if (column.className) th.className += ' ' + column.className;

			th.appendChild(sortButton);
			th.appendChild(textNode);
			th.appendChild(closeButton);

			theadRow.appendChild(th);
		}

		this.createHeader();

		let tbody = document.createElement('tbody');
		tbody.id = 'LTBody';
		table.appendChild(tbody);

		tableContainer.addEventListener('click', this.clickListener.bind(this));

		this.addScrollListeners();

		this.fixHeader();

		// add drag events to header
		let headers = document.getElementsByClassName('LTh');
		for (let i = 0; i < headers.length; i++) {
			this.addDragEvents(headers[i]);
		}
	}

	createHeader() {
		let table = document.getElementById('LT');
		let thead = document.getElementById('LT-head');

		let headContainer = document.createElement('div');
		headContainer.id = 'LT-head-container';
		headContainer.style.width = document.getElementById(this.target).clientWidth + 'px';
		headContainer.style.marginTop = -1 * (thead.offsetHeight + 2) + 'px';
		headContainer.style.overflow = 'hidden';

		let headWrapper = document.createElement('div');
		headWrapper.style.overflowX = 'scroll';
		headWrapper.id = 'LT-head-wrapper';

		thead.style.visibility = 'hidden';

		headContainer.appendChild(headWrapper);
		table.appendChild(headContainer);

		let displayHead = thead.getElementsByTagName('tr')[0].cloneNode(true);
		headContainer.getElementsByTagName('div')[0].appendChild(displayHead);
	}

	fixHeader() {
		let orig_head = document.getElementById('LT-head').getElementsByTagName('tr')[0];
		let new_head = document.getElementById('LT-head-wrapper').getElementsByTagName('tr')[0];

		orig_head.childNodes.forEach(function (th, i) {
			let width = th.clientWidth; // THIS MAY NEED TO CHANGE TO OFFESTWIDTH
			let new_th = new_head.getElementsByTagName('th')[i];

			new_th.style.minWidth = (width - 32) + 'px';
			new_th.style.width = width;
		}.bind(this));
	}

	addScrollListeners() {
		let tableContainer = document.getElementById('LT-Container');
		let thead_wrapper = document.getElementById('LT-head-wrapper');

		// Align scrolling of table header with scrolling of table body
		this.ticking = false;
		this.last_scroll_pos = 0;

		tableContainer.addEventListener('scroll', function(e) {
			let old_scroll_pos = this.last_scroll_pos;
			this.last_scroll_pos = document.getElementById('LT-Container').scrollLeft;

			if (!this.ticking) {
				window.requestAnimationFrame(function() {
					if (old_scroll_pos !== this.last_scroll_pos) {
						document.getElementById('LT-head-wrapper').scrollLeft = this.last_scroll_pos;
					}
					this.ticking = false;
				}.bind(this));
			}

			this.ticking = true;
		}.bind(this));

		// disable scrolling on header
		thead_wrapper.addEventListener('scroll', function(e) {
			let old_scroll_pos = this.last_scroll_pos;
			document.getElementById('LT-head-wrapper').scrollLeft = old_scroll_pos;
		}.bind(this));
	}

	// function to add an array of rows to tbody
	addRows(rows) {
		let columns = this.columns;

		for (let i = 0; i < rows.length; i++) {
			this.rowCount++;

			let rowElem = document.createElement('tr');
			rowElem.id = 'row-' + this.rowCount;

			let row = rows[i];

			for (let j = 0; j < columns.length; j++) {
				let column = columns[j];

				let td = document.createElement('td');
				td.className = 'LTd column-' + j;

				if (columns[j].closed) td.className += ' LT-closed';
				if (row[column.title].className) td.className += ' ' + row[column.title].className;
				if (row[column.title.id]) td.id = row[column.title].id;

				td.innerHTML = row[column.title].value;

				rowElem.appendChild(td);
			}

			document.getElementById('LTBody').appendChild(rowElem);
		}

		this.fixHeader();
		this.bindInfiniteScroll();
	}

	// clear all rows from the table
	clearRows() {
		let container = document.getElementById('LT-Container');
		constiane.onscroll = () => {};

		this.rowCount = 0;

		let body = document.getElementById('LTBody');

		let new_body = document.createElement('tbody');
		new_tbody.id = 'LTBody';

		body.parentNode.replaceChild(new_body, body);
	}

	// function to bind the passed infinite scroll funciton to scrolling to the bottom
	bindInfiniteScroll() {
		let container = document.getElementById('LT-Container');

		container.onscroll = () => {
			if (container.scrollHeight - container.clientHeight == container.scrollTop) {
				this.infiniteScroll();
			}
		}
	}

	// function to bind drag events to column headers
	addDragEvents(elem) {
		elem.addEventListener('dragstart', (event) => {
			this.dragged = event.target;
		});

		elem.addEventListener('dragover', (event) => {
			event.preventDefault();
		});

		elem.addEventListener('dragenter', (event) => {
			if (event.target.className.includes('droppable')) {
				event.target.style.backgroundColor = '#DCD3EF';
			}
		});

		elem.addEventListener('dragleave', (event) => {
			if (event.target.className.includes('droppable')) {
				event.target.style.backgroundColor = null;
			}
		});

		elem.addEventListener('drop', (event) => {
			event.preventDefault();

			if (event.target.className.includes('droppable')) {
				event.target.style.backgroundColor = null;

				let index1 = parseInt(/column-([0-9]*)/.exec(event.target.className)[1]);
				let index2 = parseInt(/column-([0-9]*)/.exec(this.dragged.className)[1]);

				this.reorderColumns(index1, index2);
			}
		});
	}

	// function to execute on column header drag/drop
	reorderColumns(index1, index2) {
		let tempCol = this.columns[index2];
		this.columns[index2] = this.columns[index1];
		this.columns[index1] = tempCol;

		let replaceables1 = document.getElementsByClassName('column-' + index1);
		let replaceables2 = document.getElementsByClassName('column-' + index2);

		for (let i = 0; i < replaceables1.length; i++) {
			let temp1 = replaceables1[i].cloneNode(true);
			let temp2 = replaceables2[i].cloneNode(true);

			temp1.className = temp1.className.replace('column-' + index1, 'column-' + index2);
			temp2.className = temp2.className.replace('column-' + index2, 'column-' + index1);

			replaceables1[i].replaceWith(temp2);
			replaceables2[i].replaceWith(temp1);
		}

		this.addDragEvents(document.getElementById('LT-head-wrapper').getElementsByClassName('column-' + index1)[0]);
		this.addDragEvents(document.getElementById('LT-head-wrapper').getElementsByClassName('column-' + index2)[0]);

		// this.fixHeader();
	}

	// return sort button
	getSortButton(column) {
		let sortButton = document.createElement('i');

		sortButton.setAttribute('aria-hidden', 'true');

		if (column.sort == 'asc') {
			sortButton.className = 'fa fa-sort-asc';
		} else if (column.sort == 'desc') {
			sortButton.className = 'fa fa-sort-desc';
		} else {
			sortButton.className = 'fa fa-sort';
		}

		return sortButton;
	}

	// return close button
	getCloseButton() {
		let closeButton = document.createElement('i');

		closeButton.setAttribute('aria-hidden', 'true');
		closeButton.className = 'fa fa-times-circle-o';

		return closeButton;
	}

	// add click listener to table
	clickListener(event) {
		let target = event.target;

		if (target.className.includes('fa-sort')) { // sort column
			let innerText = target.parentNode.innerHTML;
			let column = /\/i>(.*)<i/.exec(innerText)[1];

			if (target.className.includes('fa-sort-asc')) {
				target.className = target.className.replace('fa-sort-asc', 'fa-sort-desc');

				this.onSort(column, 'desc');
			} else if (target.className.includes('fa-sort-desc')) {
				target.className = target.className.replace('fa-sort-desc', 'fa-sort-asc');

				this.onSort(column, 'asc');
			} else {
				target.className = target.className.replace('fa-sort', 'fa-sort-desc');

				this.onSort(column, 'desc');
			}

			let headerSorts = document.getElementById('LT').getElementsByClassName('fa');

			for (let i = 0; i < headerSorts.length; i++) {
				if (headerSorts[i].className.includes('fa-sort') && headerSorts[i] !== target) {
					if (headerSorts[i].className.includes('fa-sort-asc')) {
						headerSorts[i].className = headerSorts[i].className.replace('fa-sort-asc', 'fa-sort');
					} else if (headerSorts[i].className.includes('fa-sort-desc')) {
						headerSorts[i].className = headerSorts[i].className.replace('fa-sort-desc', 'fa-sort');
					}
				}
			}
		} else if (target.className.includes('fa-times-circle-o')) { // hide column
			let column_num = parseInt(/column-([0-9]*)/.exec(target.parentNode.className)[1]);
			let close_elems = document.getElementsByClassName('column-' + column_num);

			this.columns[column_num].closed = true;

			for (let i = 0; i < close_elems.length; i++) {
				close_elems[i].className += ' LT-closed';
			}

			this.fixHeader();
		} else if (target.className.includes('LT-closed')) { // show hidden column
			let column_num = parseInt(/column-([0-9]*)/.exec(target.className)[1]);
			let open_elems = document.getElementsByClassName('column-' + column_num);

			this.columns[column_num].closed = false;

			for (let i = 0; i < open_elems.length; i++) {
				open_elems[i].className = open_elems[i].className.replace(' LT-closed', '');
			}
			
			this.fixHeader();
		} else if (target.parentNode.id.includes('row') && !target.parentNode.className.includes('LT-selected')) { // select row and deselect any others
			let selected = document.getElementsByClassName('LT-selected');

			for (let i = 0; i < selected.length; i++) {
				selected[i].className = selected[i].className.replace(' LT-selected', '');
			}

			target.parentNode.className += ' LT-selected';
		} else if (target.parentNode.className.includes('LT-selected')) { // deselect row
			target.parentNode.className = target.parentNode.className.replace(' LT-selected', '');
		}
	}

	exportTable(type, name, innerHTMLParse = (innerHTML) => { return innerHTML; }) {
		if (type == 'csv') {
			this.exportCSV(name, innerHTMLParse);
		} else if (type == 'excel') {
			this.exportExcel(name, innerHTMLParse);
		} else if (type == 'pdf') {
			this.exportPDF(name, innerHTMLParse);
		} else if (type == 'print') {
			this.print(name, innerHTMLParse);
		}
	}

	exportCSV(name, innerHTMLParse) {
		let head_data = document.querySelector('#LT-head-wrapper .LTh');

		let data = 'data:text/csv;charset=utf-8, ';

		for (let i = 0; i < head_data.length; i++) {
			let th_data = head_data[i].innerHTML;

			th_data = /\/i>(.*)<i/.exec(th_data)[1];

			data += innerHTMLParse(th_data);

			if (i !== head_data.length - 1) {
				data += ', ';
			} else {
				data += '\n';
			}
		}

		let table_data = document.getElementsByClassName('LTd');

		let j = 0;
		for (let i = 0; i < table_data.length; i++) {
			data += innerHTMLParse(table_data[i].innerHTML);

			if (j !== this.columns.length - 1) {
				data += ', ';
				j++;
			} else {
				data += '\n';
				j = 0;
			}
		}

		let encodedURI = encodeURI(data);

		let link = document.createElement('a');
		link.setAttribute('href', encodedURI);
		link.setAttribute('download', name + '.csv');
		link.style.visibility = 'hidden';
		document.body.appendChild(link);

		link.click();

		document.body.removeChild(link);
	}

	exportExcel(name, innerHTMLParse) {
		let data = this.prepExcel(innerHTMLParse);

		let link = document.createElement('a');
		link.setAttribute('href', 'data:application/vnd.ms-excel;base64,' + base64(excelTemplateFirst + data + excelTemplateLast));
		link.setAttribute('download', name + '.xls');
		link.style.visibility = 'hidden';
		document.body.appendChild(link);

		link.click();

		document.body.removeChild(link);
	}

	exportPDF(name, innerHTMLParse) {
		let th = document.getElementById('LT-head-wrapper').getElementsByClassName('LTh');
		let header_row = [];
		let widths = [];
		
		for (let i = 0; i < th.length; i++) {
			if (!/LT-close/.test(th[i].outerHTML)) {
				header_row.push({ text: /<\/i>(.*)<i/.exec(th[i].innerHTML)[1], style: 'tableHeader' });

				widths.push('auto');
			}
		}

		let table_body = [header_row];

		for (let i = 1; i <= this.rowCount; i++) {
			let row = [];
			let row_data = document.getElementById('row-' + i).getElementsByClassName('LTd');

			for (let j = 0; j < row_data.length; j++) {
				if (!/LT-close/.test(row_data[j].outerHTML)) {
					if(!/<img/.test(row_data[j].innerHTML)) {
						if (i % 2) {
							row.push({ text: innerHTMLParse(row_data[j].innerHTML), style: 'evenRow' });
						} else {
							row.push(innerHTMLParse(row_data[j].innerHTML));
						}
					} else {
						if (i % 2) {
							row.push({ text: '', style: 'evenRow' });
						} else {
							row.push('');
						}
					}
				}
			}

			table_body.push(row);
		}

		let docDefinition = {
			content: [
				{ text: name, style: 'header', alignment: 'center' },
				{
					style: 'table',
					widths: widths,
					table: {
						headerRows: 1,
						body: table_body
					}
				}
			],
			styles: {
				header: {
					fontSize: 18,
					bold: true,
					margin: [0, 0, 0, 10]
				},
				table: {
					fontSize: 8
				},
				tableHeader: {
					fillColor: '#D6D6D6'
				},
				evenRow: {
					fillColor: '#EBEBEB'
				}
			}
		};

		pdfMake.createPdf(docDefinition).download('thing');
	}

	// print(name, innerHTMLParse) {
	// 	let new_table = document.getElementById('LT').cloneNode(true);
	// 	new_table.className = 'print';

	// 	let hide_elements = document.body.children;
	// 	for (let i = 0; i < hide_elements.length; i++) {
	// 		hide_elements[i].style.display = 'none';
	// 	}

	// 	new_table.getElementsByClassName('fixed-container')[0].style.width = '100%';
	// 	new_table.getElementsByClassName('fixed-head')[0].style.width = '100%';

	// 	let td = new_table.getElementsByTagName('td');
	// 	for (let i = 0; i < td.length; i++) {
	// 		td[i].innerHTML = innerHTMLParse(td[i].innerHTML);
	// 	}

	// 	document.body.appendChild(new_table);

	// 	this.getFixedHeader(document.querySelector('#LThead.hidden-head'));

	// 	window.print();

	// 	setTimeout(() => {
	// 		document.body.removeChild(new_table);

	// 		for (let i = 0; i < hide_elements.length; i++) {
	// 			hide_elements[i].style.display = 'block';
	// 		}
	// 	}, 10);
	// }

	prepExcel(innerHTMLParse) {
		let head_data = document.querySelector('#LT-head-wrapper .LTh');

		let data = '<thead><tr>';

		for (let i = 0; i < head_data.length; i++) {
			let th_data = head_data[i].innerHTML;

			th_data = /\/i>(.*)<i/.exec(th_data)[1];

			data += '<th>' + innerHTMLParse(th_data) + '</th>';
		}

		data += '</tr></thead><tbody>';

		let table_data = document.getElementsByClassName('LTd');

		let j = 0;
		for (let i = 0; i < table_data.length; i++) {
			if (j == 0) {
				data += '<tr>';
			}

			data += '<td>' + table_data[i].innerHTML + '</td>';

			if (j == this.columns.length - 1) {
				data += '</tr>';
				j = 0;
			} else {
				j++;
			}
		}

		return data;
	}
}

// base64 encode
const base64 = (s) => {
	return window.btoa(unescape(encodeURIComponent(s)));
}

// excel template strings
const excelTemplateFirst = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>{worksheet}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><table>';
const excelTemplateLast = '</table></body></html>';