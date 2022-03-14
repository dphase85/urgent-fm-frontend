
const callMixcloud = () => {
	const request = new Request('https://api.mixcloud.com/urgentfm/cloudcasts/?limit=5');
	getData(request, populateEditorsPick, printErrorMessage);
};

const pageRequest = (getUrl) => {

	let url;
	if (getUrl === null) {
		url = getURL();
	} else {
		url = getUrl;
	}

	const request = new Request(url, {
		headers: new Headers({
			'X-Requested-With': 'XMLHttpRequest'
		})
	});

	getData(request, pageUpdate, printErrorMessage);
};

// Later refactoren (naam, ook andere data dan nieuws kunnen mee opzoeken)!
const callGraphQlAPI = (newsquery) => {
	const query = `{
		entries(section: "nieuws", relatedToCategories: {title: [${newsquery}]}) {
			  title,
			  ... on nieuws_nieuws_Entry {
				intro
			image {
				first: url @transform(format: "jpg", mode: "crop", quality: 90)
				next: url @transform(format: "jpeg", mode: "crop", quality: 90, width: 636, height: 424)
				title
			}
			nieuwsCategories {
				title
				url
			  }
			}
			  url,
			  postDate,
			  slug,
			  sectionHandle
			}
		  }
	  `;

	const request = new Request('http://localhost/api', {
		method: 'POST',
		headers: new Headers({
			'Content-type': 'application/json',
			'Accept': 'application/json'
		}),
		body: JSON.stringify({
			query})
	});
	
	getData(request, populateNewslisting, printErrorMessage);
};

const getData = (request, succeed, fail) => {
	fetch(request)
		.then(response => handleErrors(response))
		.then(text => parseData(text))
		.then(data => succeed(data))
		.catch(error => fail(error));
}

const handleErrors = (response) => {
	let text;
	if (!response.ok) {
		throw (response.status + ': ' + response.statusText);
	}
	const contentType = response.headers.get('content-type');
	if (!contentType) {
		throw new TypeError('No content provided: ' + contentType);
	}

	if (contentType === 'application/json') {
		text = response.json();
	} else {
		text = response.text();
	}

	
	return text;
};

const parseData = (text) => {
	let data;
	try {
		data = JSON.parse(text);
		return data;
	}
	catch {
		return data = text;
	}
};

const printErrorMessage = (error) => {
	console.log(error);
};


const pageUpdate = (responseText) => {

	if (responseText !== null) {
		let parentNode = document.querySelector('.content');
		const parser = new DOMParser();
		const doc = parser.parseFromString(responseText, 'text/html');
		const newChildNodes = doc.body.childNodes;
		clearParentNode(parentNode);

		newChildNodes.forEach(n => parentNode.appendChild(n));
		const url = getURL();
		document.title = location.pathname; // TODO titel mag een beetje mooier gepresenteerd worden!
		router(url);
	}
};

/* Route to right endpoints for setting up functionallity */
const router = (url) => {
	// Ignore an incidental slash at ending of url but exclude pathname-url for homepage ('/').
	if (url.endsWith('/') && url.length > 1) {
		url = url.slice(0, url.length-1);
	}
	// Route the destination url to the right set of webpage-related functions
	if (url === '/') {
		setAnchors();
		callMixcloud();
	} else if (url === '/programma') {
		setAnchors();
		populateProgramSchema();
		setDisplay();
	} else if (url === '/nieuws' || url.includes('/nieuws?page=')){
		setAnchors();
		let filters ;
		let queryP;
		if (!history.state.filters) {
			filters = initFilter();
			queryP = "";
		} else {
			filters  = history.state.filters;
			let cbFilters = document.querySelectorAll('.cbFilter');
			cbFilters[0].addEventListener('change', checkDefaultfilter);
			cbFilters[0].checked = filters[0];
			for (let i =1; i < cbFilters.length; i++) {
				cbFilters[i].addEventListener('change', checkFilter);
				cbFilters[i].checked = filters[i];
			}
			queryP = buildFilterQuery();
		}
		
		let scrollY = history.state.scrollY;
		let page;
		if (history.state.page) {
			page = history.state.page;
		} else {
			page = null;
		}
		let url = location.pathname + location.search
		history.replaceState({scrollY: scrollY, page: page, filters: filters},'', url)
		// fetch data when paginating 
		callGraphQlAPI(queryP);

	} else if (url === '/zoek/resultaten') {
		setAnchors();
		closeSearch();
		setDisplay();		
	} else {
		setAnchors();
		setDisplay();
	}
};

