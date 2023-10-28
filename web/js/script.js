const callMixcloud = () => {
    const request = new Request(
        'https://api.mixcloud.com/urgentfm/cloudcasts/?limit=15'
    );
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
        .then((response) => handleErrors(response))
        .then((text) => parseData(text))
        .then((data) => succeed(data))
        .catch((error) => fail(error));
};

const handleErrors = (response) => {
    if (!response.ok) {
        throw `${response.status}: ${response.statusText}`;
    }

    const contentType = response.headers.get('content-type');

    if (!contentType) {
        throw new TypeError(`No content provided: ${contentType}`);
    }

    if (contentType === 'application/json') {
        return response.json();
    }

    return response.text();
};

const parseData = (text) => {
    // If text object is not a JSON object, catch the syntaxt error and return the original text object
    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
};

const printErrorMessage = (error) => {
    console.log(error);
};

const pageUpdate = (responseText) => {
    if (responseText) {
        const parentNode = document.querySelector('.content');
        const parser = new DOMParser();
        const doc = parser.parseFromString(responseText, 'text/html');
        const newChildNodes = doc.body.childNodes;

        clearParentNode(parentNode);

        newChildNodes.forEach((n) => parentNode.appendChild(n));

        processPageUrl(location);
    }
};

const setBrowserTabTitle = (title) => {
    document.title = title;
};

const getTabDay = (urlFragment) => {
    switch (urlFragment) {
        case '#zondag': {
            return 0;
        }
        case '#maandag': {
            return 1;
        }

        case '#dinsdag': {
            return 2;
        }
        case '#woensdag': {
            return 3;
        }
        case '#donderdag': {
            return 4;
        }
        case '#vrijdag': {
            return 5;
        }
        case '#zaterdag': {
            return 6;
        }
        default: {
            return new Date().getDay();
        }
    }
};

const getFilterValues = () => {
    const allResultsFilterCheckbox =
        document.querySelector('.cb-defaultfilter');

    // document.querySelectorAll returns a node list, convert this to an array so array functions can be performed.
    const otherFilterCheckboxes = Array.from(
        document.querySelectorAll('.cb-filter:is(:not(.cb-defaultfilter))')
    );

    const createInitialFilterValues = () => {
        const filterCheckboxInitialValues = [];
        const allResultsFilterCheckboxInitialValue = true;

        filterCheckboxInitialValues.push(allResultsFilterCheckboxInitialValue);

        otherFilterCheckboxes.forEach((otherFilterCheckbox) => {
            filterCheckboxInitialValues.push(otherFilterCheckbox.checked);
        });

        return filterCheckboxInitialValues;
    };

    const filterValues = history.state.filters
        ? history.state.filters
        : createInitialFilterValues();

    const allResultsFilterValue = filterValues.shift();
    const filterValuesToState = new Array(allResultsFilterValue);

    allResultsFilterCheckbox.checked = allResultsFilterValue;

    return filterValuesToState.concat(
        Array.from(otherFilterCheckboxes, (filter) => {
            const filterValue = filterValues.shift();
            filter.checked = filterValue;

            return filterValue;
        })
    );
};

const processPageUrl = (url) => {
    // First character of url.pathname is always '/'. This would result in an empty first segment
    const pathSegments = url.pathname.toString().slice(1).split('/');
    const firstSegment = pathSegments[0];

    setAnchors();
    setActiveNavItem(firstSegment);

    // Route the destination url to the right set of page related functions
    switch (firstSegment) {
        case '':
            // eslint-disable-next-line no-undef
            swiffyslider.init((rootElement = document.body));
            callMixcloud();
            setBrowserTabTitle('Urgent.fm 105.3');

            break;
        case 'programma': {
            if (pathSegments.length > 1) {
                setBrowserTabTitle(
                    `${
                        document.querySelector('#title').dataset.title
                    } | Urgent.fm 105.3`
                );

                setDisplay();

                break;
            }

            const urlHash = url.hash;
            const tabDay = getTabDay(urlHash);

            setBrowserTabTitle('Programma | Urgent.fm 105.3');
            // eslint-disable-next-line no-undef
            populateProgramSchema(tabDay);
            setDisplay();

            break;
        }
        case 'nieuws':
            url = location.pathname + location.search;

            history.replaceState(
                { scrollY: history.state.scrollY, filters: null },
                '',
                url
            );

            pathSegments.length > 1
                ? setBrowserTabTitle(
                      `${
                          document.querySelector('#title').dataset.title
                      } | Urgent.fm 105.3`
                  )
                : setBrowserTabTitle('Nieuws | Urgent.fm 105.3');

            setDisplay();

            break;
        case 'zoek': {
            initializeFilters();

            const filterValues = getFilterValues();

            url = location.pathname + location.search;

            history.replaceState(
                { scrollY: history.state.scrollY, filters: filterValues },
                '',
                url
            );

            closeSearchModal();
            setBrowserTabTitle('Zoek | Urgent.fm 105.3');
            setDisplay();

            break;
        }
        default:
            setBrowserTabTitle(
                `${
                    document.querySelector('#title').dataset.title
                } | Urgent.fm 105.3`
            );

            setDisplay();
    }
};

