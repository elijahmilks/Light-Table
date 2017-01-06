/*
{
	target: 'table-container',
	columns: [
		{ title: 'Name', class: 'column-1-class' }, // whole column has this class
		{ title: 'Race' id: 'column-2' }, // column header has id
		{ title: 'Age', sort: 'asc' } // show sort ascended
	],
	rows: [
		{ 
			'Name': { value: 'Elijah Wilkes', class: 'name-elijah' }, // class is applied to just this cell
			'Race': { value: 'Caucasian', id: 'race-elijah' }, // id is applied to just this cell
			'Age' : { value: 20 }
		}
	],
	infiniteScroll: () => {},
	sort: () => {}
}
*/

class LightTable {
	constructor(descriptor) {
		this.target = descriptor.target;
		this.columns = descriptor.columns;
		this.rows = descriptor.rows;
		this.infiniteScroll = descriptor.infiniteScroll;
		this.sort = descriptor.sort;

		this.createTable();
		this.bindResize();

		setTimeout(() => {
			this.enableTable();
		}, 1);
	}

	createTable() {
		let target = document.getElementById(this.target);

		let container = document.createElement('div');
		container.id = 'LT-container';
		target.appendChild(container);

		let wrapper = document.createElement('div');
		wrapper.id = 'LT-wrapper';
		container.appendChild(wrapper);
		wrapper.style.paddingBottom = wrapper.offsetHeight - wrapper.clientHeight + 'px'; // padding to offset the bottom scroll bar
		wrapper.style.paddingRight = wrapper.offsetWidth - wrapper.clientWidth + 'px'; // padding to offset the right scoll bar

		let table = document.createElement('div');
		table.id = 'LT';
		wrapper.appendChild(table);

		let header = document.createElement('div');
		header.id = 'LT-header';
		table.appendChild(header);

		// Add columns headers
		for (let i = 0; i < this.columns.length; i++) {
			let column = this.columns[i];

			let head = document.createElement('div');
			head.className = 'LT-head column-' + i;

			let sortButton = getSortButton(column);
			head.appendChild(sortButton);

			let text = document.createTextNode(column.title);
			head.appendChild(text);

			let closeButton = getCloseButton(column);
			head.appendChild(closeButton);

			if (column.class) { head.className = head.className + ' ' + column.class; }
			if (column.id) { head.id = column.id; }
		
			header.appendChild(head);
		}

		let body = document.createElement('div');
		body.id = 'LT-body';
		table.appendChild(body);

		this.addRows(this.rows);

		this.bindScroll();
		this.bindClickEvents();
	}

	addRows(rows) {
		this.disableTable();

		// loop through passed rows
		for (let i = 0; i < rows.length; i++) {
			let row_elem = document.createElement('div'); // create row element
			row_elem.className = 'LT-row row-' + i;

			let row = rows[i];

			// loop through columns in this table, to check passed row for its elements
			for (let j = 0; j < this.columns.length; j++) {
				let column = this.columns[j];

				let cell = document.createElement('div'); // create cell element
				cell.className = 'LT-cell column-' + j;

				let text = document.createTextNode(row[column.title].value); // create text node to go in cell
				cell.appendChild(text);

				if (row.class) { cell.className = cell.className + ' ' + row.class; } // if this cell should have a custom class, add it
				if (row.id) { cell.id = row.id; } // if this cell should have an id, add it
				if (column.closed) { cell.className = cell.className + ' LT-closed'; } // display as closed if column is closed

				row_elem.appendChild(cell); // append cell to the row element
			}

			let body = document.getElementById('LT-body');
			body.appendChild(row_elem); // add row to the table body
		}

		this.verticalTicking = false;
		this.enableTable();
	}

	// put an overlay over the table and don't allow changes to it
	disableTable() {
		let wrapper = document.getElementById('LT-wrapper');
		wrapper.style.display = 'none';

		let overlay = document.createElement('div');
		overlay.id = 'LT-overlay';
		document.getElementById('LT-container').appendChild(overlay);
	}

