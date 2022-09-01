const URL = 'http://localhost:3000';
const socket = io(URL, { autoConnect: false });

socket.onAny((event, ...args) => {
  console.log(event, args);
});

const inputUserNameForm = document.querySelector('#input-user-name-form');

const userNameInput = document.querySelector('#user-name-input');

let userName;

inputUserNameForm.addEventListener('submit', e => {
  e.preventDefault();
  userName = userNameInput.value;
  socket.auth = { userName };
  socket.connect();
});