// Navigate to new page when clicking on anchor link
const navigate = (e) => {
	e.preventDefault();
	// first check for pagination
	let page = null;
	let filters = null;
	if (history.state.page) {
		page = history.state.page;
	}
	if (history.state.filters) {
		filters = history.state.filters;
	}
	history.replaceState({scrollY: window.scrollY, page: page, filters: filters},'',location.pathname + location.search);

	let nextUrl = null;
	let forms = document.querySelectorAll('.formZoek');
	if ((e.currentTarget).id === 'btnZoek') {
		let formAction; 
		let q;
		let filterQ = '';
		forms.forEach(form => {
			// if (form[0].value !== '') {
				filters = form.querySelectorAll('.cbFilter');
				if (filters.length > 0) {
					filterQ = '&filters=';
				}
				for (let i = 0; i < filters.length; i++) {
					if (filters[i].checked === true) {
						filterQ += filters[i].value;
						if (i+1 < filters.length) {
							filterQ += ', ';
						}
					}
				}
				formAction = `${form.action}?q=`;
				q = form[0].value;
				nextUrl = formAction + q + filterQ;
				history.pushState({}, '', nextUrl);
				pageRequest(nextUrl);
			// }
		})


	} else {
		forms.forEach(form => {
			form.value = '';
		})
		let href = (e.currentTarget).getAttribute('href');
		if (href !== getURL()) {
			nextUrl = href;

			history.pushState({scrollY: 0}, '', nextUrl);

			pageRequest(nextUrl);
		}
	}
};

// Change pagination page
const paginationChangePage = (e) => {
	e.preventDefault();

	let page = history.state.page;
	let filters = history.state.filters;
	
	history.replaceState({scrollY: window.scrollY, page: page, filters: filters},'', location.pathname + location.search);

	let goToPage = (e.currentTarget).getAttribute('data-page');
	let nextUrl = `?page=${goToPage}`;
	
	history.pushState({scrollY: 0, page: goToPage, filters: filters},'',nextUrl);
	setDisplay();

	let query = buildFilterQuery();

	callGraphQlAPI(query);
};


/* Helper functions */ 
const clearParentNode = (parentNode) => {
	while (parentNode.lastChild) {
		// of lastchild.remove() gebruiken?
		parentNode.removeChild(parentNode.lastChild);
	}
}

// Set display on initial or last position
const setDisplay = () => {
	let scrollBackTo = history.state.scrollY;
	window.scroll(0, scrollBackTo);
};

const getURL = () => {
	return location.pathname.toLowerCase();
	};

// Set internal anchorlinks.
const setAnchors = () => {
	// TODO: efficientere toepassing vinden (bv. pas bij click op juise anchor actie ondernemen, ipv telkens ankers te moeten toewijzen)
	let anchors = document.querySelectorAll('a:not(#yii-debug-toolbar a, footer a, .social-media-link, a[href^=\'mailto:\']), #btnZoek, anchor-pagination'); // DEV: not statement enkel in DEV mode!

	anchors.forEach(a => a.addEventListener('click', navigate));
};

// Livestream player controls
const switchState = () => {
	if (liveAudio.paused === true) {
		liveAudio.play();
		audioControl.textContent="play";
	} else {
		liveAudio.pause();
	}
};

// Search overlay controls
const openSearch = () => {
	let overlay = document.querySelector('.overlay');
	overlay.style.display = 'block';
};

const closeSearch = () => {
	let overlay = document.querySelector('.overlay');
	let searchbar = document.querySelector('.searchbar');

	overlay.style.display = 'none';
	searchbar.value = '';
};

