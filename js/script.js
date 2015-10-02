/*jslint plusplus: true, sloppy: true*/
/*global FileReader: false, wanakana: false, LESSONS: false*/

////////////////////////AUGMENTED BASIC TYPES////////////////////////

Function.prototype.method = function (name, func) {
	this.prototype[name] = func;
	
	return this;
};

Object.method('superior', function (name) {
	var that = this,
		method = that[name];
	
	return function () {
		return method.apply(that, arguments);
	};
});

//////////////////////////GLOBAL VARIABLES///////////////////////////

var WRONG_ANSWERS_DICT,
	WORD_TO_TRANSLATE,
	MAIN_DICT,
	CONTROLS,
	DECK;

//////////////////////////////FUNCTIONS//////////////////////////////

function showPopup(specs) {
	var popup = specs.popup,
		popupInner = specs.popupInner,
		newContent = document.createElement('div'),
		row = document.createElement('div'),
		word = document.createElement('div'),
		translation = document.createElement('div'),
		dict = specs.dict,
		id = specs.id,
		scoreElem,
		textWrong,
		score,
		pair,
		i;

	newContent.id = id;
	newContent.classList.add('dictContent');
	row.classList.add('dictRow');
	translation.classList.add('japanese');

	row.appendChild(word);
	row.appendChild(translation);

	for (i = 0; i < dict.length; i++) {
		pair = dict[i];
		
		word.innerHTML = pair.word;
		translation.innerHTML = pair.translation;
		
		newContent.appendChild(row.cloneNode(true));
	}

	popupInner.replaceChild(newContent, popupInner.children[id]);
	
	if (popupInner.children.gameOverTextMain) {
		textWrong = document.getElementById('gameOverTextWrong');
		scoreElem = document.getElementById('score');
		score = 100 - dict.length / MAIN_DICT.content.length * 100;
		scoreElem.innerHTML = score.toFixed() + '%';
		
		if (score === 100) {
			textWrong.classList.add('hidden');
			scoreElem.parentNode.classList.add('allCorrect');
		} else {
			textWrong.classList.remove('hidden');
			scoreElem.parentNode.classList.remove('allCorrect');
		}
	}
	popup.classList.remove('hidden');
	popup.setAttribute('data-isopen', 'true');
}

/////////////////////////MODULE CONSTRUCTORS/////////////////////////

function dictionary() {
	var that = {};
	
	that.content = [];
	
	that.push = function (pairToPush) {
		var currentPair,
			i;
		
		if (pairToPush.word === '' && pairToPush.translation === '') {
			return -1;
		} else if (pairToPush.word === '') {
			return -2;
		} else if (pairToPush.translation === '') {
			return -3;
		}
		
		for (i = 0; i < this.content.length; i++) {
			currentPair = this.content[i];
			
			if (currentPair.equals(pairToPush)) {
				return -1;
			} else if (currentPair.word === pairToPush.word) {
				return -2;
			} else if (currentPair.translation === pairToPush.translation) {
				return -3;
			}
		}
		Array.prototype.push.apply(this.content, arguments);
		return 0;
	};
	
	that.concat = function (array) {
		var i;
		
		for (i = 0; i < array.length; i++) {
			this.push(array[i]);
		}
		
		return this;
	};
	
	that.copy = function (array) {
		var i;
		
		for (i = 0; i < array.length; i++) {
			this.push(array[i]);
		}
		
		return this;
	};
	
	that.clear = function () {
		this.content.splice(0, this.content.length);
		
		return this;
	};
	
	that.removeArray = function (array) {
		var dict = this.content,
			i,
			j;
		
		for (i = 0; i < dict.length; i++) {
			for (j = 0; j < array.length; j++) {
				if (dict[i].word === array[j].word || dict[i].translation === array[j].translation) {
					dict.splice(i--, 1);
					break;
				}
			}
		}
		
		return this;
	};
	
	that.shuffle = function () {
		var dict = this.content,
			currentIndex = dict.length,
			temporaryValue,
			randomIndex;

		// While there remain elements to shuffle...
		while (0 !== currentIndex) {
			// Pick a remaining element...
			randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex -= 1;
			// And swap it with the current element.
			temporaryValue = dict[currentIndex];
			dict[currentIndex] = dict[randomIndex];
			dict[randomIndex] = temporaryValue;
		}
		
		return this;
	};
	
	return that;
}