const setActiveNavItem = (url) => {
    const navItems = document.querySelectorAll('.navbar .navbar-nav .nav-item');

    navItems.forEach((navItem) => {
        navItem.classList.remove('nav-active');
    });

    switch (url) {
        case 'programma':
            return document
                .querySelector('#programma')
                .classList.add('nav-active');
        case 'nieuws':
            return document
                .querySelector('#nieuws')
                .classList.add('nav-active');
        case 'wie-zijn-we':
            return document
                .querySelector('#over-urgent-fm')
                .classList.add('nav-active');
        case 'contact':
            return document
                .querySelector('#contact')
                .classList.add('nav-active');
        case 'workshops':
            return document
                .querySelector('#workshops')
                .classList.add('nav-active');
    }
};

// Navigate to new page when clicking on anchor link
const navigate = (e) => {
    e.preventDefault();

    // Prevent navigation toe 'zoek' when clicking on navbar searchbutton
    if (e.currentTarget.classList.contains('search')) {
        return;
    }

    let destinationUrl;
    let currentUrl;
    const filters = history.state.filters;

    // If there are filters on paginated pages, set filter state for current page (when navigating back, filter state can be restored)
    currentUrl = location.pathname + location.search + location.hash;
    history.replaceState(
        { scrollY: window.scrollY, filters: filters ?? null },
        '',
        currentUrl
    );

    // Navigate to search results
    if (e.currentTarget.classList.contains('btnZoek')) {
        const form = e.currentTarget.form;
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
    forms.forEach((form) => {
        form[0].value = '';
    });
    // Then get destination url
    destinationUrl = new URL(
        e.currentTarget.getAttribute('href').toString(),
        location.origin
    );

    // If current URL equals destination URL, prevent reloading page
    if (destinationUrl.href === location.href) {
        return;
    }

    // If destination is external website, open new window and abort function
    if (destinationUrl.hostname !== location.hostname) {
        window.open(destinationUrl, '_blank');
        return;
    }

    // If destination is link from cookiebanner, abort function
    if (destinationUrl.href === 'javascript:void(0);') {
        return;
    }

    history.pushState(
        { scrollY: 0, filters: filters ?? null },
        '',
        destinationUrl
    );
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
    const scrollBackTo = history.state.scrollY;
    window.scroll(0, scrollBackTo);
};

// Set internal anchorlinks.
const setAnchors = () => {
    // TODO: efficientere toepassing vinden (bv. pas bij click op juise anchor actie ondernemen, ipv telkens ankers te moeten toewijzen)
    const anchors = document.querySelectorAll(
        "a:not(#yii-debug-toolbar a, .social-media-link, a[href^='mailto:'], .mixcloud-link), .btnZoek"
    ); // DEV: not statement enkel in DEV mode!

    anchors.forEach((a) => a.addEventListener('click', navigate));
};

const openSearchModal = (e) => {
    e.preventDefault();

    const modal = document.querySelector('.modal-search');
    const overlay = document.querySelector('.overlay');
    const body = document.querySelector('body');

    modal.style.display = 'block';
    overlay.style.display = 'block';
    body.style.overflow = 'hidden';
};

const closeSearchModal = () => {
    const overlay = document.querySelector('.overlay');
    const searchbar = document.querySelector('.modal-search');
    const body = document.querySelector('body');

    overlay.style.display = 'none';
    searchbar.style.display = 'none';
    body.style.overflow = 'auto';
};

const initializeFilters = () => {
    const allResultsFilterCheckbox =
        document.querySelector('.cb-defaultfilter');

    // document.querySelectorAll returns a node list, convert this to an array so array functions can be performed.
    const otherFilterCheckboxes = Array.from(
        document.querySelectorAll('.cb-filter:is(:not(.cb-defaultfilter))')
    );

    allResultsFilterCheckbox.addEventListener('change', checkAllResultsFilter);

    otherFilterCheckboxes.forEach((filter) =>
        filter.addEventListener('change', checkFilter)
    );
};

const checkAllResultsFilter = () => {
    const allResultsFilterCheckbox =
        document.querySelector('.cb-defaultfilter');

    // document.querySelectorAll returns a node list, convert this to an array so array functions can be performed.
    const otherFilterCheckboxes = Array.from(
        document.querySelectorAll('.cb-filter:is(:not(.cb-defaultfilter))')
    );

    const numberOfCheckedFilters = otherFilterCheckboxes.filter(
        (otherFilterCheckbox) => otherFilterCheckbox.checked
    ).length;

    // If defaultfilter is checked and no other filters, then do nothing and return.
    if (!allResultsFilterCheckbox.checked && numberOfCheckedFilters === 0) {
        return (allResultsFilterCheckbox.checked = true);
    }

    // If defaultfilter is not checked, but other filters are, then check defaultfilter and uncheck all other filters
    const filterValues = [
        allResultsFilterCheckbox.checked,
        ...otherFilterCheckboxes.map(
            (otherFilterCheckbox) => (otherFilterCheckbox.checked = false)
        )
    ];

    const url = buildFilterURLParam();

    history.replaceState(
        { scrollY: window.scrollY, filters: filterValues },
        '',
        url
    );

    pageRequest(location);
};

// Switch off 'All Results' checkbox when selecting other checkboxes.
// Switch on 'All Results' checkbox  when  other checkboxes.
const checkFilter = () => {
    const allResultsFilterCheckbox =
        document.querySelector('.cb-defaultfilter');

    // document.querySelectorAll returns a node list, convert this to an array so array functions can be performed.
    const otherFilterCheckboxes = Array.from(
        document.querySelectorAll('.cb-filter:is(:not(.cb-defaultfilter))')
    );

    const numberOfCheckedFilters = otherFilterCheckboxes.filter(
        (otherFilterCheckbox) => otherFilterCheckbox.checked
    ).length;

    numberOfCheckedFilters === 0
        ? (allResultsFilterCheckbox.checked = true)
        : (allResultsFilterCheckbox.checked = false);

    const filterValues = [
        allResultsFilterCheckbox.checked,
        ...otherFilterCheckboxes.map((filter) => filter.checked)
    ];

    const url = buildFilterURLParam();

    history.replaceState(
        { scrollY: window.scrollY, filters: filterValues },
        '',
        url
    );

    pageRequest(location);
};

const buildFilterURLParam = () => {
    const allResultsFilterCheckbox =
        document.querySelector('.cb-defaultfilter');

    // document.querySelectorAll returns a node list, convert this to an array so array functions can be performed.
    const otherFilterCheckboxes = Array.from(
        document.querySelectorAll('.cb-filter:is(:not(.cb-defaultfilter))')
    );

    const searchForm = document.querySelector('.form-zoek');
    const baseUrl = searchForm.action;
    const searchQueryParameterValue = searchForm[0].value;

    if (allResultsFilterCheckbox.checked) {
        return `${baseUrl}?q=${searchQueryParameterValue}`;
    }

    const categoryQueryParameterValues = otherFilterCheckboxes
        .filter((filterCheckbox) => filterCheckbox.checked)
        .map((filterCheckbox) => filterCheckbox.value)
        .join(',');

    return `${baseUrl}?q=${searchQueryParameterValue}&categorie=${categoryQueryParameterValues}`;
};

const populateEditorsPick = (response) => {
    const parsedData = response;
    const data = parsedData['data'];

    data.forEach((entry, index) => {
        const pick = `#pick-${index}`;
        const a = document.querySelector(`${pick} a`);
        const img = document.querySelector(`${pick} img`);
        const p = document.querySelector(`${pick} p`);
        const pictures = entry['pictures'];
        const name = entry['name'];

        a.href = `https://mixcloud.com${entry['key']}`;
        img.src = pictures['large'];
        img.alt = `Thumbnail of ${name}`;
        p.textContent = name;
    });

    // Scrollback position is only right if setDisplay() is performed here instead in processPageUrl()
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
            Accept: 'application/json'
        }),
        body: JSON.stringify({
            query
        })
    });

    getData(request, updateCurrentlyPlaying, printErrorMessage);
};