// Initialize filters when loading paginated pages for the first time, set eventlisteners and return checkbox values
const initFilter = () => {
	let cbFilters = document.querySelectorAll('.cbFilter');
	let cbDefaultfilter = document.querySelector('.cbDefaultfilter');
	let filters = [];
	// Set defaultfilter and add eventlistener
	cbDefaultfilter.checked = true;
	cbDefaultfilter.addEventListener('change', checkDefaultfilter);
	// Collect checkbox values and add eventlistener(s)
	filters[0] = cbDefaultfilter.checked;
	for (let i =1; i < cbFilters.length; i++) {
		cbFilters[i].addEventListener('change', checkFilter);
		filters[i] = cbFilters[i].checked;
	}

	return filters;
};

// Defaultfilter control
const checkDefaultfilter = () => {
	let cbDefaultfilter = document.querySelector('.cbDefaultfilter');
	let cbFilters = document.querySelectorAll('.cbFilter');
	let checkCount = 0;
	// Don't count defaultfilter, so let i = 1
	for (let i = 1; i < cbFilters.length; i++) {
		if (cbFilters[i].checked) {
			checkCount++;
		}
	}
	// If defaultfilter is not checked, but other filters are, then check defaultfilter and uncheck all other filters,
	// else if defaultfilter is checked, and no other filters, then do nothing
	if (cbDefaultfilter.checked === true && checkCount > 0) {
		let filters = [];
		filters[0] = cbDefaultfilter.checked;
		for (let i =1; i < cbFilters.length; i++) {
			filters[i] = cbFilters[i].checked = false;
		}
		history.replaceState({scrollY: window.scrollY, page: null, filters: filters},'', location.pathname);
		const queryP = buildFilterQuery();
		callGraphQlAPI(queryP);
	} else if (cbDefaultfilter.checked === false && checkCount === 0) {
		cbDefaultfilter.checked = true;
	}
}

// Switch off default checkbox on nieuwsindex when selecting other checkboxes
// or switch on when deselecting them.
const checkFilter = (e) => {
	let cbDefaultfilter = document.querySelector('.cbDefaultfilter');
	let cbFilters = document.querySelectorAll('.cbFilter');
	let filters = [];
	let checkCount = 0;
	// Don't count defaultfilter, so let i = 1
	for (let i = 1; i < cbFilters.length; i++) {
		if (cbFilters[i].checked) {
			checkCount++;
		}
	}
	// Select defaultfilter when no filter is selected, or vice versa
	if (checkCount === 0) {
		cbDefaultfilter.checked = true;
	} else {
		cbDefaultfilter.checked = false;
	}
	// Save filter check values to state object
	filters[0] = cbDefaultfilter.checked;
	for (let i =1; i < cbFilters.length; i++) {
		filters[i] = cbFilters[i].checked;
	}
	history.replaceState({scrollY: window.scrollY, page: null, filters: filters},'', location.pathname);
	// Fetch GraphQL query parameters and update page
	const queryP = buildFilterQuery();
	callGraphQlAPI(queryP);
};

// Return filterquery parameters for GraphQL call
const buildFilterQuery = () => {
	let cbFilters = document.querySelectorAll('.cbFilter');
	let queryP = '';
	let q;
	let checkCount = 0;
	// Skip defaultfilter, so i = 1 
	for (let i = 1; i < cbFilters.length; i++) {
		if (cbFilters[i].checked) {
			checkCount++;
			q = '"' + cbFilters[i].value + '"';
			queryP += q;
		}
	}

	return queryP;
};


