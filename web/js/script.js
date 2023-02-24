// const hostname = 'https://urgent.johanraes.be';
const hostname = 'http://localhost';

const callMixcloud = () => {
	const request = new Request('https://api.mixcloud.com/urgentfm/cloudcasts/?limit=15');
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
		router(url);
	}
};

/* Route to right endpoints for setting up functionallity */
const router = (url) => {
	// Ignore an incidental slash at ending of url but exclude pathname-url for homepage ('/').
	if (url.endsWith('/') && url.length > 1) {
		url = url.slice(0, url.length - 1);
	}
	// indien link gedeeld wordt op facebook bv, en er wordt een parameter aan de link bijgeplakt, maak een tijdelijke url aan en extraheer pathname
	let temp = new URL(url, hostname);
	url = temp.pathname;
	// Route the destination url to the right set of webpage-related functions
	if (url === '/') {
		setAnchors();
		callMixcloud();
		// eslint-disable-next-line no-undef
		swiffyslider.init(rootElement = document.body);
		document.title = 'Urgent.fm 105.3'
	} else if (url.includes('/programma')) {
		setAnchors();
		// activeer eerste tab bij inladen pagina
		let tabDay = -1;
		let title;
		switch (url) {
			case '/programma/zondag':
				tabDay = 0;
				break;
			case '/programma/maandag':
				tabDay = 1;
				break;
			case '/programma/dinsdag':
				tabDay = 2;
				break;
			case '/programma/woensdag':
				tabDay = 3;
				break;
			case '/programma/donderdag':
				tabDay = 4;
				break;
			case '/programma/vrijdag':
				tabDay = 5;
				break;
			case '/programma/zaterdag':
				tabDay = 6;
				break;
			case '/programma':
				// Zondag = 0, maandag 1 enz. Tabday is de 'juiste' dagnummer die door JS gebruikt wordt.
				tabDay = new Date().getDay();
				break;
			default:
				title = document.querySelector('#title').dataset.title;
		}

		if (tabDay >= 0) {
			// eslint-disable-next-line no-undef
			populateProgramSchema(tabDay);
			title = 'Programma';
		}

		setDisplay();
		document.title = `${title} | Urgent.fm 105.3`;

	} else if (url === '/nieuws' || url.includes('/nieuws?page')) {
		setAnchors();
		url = location.pathname + location.search;
		history.replaceState({ scrollY: history.state.scrollY, filters: null }, '', url);
		document.title = 'Nieuws | Urgent.fm 105.3'
		setDisplay();
	} else if (url === '/zoek/resultaten' || url.includes('/zoek/resultaten?page') || url === '/zoek' || url.includes('/zoek')) {
		closeSearch();
		setAnchors();
		let filters;
		if (!history.state.filters) {
			filters = initFilter();
		} else {
			filters = history.state.filters;
			let cbFilters = document.querySelectorAll('.cb-filter');
			cbFilters[0].addEventListener('change', checkDefaultfilter);
			cbFilters[0].checked = filters[0];
			for (let i = 1; i < cbFilters.length; i++) {
				cbFilters[i].addEventListener('change', checkFilter);
				cbFilters[i].checked = filters[i];
			}
		}
		history.replaceState({ scrollY: history.state.scrollY, filters: filters }, '', location.pathname + location.search);
		document.title = 'Zoek | Urgent.fm 105.3';
		setDisplay();
	} else {
		setAnchors();
		document.title = `${document.querySelector('#title').dataset.title} | Urgent.fm 105.3`;
		setDisplay();
	}
	setActiveNavItem(url);
};

