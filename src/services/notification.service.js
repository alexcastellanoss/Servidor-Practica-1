import { EventEmitter } from 'events';

const notificationService = new EventEmitter();

notificationService.on('user:registered', (user) => {
    console.log(`Nuevo usuario registrado: ${user.email}`);
});

notificationService.on('user:verified', (user) => {
    console.log(`Usuario verificado: ${user.email}`);
});

notificationService.on('user:invited', (user) => {
    console.log(`Usuario invitado: ${user.email}`);
});

notificationService.on('user:deleted', (user) => {
    console.log(`Usuario eliminado: ${user.email}`);
});

export default notificationService;