function pair(specs) {
	var that = {};
	
	that.word = specs.word;
	that.translation = specs.translation;
	
	that.equals = function (anotherPair) {
		var thisProps = Object.getOwnPropertyNames(this),
			anotherPairProps = Object.getOwnPropertyNames(anotherPair),
			propName,
			i;
		
		if (thisProps.length !== anotherPairProps.length) {
			return false;
		}
		
		for (i = 0; i < thisProps.length; i++) {
			propName = thisProps[i];
			if (this[propName] !== anotherPair[propName]) {
				return false;
			}
		}
		
		return true;
	};
	
	return that;
}

function wordToTranslate(elem) {
	var that = {},
		index,
		pair;
	
	that.elem = elem;
	
	that.set = function (dict, newIndex, toJapanese) {
		index = newIndex;
		pair = dict[index];
		if (toJapanese) {
			this.elem.innerHTML = pair.word;
		} else {
			this.elem.innerHTML = pair.translation;
		}
	};
	
	that.getPair = function () {
		return pair;
	};
	
	that.getIndex = function () {
		return index;
	};
	
	that.clear = function () {
		this.elem.innerHTML = '';
		index = 0;
		pair = null;
	};
	
	return that;
}

function deck(specs) {
	var elem = specs.elem,
		that = {},
		changeProgress,
		onCardClick;
	
	that.cards = specs.cards;
	that.progressBar = specs.progressBar;
	that.toJapanese = true;
	
	changeProgress = function () {
		var progress = that.progressBar.firstChild,
			length = MAIN_DICT.content.length,
			index = WORD_TO_TRANSLATE.getIndex() + 1,
			percent = Math.round(index / length * 100);
		
		if (percent < 8) {
			progress.style.width = '7%';
		} else {
			progress.style.width = percent + '%';
		}
		progress.innerHTML = percent + '%';
	};
	
	onCardClick = function (e) {
		var correctWordIndex = WORD_TO_TRANSLATE.getIndex(),
			target = e.target,
			i;
		
		if (target.classList.contains('inactive') || target === elem) {
			return;
		}

		if ((that.toJapanese && target.innerHTML === MAIN_DICT.content[correctWordIndex].translation) ||
				(!that.toJapanese && target.innerHTML === MAIN_DICT.content[correctWordIndex].word)) {
			
			target.classList.add('correct');
		} else {
			target.classList.add('wrong');
			WRONG_ANSWERS_DICT.push(MAIN_DICT.content[correctWordIndex]);
		}
		changeProgress();
		
		for (i = 0; i < that.cards.length; i++) {
			that.cards[i].classList.add('inactive');
		}
		
		setTimeout(function () {
			target.classList.remove('correct');
			target.classList.remove('wrong');
			if (correctWordIndex + 1 === MAIN_DICT.content.length) {
				showPopup({	popup: document.getElementById('gameOverPopup'),
									popupInner: document.getElementById('gameOverPopupInner'),
									dict: WRONG_ANSWERS_DICT.content,
									id: 'gameOverPopupContent'});
				
				CONTROLS.start.onclick();
				
				return;
			}
			that.fill();
		}, 500);
	};
	
	that.fill = function (isFirst) {
		var dict = MAIN_DICT.content,
			usedWordIndexes = [],
			indexOfWordToUse,
			getRandomInt,
			correctCard,
			currentCard,
			pair,
			i;

		getRandomInt = function (min, max) {
			return Math.floor(Math.random() * (max - min + 1)) + min;
		};
		
		if (isFirst) {
			WORD_TO_TRANSLATE.set(dict, 0, DECK.toJapanese);
			elem.addEventListener('click', onCardClick, false);
			that.progressBar.classList.remove('hidden');
		} else {
			WORD_TO_TRANSLATE.set(dict, WORD_TO_TRANSLATE.getIndex() + 1, DECK.toJapanese);
		}
		
		pair = WORD_TO_TRANSLATE.getPair();
		correctCard = this.cards[getRandomInt(0, this.cards.length - 1)];
		
		if (this.toJapanese) {
			correctCard.innerHTML = pair.translation;
		} else {
			correctCard.innerHTML = pair.word;
		}
		
		for (i = 0; i < this.cards.length; i++) {
			currentCard = this.cards[i];
			
			if (currentCard.classList.contains('inactive')) {
				currentCard.classList.remove('inactive');
			}
			
			if (currentCard !== correctCard) {
				do {
					indexOfWordToUse = getRandomInt(0, dict.length - 1);
				} while (dict[indexOfWordToUse].equals(pair) || usedWordIndexes.indexOf(indexOfWordToUse) >= 0);
				usedWordIndexes.push(indexOfWordToUse);
				if (this.toJapanese) {
					currentCard.innerHTML = dict[indexOfWordToUse].translation;
				} else {
					currentCard.innerHTML = dict[indexOfWordToUse].word;
				}
			}
		}
	};
	
	that.clear = function () {
		var progress = this.progressBar.firstChild,
			card,
			i;
		
		WORD_TO_TRANSLATE.clear();
		elem.removeEventListener('click', onCardClick, false);
		this.progressBar.classList.add('hidden');
		progress.style.width = '7%';
		progress.innerHTML = '0%';
		
		for (i = 0; i < this.cards.length; i++) {
			card = this.cards[i];
			card.classList.add('inactive');
			card.innerHTML = '';
		}
	};
	
	return that;
}

