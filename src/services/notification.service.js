import { EventEmitter } from 'events';

const notificationService = new EventEmitter();

notificationService.on('user:registered', (user) => {
    console.log(`📧 [user:registered] Nuevo usuario registrado: ${user.email}`);
});

notificationService.on('user:verified', (user) => {
    console.log(`✅ [user:verified] Usuario verificado: ${user.email}`);
});

notificationService.on('user:invited', (user) => {
    console.log(`📨 [user:invited] Usuario invitado: ${user.email}`);
});

notificationService.on('user:deleted', (user) => {
    console.log(`🗑️ [user:deleted] Usuario eliminado: ${user.email}`);
});

export default notificationService;