	// revert from above overlay and create cloned (scrollable) header
	enableTable() {
		if (document.getElementById('LT-overlay')) { document.getElementById('LT-overlay').remove(); } // remove overlay
		document.getElementById('LT-wrapper').style.display = 'block'; // show table again

		let cloned_container = document.createElement('div'); // create container for cloned header, this will hide scroll bars
		
		// if a header clone already exists, replace it. otherwise, insert it after original header
		let old_header = document.getElementById('LT-cloned-container');
		if (old_header) {
			old_header.parentNode.replaceChild(cloned_container, old_header);
		} else {
			document.getElementById('LT').insertBefore(cloned_container, document.getElementById('LT-body')); // insert cloned header after original header in DOM
		}
		cloned_container.id = 'LT-cloned-container'; // id is added after adding, so that old_header test (above if statement) can be made properly

		let height = document.getElementById('LT-header').clientHeight;

		let cloned_wrapper = document.createElement('div'); // create wrapper for cloned header, this will have the scroll capabilites.
		cloned_wrapper.style.height = height + 'px';
		cloned_container.appendChild(cloned_wrapper);
		cloned_wrapper.id = 'LT-cloned-wrapper';
		cloned_wrapper.style.paddingBottom = cloned_wrapper.offsetHeight - cloned_wrapper.clientHeight + 'px'; // padding to offset the scroll bar

		let cloned_header = document.getElementById('LT-header').cloneNode(true); // clone header element
		cloned_header.id = 'LT-cloned-header'
		cloned_wrapper.appendChild(cloned_header);

		cloned_container.style.marginTop = -height + 'px'; // move the cloned header up to the same position as the original header
		cloned_container.style.width = document.getElementById('LT-container').clientWidth + 'px';
		cloned_container.style.height = height + 'px'; // set the height, as to hide scroll bars

		// adjust width of head elements
		for (let i = 0; i < this.columns.length; i++) {
			let style = window.getComputedStyle(document.querySelector('#LT-header .column-' + i), null);
			let width = style.getPropertyValue('width');

			let new_header = document.getElementById('LT-cloned-header').getElementsByClassName('column-' + i)[0];

			new_header.style.minWidth = width; // set cloned header cells to the same width as original header cells

			if (this.columns[i].sort) {
				new_header.getElementsByClassName('fa-sort')[0].className = 'fa fa-sort-' + this.columns[i].sort;
			}

			new_header.setAttribute('draggable', 'true');
			new_header.className = new_header.className + ' droppable';
			this.addDragEvents(new_header);
		}

		cloned_wrapper.scrollLeft = document.getElementById('LT-wrapper').scrollLeft;
	}

	// link scroll of body and header,
	// disable exclusive scrolling of header,
	// bind infinite scroll event
	bindScroll() {
		this.ticking = false;
		this.scrollPos = 0; // var to hold x scroll position, to revert to on scroll of cloned header

		let style = window.getComputedStyle(document.getElementById('LT-wrapper'), null);
		let height = parseInt(style.getPropertyValue('height').replace('px', ''));

		// sync scrolling of body with scrolling of cloned header
		document.getElementById('LT-wrapper').onscroll = () => {
			let old_scroll_pos = this.scrollPos;
			this.scrollPos = document.getElementById('LT-wrapper').scrollLeft;

			if (!this.ticking) {
				window.requestAnimationFrame(() => { // this will keep scroll updates to one update per paint event
					if (old_scroll_pos !== this.scrollPos) {
						document.getElementById('LT-cloned-wrapper').scrollLeft = this.scrollPos;
					}
					this.ticking = false;
				});
			}

			if (document.getElementById('LT-wrapper').scrollTop + height == document.getElementById('LT').clientHeight && !this.verticalTicking) {
				this.verticalTicking = true;
				this.infiniteScroll();
			}

			this.ticking = true;
		};

		// disable exclusive scroll of header
		document.getElementById('LT-cloned-wrapper').onscroll = () => {
			document.getElementById('LT-cloned-wrapper').scrollLeft = this.scrollPos;
			document.getElementById('LT-cloned-wrapper').scrollTop = 0;
		};
	}