/** Clear the active nav items before selecting the new active nav item */
const setActiveNavItem = (url) => {
	// First clear all possible active nav items
	const navItems = document.querySelectorAll('.navbar .navbar-nav .nav-item');
	navItems.forEach(navItem => {
		navItem.classList.remove('nav-active');
	})

	// make go to nav item active
	let navItem;
	if (url.startsWith('/programma')) {
		navItem = document.querySelector('#programma');
		navItem.classList.add('nav-active');
	} else if (url.startsWith('/nieuws')) {
		navItem = document.querySelector('#nieuws');
		navItem.classList.add('nav-active');
	} else if (url.startsWith('/wie-zijn-we') || url.startsWith('/workshops')) {
		navItem = document.querySelector('#over-urgent-fm');
		navItem.classList.add('nav-active');
	} else if (url === '/contact') {
		navItem = document.querySelector('#contact');
		navItem.classList.add('nav-active');
	}
}

// Navigate to new page when clicking on anchor link
const navigate = (e) => {
	e.preventDefault();

	// Prevent navigation toe 'zoek' when clicking on navbar searchbutton
	if ((e.currentTarget).classList.contains('search')) {
		return;
	}

	let destinationUrl;
	let currentUrl;
	const filters = history.state.filters;

	// If there are filters on paginated pages, set filter state for current page (when navigating back, filter state can be restored)
	currentUrl = location.pathname + location.search;
	history.replaceState({ scrollY: window.scrollY, filters: filters ?? null }, '', currentUrl);


	// Navigate to search results
	if ((e.currentTarget).classList.contains('btnZoek')) {
		const form = (e.currentTarget).form;
		// Prevent performing empty search query
		if (form[0].value.length === 0) {
			return;
		}

		destinationUrl = `${form.action}?q=${form[0].value}`;

		if (filters) {
			filters[0] = true;
			for (let i = 1; i < filters.length; i++) {
				filters[i] = false;
			}
		}

		history.pushState({ scrollY: 0, filters: filters }, '', destinationUrl);
		pageRequest(destinationUrl);

		return;
	}

	// Navigate to other pages

	// First clear (navbar) searchform(s)
	let forms = document.querySelectorAll('.formZoek');
	forms.forEach(form => {
		form[0].value = '';
	})
	// Then get destination url 
	destinationUrl = (e.currentTarget).getAttribute('href').toString();

	currentUrl = getURL();
	// If current URL equals destination URL, prevent reloading page
	if (destinationUrl === currentUrl) {
		return;
	}

	// If destination is external website, open new window and abort function
	if (!destinationUrl.startsWith(hostname) && (destinationUrl.startsWith('http://') || destinationUrl.startsWith('https://'))) {
		window.open(destinationUrl, '_blank')
		return;
	}

	// If destination is link from cookiebanner, abort function
	if (destinationUrl === 'javascript:void(0);') {
		return;
	}

	// Perform navigation
	let scrollY = 0;
	// Indien focus moet behouden worden op scrollpositie bij pagineren, zie of het a-element de pagination-focus klasnaam bezit:
	// if (e.currentTarget.classList.contains('pagination-focus')) {
	// 	scrollY = window.scrollY;
	// }
	history.pushState({ scrollY: scrollY, filters: filters ?? null }, '', destinationUrl);
	pageRequest(destinationUrl);
};


/* Helper functions */
const clearParentNode = (parentNode) => {
	while (parentNode.lastChild) {
		parentNode.removeChild(parentNode.lastChild);
	}
};

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
	const anchors = document.querySelectorAll('a:not(#yii-debug-toolbar a, .social-media-link, a[href^=\'mailto:\'], .mixcloud-link), .btnZoek'); // DEV: not statement enkel in DEV mode!

	anchors.forEach(a => a.addEventListener('click', navigate));
};

// Search overlay controls
const openSearch = (e) => {
	e.preventDefault();
	const modal = document.querySelector('.modal-search');
	const overlay = document.querySelector('.overlay');
	const body = document.querySelector('body');

	modal.style.display = 'block';
	overlay.style.display = 'block';
	body.style.overflow = 'hidden';
};

const closeSearch = () => {
	const overlay = document.querySelector('.overlay');
	const searchbar = document.querySelector('.modal-search');
	const body = document.querySelector('body');

	overlay.style.display = 'none';
	searchbar.style.display = 'none';
	body.style.overflow = 'auto';
};

