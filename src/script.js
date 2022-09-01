//ELEMENTS
//-------------------------------
const inputUserNameForm = document.querySelector('#input-user-name-form');

const userNameInput = document.querySelector('#user-name-input');

const errorUserName = document.querySelector('#error-user-name');

const clientsContainer = document.querySelector('#clients-container');

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

//EVENT LISTENERS
//-------------------------------

inputUserNameForm.addEventListener('submit', getUserName);

//FUNCTIONS
//-------------------------------

function hideElement(el) {
  el.classList.add('hide');
}

function viewElement(el) {
  el.classList.remove('hide');
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
