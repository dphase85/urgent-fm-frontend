const setSchema = (e) => {

	let navbar = document.querySelector('.progSchema-navbar');
	let tabsContainer = document.querySelector('.progSchema-tabsContainer');
	let tabNumber = (e.target).dataset.forTab;
	let tabToActivate = document.querySelector(`.tabs-content[data-tab="${tabNumber}"]`);
	// code om tabs in standaardmenu in te stellen
	navbar.querySelectorAll('.tabs-button').forEach(button => {
		button.classList.remove('tabs-button-active');
		if (button.dataset.forTab == tabNumber) {
			button.classList.add('tabs-button-active');
		}
	});
	tabsContainer.querySelectorAll('.tabs-content').forEach(tab => {
		tab.classList.remove('tabs-content-active');
	});
	tabToActivate.classList.add('tabs-content-active');

	// code om dropdownmenu in te stellen (enkel zichtbaar op kleine schermen)
	let txtDay = (e.target).innerHTML;
	let weekdagSelected = document.getElementById('weekdag-selected');
	weekdagSelected.innerText = txtDay;
	let scrollY = history.state.scrollY;
	history.pushState({ scrollY: scrollY, filters: null }, '', '/programma/'+txtDay.toLowerCase());
};

const collapseSlot = (e) => {
	// haal elementen op
	let slotSelect = (e.target).parentElement.parentElement;
	let slotParent = slotSelect.parentElement;
	let slotNextRow = slotParent.nextElementSibling;

	//check of slot-styles actief zijn, indien niet:
	if (!slotNextRow.classList.contains('slot-row-active')) {

		//eerst checken voor andere actieve entries:
		// verzamel alle slot entries
		let allSlotIntros = document.querySelectorAll('.slot-row-active');
		// check voor alle entries of er een slot style actief is
		// indien er een entrie actief is: sluiten
		for (let i = 0; i < allSlotIntros.length; i++) {
			if (allSlotIntros[i].classList.contains('slot-row-active')) {
				allSlotIntros[i].classList.remove('slot-row-active');
			}
		}

		slotNextRow.classList.add('slot-row-active');
		slotNextRow.classList.remove('slot-row');
	} else {
		slotNextRow.classList.remove('slot-row-active');
		slotNextRow.classList.add('slot-row');
	}
};

/* populate programmaschema, met dagnummer als parameter. Aan de hand van parameter wordt de gewenste dag actief gemaakt */
// eslint-disable-next-line no-unused-vars
const populateProgramSchema = (tabDay) => {

	let buttons = document.querySelectorAll('.tabs-button');
	buttons.forEach(button => button.addEventListener('click', setSchema));

	let slotTitles = document.querySelectorAll('.slot-inhoud h3');
	slotTitles.forEach(title => title.addEventListener('click', collapseSlot));

	// // Zondag = 0, maandag 1 enz. Tabday is de 'juiste' dagnummer die door JS gebruikt wordt.
	let btnDay = tabDay - 1;
	// Maandag is eerste dag (array[0] in schema), zondag is laatste dag in programmaschema.
	// Na aftrek is zondag == -1, zet deze om naar 6 (laatste positie in schema).
	if (btnDay == -1) {
		btnDay = 6;
	}
	buttons[btnDay].classList.add('tabs-button-active');
	// selecteer eerst alle tabs
	let tabs = document.querySelectorAll('.tab');
	// verwijder de tab weekday titel, verander slot-intro-active en slot-logo-active naar slot intro en slot-logo (enkel nodig bij niet-JS versie van site)
	// let weekdays = document.getElementsByClassName
	// vervolgens classlist aanpassen, ifv JS functionaliteit: eerst .tab classname verwijderen (deze is enkel nuttig wanneer JS uitgeschakeld is), daarna voor alle niet-actieve tabs content verbergen
	tabs.forEach(tab => {
		let weekday = document.querySelector('.tab .weekday');
		tab.removeChild(weekday);
		tab.classList.remove('tab');
		tab.classList.add('tabs-content');
	});

	let slotIntros = document.querySelectorAll('.slot-row-active');
	slotIntros.forEach(slotIntro => {
		slotIntro.classList.remove('slot-row-active');
		slotIntro.classList.add('slot-row');
	});

	// toon content van actieve tab
	tabs[tabDay].classList.add('tabs-content-active');
	let txtDay = buttons[btnDay].innerHTML;
	let weekdagSelected = document.getElementById('weekdag-selected');
	weekdagSelected.innerText = txtDay;
	let scrollY = history.state.scrollY;
	history.replaceState({ scrollY: scrollY, filters: null }, '', '/programma/'+txtDay.toLowerCase());
};