// Initialize filters when loading paginated pages for the first time, set eventlisteners and return checkbox values
const initFilter = () => {
	const cbFilters = document.querySelectorAll('.cb-filter');
	const cbDefaultfilter = document.querySelector('.cb-defaultfilter');
	const filters = [];

	// Set defaultfilter and add eventlistener
	cbDefaultfilter.checked = true;
	cbDefaultfilter.addEventListener('change', checkDefaultfilter);
	// Collect other checkbox values and add eventlistener(s)
	filters[0] = cbDefaultfilter.checked;
	for (let i = 1; i < cbFilters.length; i++) {
		cbFilters[i].addEventListener('change', checkFilter);
		filters[i] = cbFilters[i].checked;
	}

	return filters;
};

// Defaultfilter control
const checkDefaultfilter = () => {
	const cbDefaultfilter = document.querySelector('.cb-defaultfilter');
	const cbFilters = document.querySelectorAll('.cb-filter');
	let checkCount = 0;

	// Don't count defaultfilter, so let i = 1
	for (let i = 1; i < cbFilters.length; i++) {
		if (cbFilters[i].checked) {
			checkCount++;
		}
	}

	// If defaultfilter is checked, and no other filters, then do nothing and return.
	if (cbDefaultfilter.checked === false && checkCount === 0) {
		cbDefaultfilter.checked = true;
		return;
	}

	// If defaultfilter is not checked, but other filters are, then check defaultfilter, uncheck all other filters and refresh page
	const filters = [];
	filters[0] = cbDefaultfilter.checked;
	for (let i = 1; i < cbFilters.length; i++) {
		filters[i] = cbFilters[i].checked = false;
	}
	const url = buildFilterURLParam();
	history.replaceState({ scrollY: window.scrollY, page: null, filters: filters }, '', url);
	pageRequest(url);
};

const buildFilterURLParam = () => {
	const formZoek = document.querySelector('.form-zoek');
	const url = `${formZoek.action}`;
	const cbFilters = formZoek.querySelectorAll('.cb-filter');
	const query = `?q=${formZoek[0].value}`;
	const cbDefaultfilter = cbFilters[0];

	// If default filter is checked, return url + search query
	if (cbDefaultfilter.checked === true) {
		return url + query;
	}

	// else, build parameter query and return url with search query and url parameters
	let urlParams = '&categorie=';
	let cbFilter;

	for (let i = 1; i < cbFilters.length; i++) {
		cbFilter = cbFilters[i];
		if (cbFilter.checked === true) {
			urlParams += cbFilter.value;
			urlParams += ',';
		}
	}

	return url + query + urlParams.trim().slice(0, urlParams.length - 1);
};

// Switch off default checkbox on nieuwsindex when selecting other checkboxes
// or switch on when deselecting them.
const checkFilter = () => {
	const cbDefaultfilter = document.querySelector('.cb-defaultfilter');
	const cbFilters = document.querySelectorAll('.cb-filter');
	const filters = [];
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
	for (let i = 1; i < cbFilters.length; i++) {
		filters[i] = cbFilters[i].checked;
	}

	const url = buildFilterURLParam();
	history.replaceState({ scrollY: window.scrollY, page: null, filters: filters }, '', url);
	pageRequest(url);
};

const populateEditorsPick = (response) => {
	const parsedData = response;

	let entry;
	let pick;
	let a;
	let img;
	let p;
	let pictures;
	let name;

	const data = parsedData['data'];

	for (let i = 0; i < data.length; i++) {
		entry = data[i];
		pick = `#pick-${i}`;
		a = document.querySelector(`${pick} a`);
		img = document.querySelector(`${pick} img`);
		p = document.querySelector(`${pick} p`);
		pictures = entry['pictures'];
		name = entry['name'];
		a.href = `https://mixcloud.com${entry['key']}`;
		img.src = pictures['large'];
		img.alt = `Thumbnail of ${name}`;
		p.textContent = name;
	}

	// !!! Scrolback positie klopt enkel indien hier scrollback uitgevoerd!!!
	setDisplay();
};