	// bind global click event. 
	// use event bubbling to reduce # of event binds
	bindClickEvents() {
		document.getElementById('LT-wrapper').onclick = (event) => {
			let target = event.target;

			if (target.className.includes('fa-sort')) { // sort by column
				let innerText = target.parentNode.innerHTML;
				let column = /\/i>(.*)<i/.exec(innerText)[1];

				let headerSorts = document.getElementById('LT').getElementsByClassName('fa');

				for (let i = 0; i < headerSorts.length; i++) {
					if (headerSorts[i].className.includes('fa-sort') && headerSorts[i].parentNode.innerHTML !== innerText) {
						if (headerSorts[i].className.includes('fa-sort-asc')) {
							headerSorts[i].className = headerSorts[i].className.replace('fa-sort-asc', 'fa-sort');
						} else if (headerSorts[i].className.includes('fa-sort-desc')) {
							headerSorts[i].className = headerSorts[i].className.replace('fa-sort-desc', 'fa-sort');
						}
					}
				}

				let direction = null;

				if (target.className.includes('fa-sort-asc')) {
					target.className = target.className.replace('fa-sort-asc', 'fa-sort-desc');

					direction = 'desc';

					this.sort(column, 'desc');
				} else if (target.className.includes('fa-sort-desc')) {
					target.className = target.className.replace('fa-sort-desc', 'fa-sort-asc');

					direction = 'asc';

					this.sort(column, 'asc');
				} else {
					target.className = target.className.replace('fa-sort', 'fa-sort-desc');

					direction = 'desc';

					this.sort(column, 'desc');
				}

				// loop through columns and add sort property to proper one
				for (let i = 0; i < this.columns.length; i++) {
					if (this.columns[i].title == column) {
						this.columns[i].sort = direction;
					} else {
						this.columns[i].sort = null;
					}
				}
			} else if (target.className.includes('fa-times-circle-o')) { // close column
				let column_num = parseInt(/column-([0-9]*)/.exec(target.parentNode.className)[1]);
				let close_elems = document.getElementsByClassName('column-' + column_num);

				this.columns[column_num].closed = true;

				for (let i = 0; i < close_elems.length; i++) {
					close_elems[i].className += ' LT-closed';
				}

				this.enableTable();
			} else if (target.className.includes('LT-closed')) { // show hidden column
				let column_num = parseInt(/column-([0-9]*)/.exec(target.className)[1]);
				let open_elems = document.getElementsByClassName('column-' + column_num);

				this.columns[column_num].closed = false;

				for (let i = 0; i < open_elems.length; i++) {
					open_elems[i].className = open_elems[i].className.replace(' LT-closed', '');
				}

				this.enableTable();
			} else if (target.parentNode.className.includes('LT-row') && !target.parentNode.className.includes('LT-selected')) { // select row and deselect any others
				let selected = document.getElementsByClassName('LT-selected');

				for (let i = 0; i < selected.length; i++) {
					selected[i].className = selected[i].className.replace(' LT-selected', '');
				}

				target.parentNode.className += ' LT-selected';
			} else if (target.parentNode.className.includes('LT-selected')) { // deselect row
				target.parentNode.className = target.parentNode.className.replace(' LT-selected', '');
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
				event.target.className = event.target.className + ' droppable-highlight';
			}
		});

		elem.addEventListener('dragleave', (event) => {
			if (event.target.className.includes('droppable')) {
				event.target.className = event.target.className.replace(' droppable-highlight', '');
			}
		});