// Populate paginated lists 
const populateNewslisting = (response) => { // nextpage
	// Fetch data
	const data = response['data'];
	// Go to next page: if '/nieuws' initially loads, nextpage is set to page 1
	let nextPage;
	if (history.state.page) {
		nextPage = history.state.page;
	} else {
		nextPage = 1;
	}
	


	//// TEST
	// sessionStorage.setItem('urgentfm.data.newslisting', data);
	const entries = data['entries'];
	// console.log("Aantal entries: " + entries.length); // Devmode
	
	// Window size => Dit kan later nog variabele worden, 
	// zodat bv. bezoeker vd webpage zelf aantal resultaten per pagina kan aangeven! (bv. 5, 10, 15 res. per page)
	let wndow = 3;

	// Calculate number of pages for pagination:
	let totalPages = Math.ceil(entries.length/wndow);
	// console.log("Aantal pagina's: " + totalPages);
	
	// First check for current page value =>
	// Kijk eerst in localstorage indien een waarde aanwezig is: deze waarde is de page die open was voor page refresh. 
	// Indien de waarde groter is dan het nieuwe totaal aantal pages: plaats window op page 1 (max value = window, min value = max -window)
	// Indien de waarde gelijk is aan de vorige waarde in localstorage: stel window op zelfde pagina als voor refresh
	// Geen waarde aanwezig (undefined of null): dit is een page load: stel window op initiële waarde (= page 1)

	///////
	// We gaan eerst uit van beginsituatie ==> page load. Daarna verandering bij filters, daarna bij page clicks in paginatie!!

	// Then define min and max values for window:
	let max = nextPage * wndow;
	let min = max - wndow;
	// Finally, populate the page with entries
	let nieuwsListing = document.querySelector('.nieuws-listing');
	if (nieuwsListing.hasChildNodes) {
		clearParentNode(nieuwsListing);
	}
	let entry;
	let classListTegel;
	let classListNwsItemCopy; // Redundant code?
	let row;
	// DEVmode:
	// console.log(data);

	// Build first row
	if (entries) {
		entry = entries[min];
		const first = 'first';
		classListTegel = ['p-0', 'tegel', 'firstRow'];
		classListNwsItemCopy = ['card-body', 'newsitemCopy'];
		row = document.createElement('div');
		row.classList.add('row');
		nieuwsListing.appendChild(row);
	
		buildCard(entry, first, row, classListNwsItemCopy, classListTegel);
	}

	// Build rowcols
	if (entries.length > 1) {
		row = document.createElement('div');
		row.classList.add('row', 'row-cols-1', 'row-cols-md-2', 'row-cols-lg-2', 'not-first-row');
		nieuwsListing.appendChild(row);
		classListTegel = ['card', 'border-0', 'p-0', 'tegel'];
		classListNwsItemCopy = ['cardbody', 'nwsItemCopy'];
		if (max > entries.length) {
			max = entries.length;
		}
		for (let i = min + 1; i < max; i++) {
			entry = entries[i];
			let next = 'next';
			buildCard(entry, next, row, classListNwsItemCopy, classListTegel);
		}
	}

	// Add pagination
	if (totalPages > 1) {
		let ul = document.createElement('ul');
		let li;
		let a;

		let span;
		nieuwsListing.appendChild(ul);
		for (let i= 1; i <= totalPages; i++) {
			li = document.createElement('li');
			a = document.createElement('a');
			span = document.createElement('span');

			span.textContent = i.toString();
			
			if (i !== parseInt(nextPage)) {
				a.href =  location.pathname;
				a.style.backgroundColor = "red";
				a.setAttribute('data-page', i.toString());
				a.addEventListener('click', paginationChangePage);
				li.classList.add('anchor-pagination');
				setAnchors();
				a.appendChild(span);
				li.appendChild(a);
			} else {
				li.appendChild(span);
			}

			ul.appendChild(li);
		}
	}

	// Set display after building up the page, so the right scrollY value is used after popstate event!
	setDisplay();
};