const fetchTimetable = () => {
	//TODO: Kan searchquery nog verder gespecifieerd worden?
	const query = `{
		entries(section: "programScheme" orderBy: "title") {
		  title
		  ... on programScheme_programScheme_Entry {
			weekdag {
			  ... on weekdag_timeSlot_BlockType {
				beginuur
				einduur
				programma {
				  title
				  url
				}
			  }
			}
			}
		}
	  }
	  `;

	const request = new Request(`${hostname}/api`, {
		method: 'POST',
		headers: new Headers({
			'Content-type': 'application/json',
			'Accept': 'application/json',
		}),
		body: JSON.stringify({
			query
		})
	});

	getData(request, updateCurrentlyPlaying, printErrorMessage);
};

// Update audioplayer title and homepage programscheme if new timeslot started.
const updateCurrentlyPlaying = (data) => {
	const entries = data['data']['entries'];
	const d = new Date();
	const currentHour = parseInt(d.getHours());
	let currentDay = d.getDay();

	//  als h < 7 (== het is nog geen 7 uur AM), neem de vorige dag
	if (currentHour < 7) {
		currentDay -= 1;
		// indien dag == zondag, dan dagnr veranderen naar zaterdag
		if (currentDay < 0) {
			currentDay = 6;
		}
	}

	// Find current timeslot
	const ttDay = entries[currentDay];
	const timeslots = ttDay['weekdag'];

	const currentTimeslot = timeslots.find(timeslot => {
		const beginuurTS = timeslot['beginuur'];
		const beginuur = parseInt(beginuurTS.substring(11, 13));
		const einduurTS = timeslot['einduur'];
		const einduur = parseInt(einduurTS.substring(11, 13));

		if ((currentHour >= beginuur && currentHour < einduur) || (currentHour >= beginuur && einduur < beginuur)) {
			return true;
		}

		return false
	})
	// update audio player: (luister nu) program title
	const programma = currentTimeslot['programma'][0];
	const currentlyPlaying = document.querySelector('.audioplayer-currently-playing a');
	currentlyPlaying.innerHTML = programma['title'];
	currentlyPlaying.href = programma['url'];

	//reload homepage
	if (location.pathname == '/') {
		pageRequest(location.pathname);
	}

};

const checkCurrentTime = () => {
	const date = new Date();
	// Check if it's presicely a new hour (e.g. 15h00)
	const minute = date.getMinutes();
	// if true, then get the timetable data from sessionstorage
	// and check if new program is on air or not
	if (minute == 0) {
		fetchTimetable();
		setTimeout(checkCurrentTime, 60000);
	} else {
		// Check every 30 seconds again for current time
		setTimeout(checkCurrentTime, 30000);
	}
};