const updateCurrentlyPlaying = (data) => {
    const entries = data['data']['entries'];
    const currentDatetime = new Date();
    const currentHour = parseInt(currentDatetime.getHours());
    let currentDay = currentDatetime.getDay();

    // The daily schedule starts from 7 AM.
    // If current hour is less then 7 AM, change current day to yesterday, so yesterdays schedule continues
    if (currentHour < 7) {
        currentDay -= 1;
        // If the resulting daynumber is less then 0, which represents sunday
        // Then convert the day number to 6, which represents saturday
        if (currentDay < 0) {
            currentDay = 6;
        }
    }

    // Find current timeslot
    const timetableForToday = entries[currentDay];
    const timeslots = timetableForToday['weekdag'];

    const currentTimeslot = timeslots.find((timeslot) => {
        const startHour = parseInt(timeslot['beginuur'].substring(11, 13));
        const endHour = parseInt(timeslot['einduur'].substring(11, 13));

        return (
            (currentHour >= startHour && currentHour < endHour) ||
            (currentHour >= startHour && endHour < startHour)
        );
    });

    // update audio player: (luister nu) program title
    const radioShow = currentTimeslot['programma'][0];

    const currentlyPlaying = document.querySelector(
        '.audioplayer-currently-playing'
    );

    currentlyPlaying.innerHTML = radioShow['title'];
    currentlyPlaying.href = radioShow['url'];

    // If current page is the homepage, reload page
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
    // Ajax navigation setup
    const url = location.pathname + location.search + location.hash;

    history.scrollRestoration = 'auto';
    history.replaceState(
        {
            scrollY: 0,
            filters: history.state ? history.state.filters : null
        },
        '',
        url
    );

    // Searchform overlay
    const searchIcons = document.querySelectorAll('.toggle-search');
    const close = document.querySelector('.close');
    const searchModal = document.querySelector('.overlay');

    searchIcons.forEach((searchIcon) =>
        searchIcon.addEventListener('click', openSearchModal)
    );

    close.addEventListener('click', closeSearchModal);

    searchModal.addEventListener('click', closeSearchModal);

    // Audio player
    const liveAudio = document.querySelector('.live-audio');
    const audioControl = document.querySelector('.audio-control');

    // Initialise audio player isPlaying function (only on initial page load)
    let isPlaying = false;

    liveAudio.load();

    liveAudio.addEventListener('playing', () => {
        isPlaying = true;
    });

    liveAudio.addEventListener('pause', () => {
        isPlaying = false;
    });

    audioControl.addEventListener('click', () => {
        const playAudio = async () => {
            if (liveAudio.paused && !isPlaying) {
                audioControl.classList.remove('audio-control-play');
                audioControl.classList.add('audio-control-pause');

                // liveAudio.play() returns a Promise, put it into a variable to check if it is resolved or rejected
                const playPromise = liveAudio.play();
                // See https://developer.chrome.com/blog/play-request-was-interrupted/ for more info about follow code.
                if (playPromise !== undefined) {
                    playPromise.catch(() => {
                        audioControl.classList.remove('audio-control-pause');
                        audioControl.classList.add('audio-control-play');
                    });
                }
            }
        };

        const pauseAudio = () => {
            if (!liveAudio.paused && isPlaying) {
                audioControl.classList.remove('audio-control-pause');
                audioControl.classList.add('audio-control-play');
                liveAudio.pause();
            }
        };

        if (liveAudio.paused) {
            // Indien de audio gestopt is, moeten de source elementen opnieuw opgebouwd worden, daarna moeten de sources reload worden.
            if (liveAudio.children.length === 0) {
                // html output: <source id="source-aac" src="https://urgentstream.radiostudio.be/aac" type="audio/mp4" />
                const sourceAac = document.createElement('source');
                sourceAac.setAttribute('id', 'source-aac');
                sourceAac.setAttribute(
                    'src',
                    'https://urgentstream.radiostudio.be/aac'
                );
                sourceAac.setAttribute('type', 'audio/mp4');
                liveAudio.appendChild(sourceAac);

                // html output: <source id="source-mp3" src="https://urgentstream.radiostudio.be/live" type="audio/mpeg" />
                const sourceMp3 = document.createElement('source');
                sourceMp3.setAttribute('id', 'source-mp3');
                sourceMp3.setAttribute(
                    'src',
                    'https://urgentstream.radiostudio.be/live'
                );
                sourceMp3.setAttribute('type', 'audio/mpeg');
                liveAudio.appendChild(sourceMp3);

                liveAudio.load();
            }
            playAudio();
        } else {
            pauseAudio();

            // If audio is still loading, avoid removing the source elements at the time it is being built.
            if (liveAudio.children.length > 0) {
                const sourceAac = document.querySelector('#source-aac');
                const sourceMp3 = document.querySelector('#source-mp3');

                liveAudio.removeChild(sourceAac);
                liveAudio.removeChild(sourceMp3);

                // Set a timeOut on liveAudio.load() to avoid a crash (workaround for chromium browsers)
                setTimeout(() => {
                    liveAudio.load();
                });
            }
        }
    });

    checkCurrentTime();

    processPageUrl(location);
};

const saveLastState = () => {
    const lastState = history.state.filters;

    if (lastState) {
        sessionStorage.setItem('urgentfm.laststate', lastState.toString());
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
window.addEventListener('popstate', (e) => {
    e.preventDefault();

    pageRequest(location);
});

window.addEventListener('load', onload);

window.addEventListener('pagehide', saveLastState);

document.addEventListener('readystatechange', hidePageLoading);
