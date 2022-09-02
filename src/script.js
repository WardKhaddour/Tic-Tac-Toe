//ELEMENTS
//-------------------------------
const inputUserNameForm = document.querySelector('#input-user-name-form');

const userNameInput = document.querySelector('#user-name-input');

const errorUserName = document.querySelector('#error-user-name');

const clientsContainer = document.querySelector('#clients-container');

const playingRequest = document.querySelector('#playing-request');

const notificationContainer = document.querySelector('#notification-container');

const gridContainer = document.querySelector('#grid-container');

const board = document.querySelector('#board');

const cells = document.querySelectorAll('.cell');

let userName;
let myTurn = false;
let mySymbol;
//SOCKET
//-------------------------------
const URL = 'http://localhost:3000';
const socket = io(URL, { autoConnect: false });

socket.onAny((event, ...args) => {
  console.log(event, args);
});

socket.on('online clients', clients => {
  clearClients();
  clients.forEach(renderClient);
});

socket.on('client connected', renderClient);

socket.on('client disconnected', (disconnectedClient, onlineClients) => {
  clearClients();
  onlineClients.forEach(renderClient);
});

socket.on('playing request', client => {
  renderPlayingRequest(client);
});

socket.on('request accepted', () => {
  hideElement(clientsContainer);
  hideElement(notificationContainer);
  viewElement(gridContainer);
});

socket.on('request rejected', name => {
  socket.disconnect();
  notify(`${name} has rejected your request`);
});

socket.on('game started', symbol => (mySymbol = symbol));

socket.on('my turn', () => {
  cells.forEach(cell => removeClass(cell, 'blocked'));
  myTurn = true;
});

socket.on('opponent turn', () => {
  cells.forEach(cell => addClass(cell, 'blocked'));
  myTurn = false;
});

socket.on('cell selected', renderSymbol);

socket.on('win', () => {
  renderState('win');
});

socket.on('lose', () => {
  renderState('lose');
});

socket.on('tie', () => {
  renderState('tie');
});

//EVENT LISTENERS
//-------------------------------

inputUserNameForm.addEventListener('submit', getUserName);

clientsContainer.addEventListener('click', emitPlayingRequest);

playingRequest.addEventListener('click', handleResponse);

gridContainer.addEventListener('click', handleSelection);

//FUNCTIONS
//-------------------------------

function hideElement(el) {
  el.classList.add('hide');
}

function viewElement(el) {
  el.classList.remove('hide');
}

function addClass(el, className) {
  el.classList.add(className);
}

function removeClass(el, className) {
  el.classList.remove(className);
}

function getUserName(e) {
  e.preventDefault();
  userName = userNameInput.value;
  if (!userName) {
    viewElement(errorUserName);
    return;
  }
  hideElement(errorUserName);
  hideElement(inputUserNameForm);
  viewElement(clientsContainer);
  socket.auth = { userName };
  socket.connect();
}

function renderClient(client) {
  const { id, name } = client;
  if (id === socket.id) return;
  const clientEl = document.createElement('div');
  clientEl.dataset.id = id;
  clientEl.classList.add('client');
  clientEl.innerHTML = `<span> ${name}</span>
    <span><button data-id=${id} data-name=${name}>Play</button></span>`;
  clientsContainer.append(clientEl);
}

function removeClient(id) {
  const client = document.querySelector(`[data-id="${id}"]`);
  client.remove();
}

function clearClients() {
  clientsContainer.innerHTML = '';
}

function emitPlayingRequest(e) {
  if (e.target.tagName !== 'BUTTON') return;
  const opponentId = e.target.dataset.id;
  socket.emit('play against user', opponentId);
}

function renderPlayingRequest(user) {
  viewElement(playingRequest);
  addClass(playingRequest, 'flex-center');
  const request = `
  <div>
    <div>${user.name} wants to play</div>
    <div class="buttons">
      <button class="accept" data-id=${user.id}>Accept</button>
      <button class="reject" data-id=${user.id}>Reject</button>
    </div>
  </div>`;
  playingRequest.innerHTML += request;
}

function handleResponse(e) {
  if (e.target.tagName !== 'BUTTON') return;

  // requestTitle.innerText = '';
  const id = e.target.dataset.id;
  console.log(id);
  if (e.target.classList.contains('accept')) {
    //Accept Request
    removeClass(playingRequest, 'flex-center');
    hideElement(playingRequest);
    playingRequest.innerHTML = '';
    socket.emit('accept request', id);
  }
  if (e.target.classList.contains('reject')) {
    //Reject Request
    e.target.parentElement.parentElement.remove();
    if (!playingRequest.children.length) {
      removeClass(playingRequest, 'flex-center');
      hideElement(playingRequest);
    }
    socket.emit('reject request', id);
  }
}

function handleSelection(e) {
  if (!e.target.classList.contains('cell') || !myTurn) return;
  if (e.target.innerText !== '') return;
  const cell = e.target.dataset.num;

  renderSymbol(cell, mySymbol);
  socket.emit('select cell', cell);
}

function renderSymbol(cell, symbol) {
  const currentCell = [...cells].filter(c => c.dataset.num === cell)[0];
  currentCell.innerText = symbol;
  if (symbol === mySymbol) {
    addClass(currentCell, 'my-symbol');
  } else {
    addClass(currentCell, 'opponent-symbol');
  }
}

function renderState(state) {
  if (state === 'tie') notify('Game ended, Tie!');
  else notify(`Game ended, you ${state}`);
  setTimeout(reset, 1500);
}
function reset() {
  viewElement(clientsContainer);
  viewElement(notificationContainer);
  hideElement(gridContainer);
  [...cells].forEach(cell => {
    cell.innerText = '';
    cell.classList = ['cell'];
  });
  socket.disconnect();
  socket.auth = { userName };
  socket.connect();
  socket.emit('reset');
  mySymbol = undefined;
  myTurn = false;
}

function notify(message) {
  viewElement(notificationContainer);
  const notificationEl = document.createElement('div');
  notificationEl.innerText = message;
  notificationContainer.append(notificationEl);
  notificationEl.classList.add('notification');
  setTimeout(() => {
    notificationEl.remove();
  }, 2000);
}