		elem.addEventListener('drop', (event) => {
			event.preventDefault();

			if (event.target.className.includes('droppable')) {
				event.target.className = event.target.className.replace(' droppable-highlight', '');

				let index1 = parseInt(/column-([0-9]*)/.exec(event.target.className)[1]);
				let index2 = parseInt(/column-([0-9]*)/.exec(this.dragged.className)[1]);

				this.reorderColumns(index1, index2);
			}
		});
	}

	// switch position of 2 columns
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

		this.addDragEvents(document.getElementById('LT-cloned-header').getElementsByClassName('column-' + index1)[0]);
		this.addDragEvents(document.getElementById('LT-cloned-header').getElementsByClassName('column-' + index2)[0]);
	}

	// bind resize (end of resize)
	// disable table until resize is finished
	bindResize() {
		this.resizeTimer;
		this.isResizing = false;

		window.addEventListener('resize', (event) => {
			clearTimeout(this.resizeTimer);

			if (!this.isResizing) {
				this.isResizing = true;
				this.disableTable();
			}

			this.resizeTimer = setTimeout(() => {
				this.isResizing = false;
				this.enableTable();
			}, 500);
		});
	}

	exportTable(type, name, innerHTMLParse = (innerHTML) => { return innerHTML; }) {
		if (type == 'csv') {
			this.exportCSV(name, innerHTMLParse);
		} else if (type == 'xls') {
			this.exportExcel(name, innerHTMLParse);
		} else if (type == 'pdf') {
			this.exportPDF(name, innerHTMLParse);
		} else if (type == 'print') {
			this.print(name, innerHTMLParse);
		} else {
			console.error('LightTable::exportTable expects type to be csv, xls, pdf or print.');
		}
	}

	exportCSV(name, innerHTMLParse) {
		let head_data = document.getElementById('LT-cloned-header').getElementsByClassName('LT-head');

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

		let table_data = document.getElementsByClassName('LT-cell');

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

	prepExcel(innerHTMLParse) {
		let head_data = document.getElementById('LT-cloned-header').getElementsByClassName('LT-head');

		let data = '<thead><tr>';

		for (let i = 0; i < head_data.length; i++) {
			let th_data = head_data[i].innerHTML;

			th_data = /\/i>(.*)<i/.exec(th_data)[1];

			data += '<th>' + innerHTMLParse(th_data) + '</th>';
		}

		data += '</tr></thead><tbody>';

		let table_data = document.getElementsByClassName('LT-cell');

		let j = 0;
		for (let i = 0; i < table_data.length; i++) {
			if (j == 0) {
				data += '<tr>';
			}

			data += '<td>' + innerHTMLParse(table_data[i].innerHTML) + '</td>';

			if (j == this.columns.length - 1) {
				data += '</tr>';
				j = 0;
			} else {
				j++;
			}
		}

		return data;
	}

	exportPDF(name, innerHTMLParse) {
		let th = document.getElementById('LT-cloned-header').getElementsByClassName('LT-head');
		let header_row = [];
		let widths = [];

		for (let i = 0; i < th.length; i++) {
			if (!/LT-closed/.test(th[i].outerHTML)) {
				header_row.push({ text: /\/i>(.*)<i/.exec(th[i].innerHTML)[1], style: 'tableHeader' });

				widths.push('auto');
			}
		}

		let table_body = [header_row];

		let rows = document.getElementsByClassName('LT-row');
		for (let i = 0; i < rows.length; i++) {
			let row = [];
			let row_data = rows[i].getElementsByClassName('LT-cell');

			for (let j = 0; j < row_data.length; j++) {
				if (!/LT-close/.test(row_data[j].outerHTML)) {
					if (!/<img/.test(row_data[j].innerHTML)) {
						if (i % 2 == 0) {
							row.push({ text: innerHTMLParse(row_data[j].innerHTML), style: 'evenRow' });
						} else {
							row.push(innerHTMLParse(row_data[j].innerHTML));
						}
					} else {
						if (i % 2 == 0) {
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
				{text: name, style: 'header', alignment: 'center' },
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

		if (pdfMake) {
			pdfMake.createPdf(docDefinition).download(name);
		} else {
			console.error('LightTable requires pdfMake to export a PDF.');
		}
	}

	print(name, innerHTMLParse) {
		let new_table = document.getElementById('LT').cloneNode(true);
		new_table.className = 'print';

		let hide_elements = document.body.children;
		for (let i = 0; i < hide_elements.length; i++) {
			hide_elements[i].style.display = 'none';
		}

		// new_table.getElementById('LT-cloned-header').style.width = '100%';

		let td = new_table.getElementsByClassName('LT-cell');
		for (let i = 0; i < td.length; i++) {
			td[i].innerHTML = innerHTMLParse(td[i].innerHTML);
		}

		document.body.appendChild(new_table);

		window.print();

		setTimeout(() => {
			document.body.removeChild(new_table);

			for (let i = 0; i < hide_elements.length; i++) {
				hide_elements[i].style.display = 'block';
			}
		}, 10);
	}
}

// return sort button
const getSortButton = (column) => {
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
const getCloseButton = (column) => {
	let closeButton = document.createElement('i');

	closeButton.setAttribute('aria-hidden', 'true');
	closeButton.className = 'fa fa-times-circle-o';

	return closeButton;
}



// base64 encode
const base64 = (s) => {
	return window.btoa(unescape(encodeURIComponent(s)));
}

// excel template strings
const excelTemplateFirst = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>{worksheet}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><table>';
const excelTemplateLast = '</table></body></html>';