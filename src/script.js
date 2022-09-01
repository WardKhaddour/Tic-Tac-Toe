const inputUserNameForm = document.querySelector('#input-user-name-form');

const userNameInput = document.querySelector('#user-name-input');

let userName;

inputUserNameForm.addEventListener('submit', e => {
  e.preventDefault();
  userName = userNameInput.value;
});
