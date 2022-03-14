
const setDefaultFilterValue = () => {
	let radiobuttons = document.querySelectorAll('.rbtnFilter');
	radiobuttons.forEach(radiobutton => {
		if (radiobutton.value === 'all') {
			radiobutton.checked = true;
			let value = radiobutton.value;
			sessionStorage.setItem('rbtnFilter', value);
		}
	});
};

const setFilterValue = () => {
	let value = sessionStorage.getItem('rbtnFilter');
	let radiobuttons = document.querySelectorAll('.rbtnFilter');
	radiobuttons.forEach(radiobutton => {
		if (radiobutton.value === value) {
			radiobutton.checked = true;
			setFilter(value);
		}
	});
};

const fetchSessionstorageData = () => {
	if (!sessionStorage.getItem('rbtnFilter')) {
		setDefaultFilterValue();
	}
	else {
		setFilterValue();
	}
};


// Voorlopige oplossing?!
const setFilterKlick = (e) => {
	let value = (e.target).value;
	setFilter(value);
};

const setFilter = (value) => {

	let entries = document.querySelectorAll('.entry');

	entries.forEach(entry => {
		if (value === 'all') {
			entry.style.display = 'block';
		} else if (entry.dataset.category !== value) {
			entry.style.display = 'none';
		} else {
			entry.style.display = 'block';
		}

		sessionStorage.setItem('rbtnFilter', value);
	});
};