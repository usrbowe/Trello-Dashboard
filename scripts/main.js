class TrelloDashboardApp {

    // init
    constructor() {
        this.appName = 'Trello Dashboard';

        // is user athorized?
        if(this.authorized()) {
            console.info(`User is authorized with this token: ${this.token}`);
            this.attachEventListeners();
            this.loadData();
        }
    }

    authorized() {
        // 1. token is in hash -> save It
        // 2. token is set in localstorage
        // 3. user is not authorized
        // if token is not loaded yet and there is hash in url
        if(location.hash) {
            // parse + save token at first authorization
            this.parseHashToken(location.hash);
            return true;
        } else if(this.loadToken()) {
            // just load token if its loaded in localstorage
            return true;
        } else {
            // user is not authorized, get token
            console.info('user has not yet been authorized');
            this.authorizeUser();
            return false;
        }
    }

    authorizeUser() {
        const appName = encodeURIComponent(this.appName);
        const url = `https://trello.com/1/authorize?callback_method=fragment&return_url=${location.href}&scope=read,write&expiration=never&name=${appName}&key=${TrelloDashboardApp.API_KEY}`;
        window.location = url;
    }

    parseHashToken(hash) {
        //@to-do: if there is more than 1 hash, find the right one + regex the token? (client.js for inspiration)
        const stripBeginning = hash.indexOf('=') + 1; // finds position of = + 1 
        const token = hash.substr(stripBeginning); // returns only token from hash

        if(token !== '' || token !== undefined) {
            location.hash = ''; // clear hash token
            this.saveToken(token);
        } else {
            console.error('Token was not parsed');
        }
    }

    saveToken(token) {
        localStorage.setItem('trello_token', token);
        this.loadToken();
    }

    loadToken() {
        const token = localStorage.getItem('trello_token');
        this.token = token; // save it scoped for easier acces within instance
        TrelloDashboardApp.TOKEN = token; // save it to class for out of instance access
        return token === null ? false : true;
    }

    attachEventListeners() {
        // CLICK
        document.querySelector('.js-add-column').addEventListener('click', () => this.addColumn());
    }

    addColumn(column = {}, saveNew = true) {
        let name = column.name || prompt('Tell me the name of Column');
        let query = column.query || prompt('Paste your search query');
        let newColumn = new Column(name, query);

        // save only if column created by user
        if(saveNew) {
            TrelloDashboardApp.DATA.columns.push(newColumn);
        }
        this.saveData();
    }

    loadData() {
        let data = JSON.parse(localStorage.getItem('TrelloAppDashboard_DATA'));
        if(data === null) return;
        TrelloDashboardApp.DATA = data;
        
        // Reinitialize all columns
        TrelloDashboardApp.DATA.columns.forEach((column, i) => {
            this.addColumn(column, false);
        });
    }

    saveData() {
        localStorage.setItem('TrelloAppDashboard_DATA', JSON.stringify(TrelloDashboardApp.DATA));
    }

    removeColumn() {

    }
}

TrelloDashboardApp.API_KEY = ''; // paste your own APP key from Trello
TrelloDashboardApp.TOKEN = ''; // will be set after user auth.
// Trello API object
TrelloDashboardApp.API = (method) => {
    if(method) {
        return `https://api.trello.com/1/${method}?key=${TrelloDashboardApp.API_KEY}&token=${TrelloDashboardApp.TOKEN}`;
    } else {
        console.error('API method must be specified');
    }
};

// app native elements
TrelloDashboardApp.EL = {
    columnWrapper: document.querySelector('.js-column-wrapper')
};

TrelloDashboardApp.DATA = {
    columns: []
}

window.addEventListener('DOMContentLoaded', () => new TrelloDashboardApp());

/*================================================================================================*/
/*== lines below should be separated into modules and loaded via require or better with modules.export ==*/
/*================================================================================================*/

/*
 * Class: COLUMN
 * Description: creates new column in dashboard
 */
class Column {

    //init
    constructor(name, query) {
        this.name = name;
        this.query = query;

        this.addColumn();
        this.addQuery();
    }

    static generateId() {
        return Math.floor( Math.random() * (9999 - 99 + 1) ) + 99;
    }

    addColumn() {
        const columnWrapper = TrelloDashboardApp.EL.columnWrapper;

        this.element = document.createElement('div');
        this.element.classList.add('column');
        this.element.dataset.id = Column.generateId();
        this.element.innerHTML = this.innerTemplate({ name: this.getTitle() });

        columnWrapper.appendChild(this.element);

        this.element.addEventListener('click', this.clicked);

        // save element as column
        this.column = this.element;

    }

    addQuery() {
        this.element.dataset.query = this.query;
        this.loadCards();
    }

    loadCards() {
        const query = encodeURIComponent(this.query);
        const url = TrelloDashboardApp.API('search') + `&query=${query}`;

        fetch(url).then((result) => {
            return result.json();
        }).then((json) => {
            console.log(json);
            this.addCards(json.cards);
        }).catch((error) => {
            console.error(`Something went wrong: ${error}`);
            //@to-do: also discard adding new column
        });
    }

    addCards(cards) {
        cards.forEach((card, i) => {
            console.log(card);
            let newCard = new Card(card, this.column);
            //@end-of-day: create new class for: Card(column, cardData);
        });
    }

    innerTemplate(data) {
        return `<div class="column-heading">${data.name}</div>`;
    }

    clicked() {
        console.log(`You just clicked on: ${this.dataset.id}`);
    }

    getTitle() {
        return this.name;
    }   

}

/*
 * Class: Card
 * Description: creates new card in column
 */
//@to-do: load all card data via API into some object and after that paste it to DOM. (prevent flickering of downloaded data)
class Card {

    constructor(card, column) {
        this.card = card;
        this.column = column;

        this.addCard();
    }

    addCard() {
        this.column.innerHTML += this.cardTemplate();
    }

    cardTemplate() {
        return `<div class="card">${this.card.name}</div>`;
    } 

}