const buildCard = (entry, imgURL, row, classListNwsItemCopy, classListTegel) => {
	// Create html-elements
	let article = document.createElement('article');
	let tegel = document.createElement('div');
	let tegelAnchor = document.createElement('a');
	let img = document.createElement('img');
	let categoryContainer = document.createElement('div');
	let categoryContainerAnchor = document.createElement('a');
	let categoryContainerAnchorSpan = document.createElement('span');
	let nwsItemCopy = document.createElement('div');
	let nwsItemCopyAnchor = document.createElement('a');
	let nwsItemCopyH3 = document.createElement('h3');
	let newsItemCopyP = document.createElement('p');

	// Add classnames to html-elements
	article.classList.add('col', 'mt-3'); 
	classListTegel.forEach(item => {
		tegel.classList.add(item);
	})
	tegelAnchor.classList.add('nwsItemTitle');
	img.classList.add('img-fluid');
	categoryContainer.classList.add('categoryContainer');
	categoryContainerAnchor.classList.add('small');
	classListNwsItemCopy.forEach(item => {
		nwsItemCopy.classList.add(item); 
	})
	nwsItemCopyAnchor.classList.add('nwsItemTitle');

	// Add attributes to html-elements
	tegelAnchor.href = entry['url'];
	imageArray = entry['image'];
	image = imageArray[0];
	img.src = image[imgURL];
	img.alt = image['title'];
	const categories = entry['nieuwsCategories'];
	const category = categories[0];
	const categoryURL = category['url'];
	const categoryTitle = category['title'];
	categoryContainerAnchor.href = categoryURL;
	categoryContainerAnchorSpan.textContent = categoryTitle;
	nwsItemCopyAnchor.href = entry['url'];
	nwsItemCopyH3.textContent = entry['title'];
	newsItemCopyP.textContent = entry['intro'];
	
	// Append childelements
	row.appendChild(article);
	article.appendChild(tegel);
	tegel.appendChild(tegelAnchor);
	tegelAnchor.appendChild(img);
	categoryContainerAnchor.appendChild(categoryContainerAnchorSpan);
	categoryContainer.appendChild(categoryContainerAnchor)
	tegel.appendChild(categoryContainer);
	nwsItemCopyAnchor.appendChild(nwsItemCopyH3);
	nwsItemCopyAnchor.appendChild(newsItemCopyP);
	nwsItemCopy.appendChild(nwsItemCopyAnchor);
	tegel.appendChild(nwsItemCopy);
}

const populateEditorsPick = (response) => {
	const parsedData = response;

	let pick;
	let a;
	let img;
	let strong;
	let pictures;
	let name;

	data = parsedData['data'];

	for (let i = 0; i < data.length; i++) {
		let entry = data[i];
		pick = `#pick-${i}`;
		a = document.querySelector(`${pick} a`);
		img = document.querySelector(`${pick} img`);
		strong = document.querySelector(`${pick} strong`);
		pictures = entry['pictures'];
		name = entry['name'];
		a.href = `https://mixcloud.com${entry['key']}`;
		img.src = pictures['large'];
		img.alt = `Thumbnail of ${name}`;
		strong.textContent = name;
	}

	// !!! Scrolback positie klopt enkel indien hier scrollback uitgevoerd!!!
	setDisplay();
};

// Window Events
const onload = () => {

	// Ajax navigation
	history.scrollRestoration = 'auto';
	let currentUrl = getURL();

	// Voorkom bij terugkeren naar deze website dat eventuele paginering of zoekterm verloren geraakt
	if (document.location.search) {
		// TEST voorlopig enkel voor /nieuws, vul aan met bv. search of resultaten om uit te breiden
		if (document.location.pathname === '/nieuws' &&  document.location.search.includes('?page=')) {
			let searchpage = document.location.search.charAt(document.location.search.length-1);
			let scrollY = 0;
			if (history.state !== null) {
				scrollY = history.state.scrollY;
			}
			currentUrl = location.pathname + location.search;
			// TODO: unload event aanmaken om scrollY-waarde op te slaan in history.state bij verlaten website of reload event
			history.replaceState({scrollY: scrollY, page: searchpage}, null, currentUrl);
		} 
	} else {
		let locationSearch = document.location.search;
		currentUrl = currentUrl + locationSearch;

		history.replaceState({scrollY: 0}, '', currentUrl);
	}
	// Audio player 
	const liveAudio = document.querySelector('.live-audio');
	const audioControl = document.querySelector('.audio-control');
	// Searchform overlay
	const search = document.querySelector('.search');
	const close = document.querySelector('.close');
	
	search.addEventListener('click', openSearch);
	close.addEventListener('click', closeSearch);

	audioControl.addEventListener('click', (e) => {
		if (liveAudio.paused === true) {
			liveAudio.play();
			audioControl.textContent = "play"
		} else {
			liveAudio.pause();
			audioControl.textContent = "pause";
		}
	});
	
	router(currentUrl);
};

// return to page when clicking on browser's "back" or "forward" button
window.addEventListener('popstate', e => {
	e.preventDefault();

	let url = getURL();
	if (location.search) {
		url = url.concat(location.search);
	}

	pageRequest(url);
});

window.addEventListener('load', onload);

