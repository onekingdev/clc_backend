import { initFirebaseAdmin } from './services/firebase';

initFirebaseAdmin();

export * from './endpoints/auth';
export * from './endpoints/library';
export * from './endpoints/paths';
export * from './endpoints/game';
export * from './endpoints/dropShit';
export * from './endpoints/checkShit';
export * from './endpoints/glossary';
export * from './endpoints/payment';
export * from './endpoints/events';
export * from './endpoints/opened';
// @ts-ignore
export * from './mail/welcome';
export * from './mail/payment';
export * from './mail/report';
export * from './endpoints/maintain';