function button(specs) {
	var that = {};
	
	that.elem = specs.elem;
	that.onclick = specs.onclick;
	
	that.activate = function (button) {
		this.elem.classList.remove('deactive');
	};
	
	that.deactivate = function (button) {
		this.elem.classList.add('deactive');
	};
	
	that.toggle = function (button) {
		this.elem.classList.toggle('deactive');
	};
	
	return that;
}

function controls(specs) {
	var that = {};
	
	that.start = specs.start;
	that.addWord = specs.addWord;
	that.clearDict = specs.clearDict;
	that.seeDict = specs.seeDict;
	that.addCSV = specs.addCSV;
	that.swap = specs.swap;
	that.csvInput = specs.csvInput;
	that.counters = specs.counters;
	
	that.onClickHandler = function (e) {
		var target = e.target,
			onLessonChange;
		
		onLessonChange = function (num) {
			var lesson = LESSONS[num];

			if (target.classList.contains('checked')) {
				MAIN_DICT.removeArray(lesson);
				target.classList.remove('checked');
			} else {
				MAIN_DICT.concat(lesson);
				target.classList.add('checked');
			}
			that.changeCounters();
		};

		if (target.classList.contains('deactive')) {
			return;
		}
		
		switch (target.id) {
		case 'addCSVButton':
			that.addCSV.onclick();
			break;
		case 'addWordButton':
			that.addWord.onclick();
			break;
		case 'clearDictButton':
			that.clearDict.onclick();
			break;
		case 'seeDictButton':
			that.seeDict.onclick();
			break;
		case 'swapLangsButton':
			that.swap.onclick();
			break;
		}
		
		if (target.id.indexOf('lesson') > -1) {
			onLessonChange(target.id.match(/\d+/));
		}
	};
	
	that.changeCounters = function () {
		var numOfWords = MAIN_DICT.content.length,
			cntrs = this.counters,
			toggleDictButton,
			children,
			counter,
			child,
			i,
			j;
		
		toggleDictButton = function (button) {
			if (numOfWords < 1) {
				button.deactivate();
			} else if (numOfWords > 0) {
				button.activate();
			}
		};
		
		if (numOfWords > 3) {
			this.start.activate();
		} else if (numOfWords < 4) {
			this.start.deactivate();
		}
		
		for (j = 0; j < cntrs.length; j++) {
			counter = cntrs[j];
			counter.firstChild.innerHTML = numOfWords;
			children = counter.children;
			for (i = 0; i < children.length; i++) {
				child = children[i];
				if (child.classList.contains('numOfWords')) {
					child.innerHTML = numOfWords;
				} else if (child.classList.contains('plural')) {
					if (numOfWords === 1) {
						child.classList.add('hidden');
					} else {
						child.classList.remove('hidden');
					}
				}
			}
		}
		
		toggleDictButton(CONTROLS.seeDict);
		toggleDictButton(CONTROLS.clearDict);
	};
	
	that.blinkBorders = function () {
		var removeBorderColor,
			i;
		
		removeBorderColor = function (elem) {
			elem.classList.remove('correct');
		};
		
		for (i = 0; i < arguments.length; i++) {
			arguments[i].classList.add('correct');
			setTimeout(removeBorderColor, 500, arguments[i]);
		}
	};
	
	that.onChangeHandler = function (e) {
		var target = e.target,
			fileInput;
		
		if (target.id === 'customFileInput') {
			fileInput = target.files[0];
			if (fileInput) {
				document.getElementById('fileNameOutput').innerHTML = fileInput.name;
				that.addCSV.activate();
			}
		}
	};
	
	return that;
}