// Window Events
// eslint-disable-next-line no-redeclare
const onload = () => {

	// Ajax navigation
	history.scrollRestoration = 'auto';
	let currentUrl = getURL();
	let scrollY = 0;

	if (document.location.search) {
		currentUrl += document.location.search;
	}

	history.replaceState({ scrollY: scrollY, filters: history.state.filters ?? null }, '', currentUrl);

	// Searchform overlay
	const searchIcons = document.querySelectorAll('.toggle-search');
	const close = document.querySelector('.close');
	const searchModal = document.querySelector('.overlay');

	searchIcons.forEach((searchIcon) => searchIcon.addEventListener('click', openSearch));
	close.addEventListener('click', closeSearch);
	searchModal.addEventListener('click', closeSearch);

	// Audio player 
	const liveAudio = document.querySelector('.live-audio');
	const audioControl = document.querySelector('.audio-control');
	let isPlaying = false; // Initialiseer audio player isPlaying functie (enkel bij initeel laden van de pagina)

	liveAudio.load();
	// Wanneer audio player state veranderd naar playing, isPlaying is true
	liveAudio.addEventListener('playing', () => {
		isPlaying = true;
	})

	// Wanneer audio player state veranderd naar pause, isPlaying is false
	liveAudio.addEventListener('pause', () => {
		isPlaying = false;
	})

	audioControl.addEventListener('click', () => {

		// Play audio functie
		const playAudio = async () => {
			if (liveAudio.paused && !isPlaying) {
				audioControl.classList.remove('audio-control-play');
				audioControl.classList.add('audio-control-pause');
				// liveAudio.play() levert een Promise op, steek deze in een variable om te checken of deze resolved of rejected wordt
				const playPromise = liveAudio.play()
				// zie https://developer.chrome.com/blog/play-request-was-interrupted/ voor meer info over deze fix.
				if (playPromise !== undefined) {
					playPromise
						.catch(() => {
							audioControl.classList.remove('audio-control-pause');
							audioControl.classList.add('audio-control-play');
						})
				}
			}
		}

		// Pause audio functie
		const pauseAudio = () => {
			if (!liveAudio.paused && isPlaying) {
				audioControl.classList.remove('audio-control-pause');
				audioControl.classList.add('audio-control-play');
				liveAudio.pause();
			}
		}

		if (liveAudio.paused) {

			// Indien de audio gestopt is, moeten de source elementen opnieuw opgebouwd worden, daarna moeten de sources reload worden.
			if (liveAudio.children.length === 0) {
				// html output: <source id="source-aac" src="https://urgentstream.radiostudio.be/aac" type="audio/mp4" />
				const sourceAac = document.createElement('source');
				sourceAac.setAttribute('id', 'source-aac');
				sourceAac.setAttribute('src', 'https://urgentstream.radiostudio.be/aac');
				sourceAac.setAttribute('type', 'audio/mp4')
				liveAudio.appendChild(sourceAac);

				// html output: <source id="source-mp3" src="https://urgentstream.radiostudio.be/live" type="audio/mpeg" /> 
				const sourceMp3 = document.createElement('source');
				sourceMp3.setAttribute('id', 'source-mp3');
				sourceMp3.setAttribute('src', 'https://urgentstream.radiostudio.be/live');
				sourceMp3.setAttribute('type', 'audio/mpeg')
				liveAudio.appendChild(sourceMp3);

				liveAudio.load();
			}
			playAudio();
		} else {

			pauseAudio();

			// Indien audio nog aan het laden is, voorkom dat de source elementen verwijderd worden op het moment deze opgebouwd worden.
			if (liveAudio.children.length > 0) {
				let sourceAac = document.querySelector('#source-aac');
				let sourceMp3 = document.querySelector('#source-mp3');

				liveAudio.removeChild(sourceAac);
				liveAudio.removeChild(sourceMp3);

				// Zet een timeOut op liveAudio.load() om een crash te voorkomen (workaround voor chromium browsers)
				setTimeout(() => { liveAudio.load(); });
			}
		}
	});


	// TODO: indien gebruik maken van een loading indicator tijdens inladen muziek, maak gebruik van canplay(through event):
	// https://stackoverflow.com/questions/9337300/html5-audio-load-event

	// liveAudio.addEventListener('canplay', () => {
	// 	// In audioPlay() functie een loading flag instellen

	// 	// In dit event:
	// 	// als audio geladen is, zet flag op false
	// })

	checkCurrentTime();

	router(currentUrl);
};

const saveLastState = () => {
	const lastState = history.state.filters;
	if (lastState) {
		sessionStorage.setItem("urgentfm.laststate", lastState.toString());
	}
};


const hidePageLoading = () => {
	const content = document.querySelector('.content');
	if (document.readyState !== 'complete') {
		content.style.visibility = 'hidden';
	} else {
		content.style.visibility = 'visible';
	}
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


window.addEventListener('pagehide', saveLastState);

document.addEventListener('readystatechange', hidePageLoading);