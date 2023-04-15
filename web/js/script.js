const callMixcloud = () => {
	const request = new Request('https://api.mixcloud.com/urgentfm/cloudcasts/?limit=15');
	getData(request, populateEditorsPick, printErrorMessage);
};

const pageRequest = (url) => {
	const requestUrl = url.pathname + url.search;
	const request = new Request(requestUrl, {
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
		// const url = getURL();
		router(location);
	}
};

/* Route to right endpoints for setting up functionallity */
const router = (url) => {
	const pathSegments = url.pathname.toString().split('/');
	const firstSegment = pathSegments[1]; // first array location will allways be empty
	let title;

	setAnchors();

	// Route the destination url to the right set of webpage-related functions
	switch (firstSegment) {
		case '':
			callMixcloud();
			// eslint-disable-next-line no-undef
			swiffyslider.init(rootElement = document.body);
			title = 'Urgent.fm 105.3'
			break;
		case 'programma': {
			if (pathSegments.length > 2) {
				title = `${document.querySelector('#title').dataset.title} | Urgent.fm 105.3`;
				setDisplay();
				break;
			}

			// activeer eerste tab bij inladen pagina
			let tabDay;
			const urlHash = url.hash;
			switch (urlHash) {
				case '#zondag': {
					tabDay = 0;
					break;
				}
				case '#maandag': {
					tabDay = 1;
					break;
				}

				case '#dinsdag': {
					tabDay = 2;
					break;
				}
				case '#woensdag': {
					tabDay = 3;
					break;
				}
				case '#donderdag': {
					tabDay = 4;
					break;
				}
				case '#vrijdag': {
					tabDay = 5;
					break;
				}
				case '#zaterdag': {
					tabDay = 6;
					break;
				}
				default: {
					// Zondag = 0, maandag 1 enz. Tabday is de 'juiste' dagnummer die door JS gebruikt wordt.
					tabDay = new Date().getDay();
				}
			}
			title = 'Programma | Urgent.fm 105.3';

			// eslint-disable-next-line no-undef
			populateProgramSchema(tabDay);
			setDisplay();
			break;
		}
		case 'nieuws':
			url = location.pathname + location.search;
			history.replaceState({ scrollY: history.state.scrollY, filters: null }, '', url);
			pathSegments.length > 2 ? title = `${document.querySelector('#title').dataset.title} | Urgent.fm 105.3` : title = 'Nieuws | Urgent.fm 105.3';
			setDisplay();
			break;
		case 'zoek': {
			closeSearch();
			let filters;
			if (!history.state.filters) {
				filters = initFilter();
			} else {
				const stateFilters = history.state.filters;
				const cbDefaultfilter = document.querySelector('.cb-defaultfilter');
				const cbFilters = document.querySelectorAll('.cb-filter:is(:not(.cb-defaultfilter))'); // select all filters but defaultfilter

				const defaultStateFilter = stateFilters.shift();
				cbDefaultfilter.checked = defaultStateFilter;
				cbDefaultfilter.addEventListener('change', checkDefaultfilter);

				const defaultFilters = new Array(defaultStateFilter);
				filters = defaultFilters.concat(Array.from(cbFilters, (filter) => {
					const stateFilter = stateFilters.shift();
					filter.checked = stateFilter;
					filter.addEventListener('change', checkFilter);
					return stateFilter;
				}));

			}
			history.replaceState({ scrollY: history.state.scrollY, filters: filters }, '', location.pathname + location.search);
			title = 'Zoek | Urgent.fm 105.3';
			setDisplay();
			break;
		}
		default:
			title = `${document.querySelector('#title').dataset.title} | Urgent.fm 105.3`;
			setDisplay();
	}
	document.title = title;
	setActiveNavItem(firstSegment);
};

/** Clear the active nav items before selecting the new active nav item */
const setActiveNavItem = (url) => {
	// First clear all possible active nav items
	const navItems = document.querySelectorAll('.navbar .navbar-nav .nav-item');
	navItems.forEach(navItem => {
		navItem.classList.remove('nav-active');
	})

	let activeNavItem;

	switch (url) {
		case 'programma':
			activeNavItem = document.querySelector('#programma');
			activeNavItem.classList.add('nav-active');
			break;
		case 'nieuws':
			activeNavItem = document.querySelector('#nieuws');
			activeNavItem.classList.add('nav-active');
			break;
		case 'wie-zijn-we':
			activeNavItem = document.querySelector('#over-urgent-fm');
			activeNavItem.classList.add('nav-active');
			break;
		case 'contact':
			activeNavItem = document.querySelector('#contact');
			activeNavItem.classList.add('nav-active');
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
	currentUrl = location.pathname + location.search + location.hash;
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
		pageRequest(location);

		return;
	}

	// Navigate to other pages

	// First clear (navbar) searchform(s)
	let forms = document.querySelectorAll('.formZoek');
	forms.forEach(form => {
		form[0].value = '';
	})
	// Then get destination url 
	destinationUrl = new URL((e.currentTarget).getAttribute('href').toString(), location.origin);


	// If current URL equals destination URL, prevent reloading page
	if (destinationUrl.href === location.href) {
		return;
	}

	// If destination is external website, open new window and abort function
	if (destinationUrl.hostname !== location.hostname) {
		window.open(destinationUrl, '_blank')
		return;
	}

	// If destination is link from cookiebanner, abort function
	if (destinationUrl.href === 'javascript:void(0);') {
		return;
	}

	// Perform navigation
	let scrollY = 0;
	// Indien focus moet behouden worden op scrollpositie bij pagineren, zie of het a-element de pagination-focus klasnaam bezit:
	// if (e.currentTarget.classList.contains('pagination-focus')) {
	// 	scrollY = window.scrollY;
	// }
	// let url = URL()
	history.pushState({ scrollY: scrollY, filters: filters ?? null }, '', destinationUrl);
	pageRequest(location);
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
	const cbFilters = document.querySelectorAll('.cb-filter:is(:not(.cb-defaultfilter))'); // select all filters but defaultfilter
	let checkCount = 0;

	// First count checked filters
	cbFilters.forEach(filter => filter.checked && checkCount++);

	// If defaultfilter is checked, and no other filters, then do nothing and return.
	if (!cbDefaultfilter.checked && checkCount === 0) {
		cbDefaultfilter.checked = true;
		return;
	}

	// If defaultfilter is not checked, but other filters are, then check defaultfilter, uncheck all other filters and refresh page
	const defaultFilters = new Array(cbDefaultfilter.checked);
	const filters = defaultFilters.concat(Array.from(cbFilters, (filter) => filter.checked = false));

	const url = buildFilterURLParam();
	history.replaceState({ scrollY: window.scrollY, filters: filters }, '', url);
	pageRequest(location);
};

// Switch off default checkbox on nieuwsindex when selecting other checkboxes
// or switch on when deselecting them.
const checkFilter = () => {
	const cbDefaultfilter = document.querySelector('.cb-defaultfilter');
	const cbFilters = document.querySelectorAll('.cb-filter:is(:not(.cb-defaultfilter))'); // select all filters but defaultfilter
	let checkCount = 0;

	// Don't count defaultfilter, so let i = 1
	cbFilters.forEach(filter => filter.checked && checkCount++);

	// Select defaultfilter when no filter is selected, or vice versa
	checkCount === 0 ? cbDefaultfilter.checked = true : cbDefaultfilter.checked = false;
	// Save filter check values to state object
	const defaultFilters = new Array(cbDefaultfilter.checked);
	const filters = defaultFilters.concat(Array.from(cbFilters, (filter) => filter.checked));

	const url = buildFilterURLParam();
	history.replaceState({ scrollY: window.scrollY, filters: filters }, '', url);
	pageRequest(location);
};

const buildFilterURLParam = () => {
	const cbDefaultfilter = document.querySelector('.cb-defaultfilter');
	const cbFilters = document.querySelectorAll('.cb-filter:is(:not(.cb-defaultfilter))'); // select all filters but defaultfilter
	const formZoek = document.querySelector('.form-zoek');
	const url = `${formZoek.action}`;
	const search = `?q=${formZoek[0].value}`;

	// If default filter is checked, return url + search query
	if (cbDefaultfilter.checked) {
		return url + search;
	}

	// else, build parameter query and return url with search query and url parameters
	let urlParams = '&categorie=';
	cbFilters.forEach((filter) => filter.checked && (urlParams += filter.value += ','))

	return url + search + urlParams.trim().slice(0, urlParams.length - 1);
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

	const request = new Request(`${location.origin}/api`, {
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
	const currentlyPlaying = document.querySelector('.audioplayer-currently-playing');
	currentlyPlaying.innerHTML = programma['title'];
	currentlyPlaying.href = programma['url'];

	//reload homepage
	if (location.pathname == '/') {
		pageRequest(location);
	}

};

const checkCurrentTime = () => {
	// Check if it's presicely a new hour (e.g. 15h00)
	const date = new Date();
	const minute = date.getMinutes();
	// if true, then get the timetable data from sessionstorage
	minute == 0 && fetchTimetable();
	// Check every 30 seconds again for current time
	setTimeout(checkCurrentTime, 30000);

};

// Window Events
// eslint-disable-next-line no-redeclare
const onload = () => {

	// Ajax navigation
	history.scrollRestoration = 'auto';
	let scrollY = 0;
	// const filters = history.state ? history.state.filters : null;

	history.replaceState({ scrollY: scrollY, filters: (history.state ? history.state.filters : null) }, '', location.pathname + location.search + location.hash);

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

	router(location);
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

// const hashReload= () => {
// 	// e.preventDefault()
// 	let currentUrl = getURL();
// 	let scrollY = 0;

// 	if (document.location.search) {
// 		currentUrl += document.location.search;
// 	}
// 	if (document.location.hash) {
// 		currentUrl += document.location.hash;
// 	}
// 	let filters = null;
// 	if (history.state) {
// 		filters = history.state.filters;
// 	}

// 	history.replaceState({ scrollY: scrollY, filters: filters }, '', currentUrl);
// 	// location.reload()
// 	pageRequest(location);

// }

// return to page when clicking on browser's "back" or "forward" button
window.addEventListener('popstate', e => {
	e.preventDefault();

	pageRequest(location);
});

window.addEventListener('load', onload);

// window.addEventListener('hashchange', hashReload);

window.addEventListener('pagehide', saveLastState);

document.addEventListener('readystatechange', hidePageLoading);