//////////////////////WINDOW.onDOMContentLoaded//////////////////////

document.addEventListener("DOMContentLoaded", function (event) {
	var menuButton = button({elem: document.getElementById('menuButton')}),
		textInputs = document.querySelectorAll('input[type="text"]'),
		helpStepOne = document.getElementById('helpStepOne'),
		helpStepTwo = document.getElementById('helpStepTwo'),
		popups = document.getElementsByClassName('popup'),
		menuElement = document.getElementById('menu'),
		onSwapLangsButtonClick,
		onClearDictButtonClick,
		onAddWordButtonClick,
		onSeeDictButtonClick,
		onAddCSVButtonClick,
		onStartButtonClick,
		onInputFocus,
		onPopupClick,
		i;
	
	MAIN_DICT = dictionary();
	WRONG_ANSWERS_DICT = dictionary();
	WORD_TO_TRANSLATE = wordToTranslate(document.getElementById('wordToTranslate'));
	DECK = deck({ elem: document.getElementById('deck'),
				  progressBar: document.getElementById('progressBar'),
				  cards: document.getElementsByClassName('card')});
	
	onAddCSVButtonClick = function () {
		var csvFile = CONTROLS.csvInput.files[0],
			csvToArray,
			reader;

		csvToArray = function (text, delimiter) {
			var rows = text.split('\n'),
				result = [],
				words,
				i;

			delimiter = (delimiter || ',');
			for (i = 0; i < rows.length; i++) {
				words = rows[i].split(delimiter);
				result.push(pair({ word: words[0].trim(), translation: words[1].trim()}));
			}
			return result;
		};

		if (csvFile) {
			reader = new FileReader();
			reader.onload = function (e) {
				var nameOutput = document.getElementById('fileNameOutput');
				
				MAIN_DICT.concat(csvToArray(e.target.result));
				CONTROLS.changeCounters();
				CONTROLS.blinkBorders(nameOutput);
				CONTROLS.addCSV.deactivate();
			};
			reader.readAsText(csvFile);
		}
	};
	
	onAddWordButtonClick = function () {
		var wordInput = document.getElementById('addWordOriginal'),
			translationInput = document.getElementById('addWordTranslation'),
			inputPair = pair({ word: wordInput.value.trim(), translation: translationInput.value.trim()}),
			setToWrong;

		setToWrong = function (input) {
			input.classList.add('wrong');
		};

		//remove focus from inputs
		wordInput.blur();
		translationInput.blur();

		switch (MAIN_DICT.push(inputPair)) {
		case -3:
			setToWrong(translationInput);
			break;
		case -2:
			setToWrong(wordInput);
			break;
		case -1:
			setToWrong(wordInput);
			setToWrong(translationInput);
			break;
		case 0:
			CONTROLS.blinkBorders(wordInput, translationInput);
			CONTROLS.changeCounters();
			wordInput.value = '';
			translationInput.value = '';
			translationInput.classList.remove('japanese');
			break;
		}
	};
	
	onClearDictButtonClick = function () {
		var lessonCheckboxes = document.getElementsByClassName('menuCustomCheckbox'),
			i;

		MAIN_DICT.clear();
		CONTROLS.changeCounters();
		for (i = 0; i < lessonCheckboxes.length; i++) {
			lessonCheckboxes[i].classList.remove('checked');
		}
	};
	
	onSeeDictButtonClick = function () {
		showPopup({	popup: document.getElementById('dictPopup'),
							popupInner: document.getElementById('dictPopupInner'),
							dict: MAIN_DICT.content,
							id: 'dictPopupContent'});
	};
	
	onStartButtonClick = function () {
		if (CONTROLS.start.elem.innerHTML === 'START') {
			CONTROLS.start.elem.innerHTML = 'END';
			menuElement.classList.add('hidden');
			menuButton.deactivate();
			menuButton.elem.classList.remove('pressed');
			MAIN_DICT.shuffle();
			DECK.fill(true);
			
			if (!helpStepTwo.classList.contains('hidden')) {
				helpStepTwo.classList.add('hidden');
			}
		} else {
			CONTROLS.start.elem.innerHTML = 'START';
			menuButton.activate();
			WRONG_ANSWERS_DICT.clear();
			DECK.clear();
		}
	};
	
	onSwapLangsButtonClick = function () {
		var wordText = document.getElementById('wordLangSwapText'),
			cardsText = document.getElementById('cardsLangSwapText'),
			toJapanese = {word: 'English', cards: 'Japanese'},
			fromJapanese = {word: 'Japanese', cards: 'English'},
			i;

		if (wordText.innerHTML === toJapanese.word) {
			wordText.innerHTML = fromJapanese.word;
			cardsText.innerHTML = fromJapanese.cards;
			DECK.toJapanese = false;
			WORD_TO_TRANSLATE.elem.classList.add('japanese');

			for (i = 0; i < DECK.cards.length; i++) {
				DECK.cards[i].classList.remove('japanese');
			}
		} else {
			wordText.innerHTML = toJapanese.word;
			cardsText.innerHTML = toJapanese.cards;
			DECK.toJapanese = true;
			WORD_TO_TRANSLATE.elem.classList.remove('japanese');

			for (i = 0; i < DECK.cards.length; i++) {
				DECK.cards[i].classList.add('japanese');
			}
		}
	};
	
	CONTROLS = controls({start: button({elem: document.getElementById('startButton'),
										onclick: onStartButtonClick}),
						 clearDict: button({elem: document.getElementById('clearDictButton'),
											onclick: onClearDictButtonClick}),
						 seeDict: button({elem: document.getElementById('seeDictButton'),
										  onclick: onSeeDictButtonClick}),
						 addCSV: button({elem: document.getElementById('addCSVButton'),
										 onclick: onAddCSVButtonClick}),
						 addWord: button({elem: document.getElementById('addWordButton'),
										  onclick: onAddWordButtonClick}),
						 swap: button({elem: document.getElementById('swapLangsButton'),
									   onclick: onSwapLangsButtonClick}),
						 counters: document.getElementsByClassName('counter'),
						 csvInput: document.getElementById('customFileInput')});
	
	onInputFocus = function () {
		this.classList.remove('wrong');
	};
	
	onPopupClick = function (e) {
		var target = e.target,
			popup;
		
		if (target.classList.contains('middle') || target.parentNode.classList.contains('popupCloseButton')) {
			popup = document.querySelector('.popup[data-isopen="true"]');
			popup.classList.add('hidden');
			popup.dataset.isopen = 'false';
		}
	};
	
	//init preloaded dictionaries
	(function () {
		var preloadedDictsMenuBlock = document.getElementById('preloadedDictsMenuBlock'),
			shamovCheckBoxContainer = document.createElement('div'),
			menuCustomCheckbox = document.createElement('div'),
			id;
		
		shamovCheckBoxContainer.id = 'shamovCheckBoxContainer';
		menuCustomCheckbox.classList.add('menuCustomCheckbox');
		
		for (id in LESSONS) {
			if (LESSONS.hasOwnProperty(id)) {
				menuCustomCheckbox.id = 'lesson-' + id;
				menuCustomCheckbox.innerHTML = id;
				shamovCheckBoxContainer.appendChild(menuCustomCheckbox.cloneNode(true));
			}
		}
		
		preloadedDictsMenuBlock.replaceChild(shamovCheckBoxContainer, preloadedDictsMenuBlock.children.shamovCheckBoxContainer);
	}());
	
	wanakana.bind(textInputs[1]);
	
	menuElement.addEventListener('click', CONTROLS.onClickHandler, false);
	menuElement.addEventListener('change', CONTROLS.onChangeHandler, false);
	CONTROLS.start.elem.addEventListener('click', CONTROLS.start.onclick, false);
	menuButton.elem.addEventListener('click', function () {
		if (menuElement.classList.contains('hidden')) {
			menuElement.classList.remove('hidden');
			this.classList.add('pressed');
			
			if (!helpStepOne.classList.contains('hidden')) {
				helpStepOne.classList.add('hidden');
			}
		} else {
			menuElement.classList.add('hidden');
			this.classList.remove('pressed');
		}
	}, false);
	
	textInputs[1].addEventListener('keypress', function (e) {
		e.target.classList.add('japanese');
	}, false);
	textInputs[1].addEventListener('keydown', function (e) {
		if (e.target.value.length <= 1 && ((e.keyCode === 8 && e.target.selectionStart === 1) || (e.keyCode === 46 && e.target.selectionStart === 0))) {
			e.target.classList.remove('japanese');
		}
	}, false);
	
	for (i = 0; i < popups.length; i++) {
		popups[i].addEventListener('click', onPopupClick, false);
	}
	
	for (i = 0; i < textInputs.length; i++) {
		textInputs[i].addEventListener('focus', onInputFocus, false);
	}
});

document.documentElement.setAttribute('data-useragent', navigator.userAgent);
