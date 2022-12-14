//ELEMENTS
//-------------------------------
const cells = document.querySelectorAll('.cell');

let userName;
let myTurn = false;
let mySymbol;
let opponent;

//SOCKET
//-------------------------------
const URL =
  location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : 'https://tic-tac-toe-22.glitch.me/';
const socket = io(URL, { autoConnect: false });

// socket.onAny((event, ...args) => {
//   console.log(event, args);
// });

socket.on('online clients', clients => {
  clearClients();
  if (clients.length === 1) {
    viewElement(noClients);
  } else {
    hideElement(noClients);
  }
  clients.forEach(renderClient);
});

socket.on('client connected', client => {
  hideElement(noClients);

  renderClient(client);
});

socket.on('client disconnected', (disconnectedClient, onlineClients) => {
  if (disconnectedClient === opponent) reset();
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
  addClass(gridContainer, 'flex-center');
  // opponent = id;
});

socket.on('request rejected', name => {
  // socket.disconnect();
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

socket.on('new message', renderMessage);

//EVENT LISTENERS
//-------------------------------

inputUserNameForm.addEventListener('submit', getUserName);

clientsContainer.addEventListener('click', emitPlayingRequest);

playingRequest.addEventListener('click', handleResponse);

gridContainer.addEventListener('click', handleSelection);

messageForm.addEventListener('submit', sendMessage);

toggleChatButton.addEventListener('click', toggleChat);
//FUNCTIONS
//-------------------------------

function hideElement(el) {
  el.classList.add('hide');
}

function viewElement(el) {
  el.classList.remove('hide');
}

function isViewed(el) {
  return !el.classList.contains('hide');
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
    addClass(userNameInput, 'error');
    return;
  }
  removeClass(userNameInput, 'error');
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

function clearChat() {
  messagesContainer.innerHTML = '';
}

function emitPlayingRequest(e) {
  if (e.target.tagName !== 'BUTTON') return;
  const opponentId = e.target.dataset.id;
  socket.emit('play against user', opponentId);
}

function renderPlayingRequest(user) {
  viewElement(playingRequest);
  addClass(playingRequest, 'flex-evenly-center');
  const request = `
  <div>
    <div>${user.name} wants to play</div>
    <div class="flex-around">
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
  if (e.target.classList.contains('accept')) {
    //Accept Request
    removeClass(playingRequest, 'flex-evenly-center');
    hideElement(playingRequest);
    playingRequest.innerHTML = '';
    opponent = id;
    socket.emit('accept request', id);
  }
  if (e.target.classList.contains('reject')) {
    //Reject Request
    e.target.parentElement.parentElement.remove();
    if (!playingRequest.children.length) {
      removeClass(playingRequest, 'flex-evenly-center');
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
  removeClass(gridContainer, 'flex-center');
  hideElement(gridContainer);
  clearChat();
  [...cells].forEach(cell => {
    cell.innerText = '';
    cell.classList = ['cell'];
  });
  socket.disconnect();
  socket.auth = { userName };
  socket.connect();
  mySymbol = undefined;
  myTurn = false;
}

function sendMessage(e) {
  e.preventDefault();
  const message = messageInput.value;
  if (!message) {
    return;
  }
  messageInput.value = '';
  socket.emit('message', { message, sender: userName });
  renderMessage({ message, fromMe: true, sender: 'You' });
}

function renderMessage(data) {
  const { message, fromMe, sender } = data;
  const messageEl = document.createElement('li');
  messageEl.classList.add(fromMe ? 'from-me' : 'from-opponent');
  messageEl.classList.add('message');
  messageEl.innerText = `${message}`;
  messagesContainer.append(messageEl);
  if (!isViewed(chat)) {
    toggleChat();
  }
  chat.scrollTop = chat.scrollHeight;
}

function toggleChat() {
  chat.classList.toggle('hide');
  chat.classList.toggle('flex-column-between');
}

function notify(message) {
  toggleChat();
  viewElement(notificationContainer);
  const notificationEl = document.createElement('div');
  notificationEl.innerText = message;
  notificationContainer.append(notificationEl);
  notificationEl.classList.add('notification');
  setTimeout(() => {
    notificationEl.remove();
  }, 2500);
}
