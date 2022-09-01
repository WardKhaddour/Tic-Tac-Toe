//ELEMENTS
//-------------------------------
const inputUserNameForm = document.querySelector('#input-user-name-form');

const userNameInput = document.querySelector('#user-name-input');

const errorUserName = document.querySelector('#error-user-name');

const clientsContainer = document.querySelector('#clients-container');

const playingRequest = document.querySelector('#playing-request');

const notification = document.querySelector('#notification');

// const requestTitle = document.querySelector('#request-title');

let userName;

//SOCKET
//-------------------------------
const URL = 'http://localhost:3000';
const socket = io(URL, { autoConnect: false });

socket.onAny((event, ...args) => {
  console.log(event, args);
});

socket.on('online clients', clients => {
  clients.forEach(renderClient);
});

socket.on('client connected', renderClient);
socket.on('client disconnected', removeClient);

socket.on('playing request', client => {
  renderPlayingRequest(client);
});

socket.on('request rejected', name => {
  notify(`${name} has rejected your request`);
});

//EVENT LISTENERS
//-------------------------------

inputUserNameForm.addEventListener('submit', getUserName);

clientsContainer.addEventListener('click', emitPlayingRequest);

playingRequest.addEventListener('click', handleResponse);

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

function notify(message) {
  viewElement(notification);
  const notificationEl = document.createElement('div');
  notificationEl.innerText = message;
  notification.append(notificationEl);
  setTimeout(() => {
    notificationEl.remove();
    hideElement(notification);
  }, 2000);
}
